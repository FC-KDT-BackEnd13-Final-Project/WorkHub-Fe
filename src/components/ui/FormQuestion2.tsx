import {
    useState,
    useEffect,
    useMemo,
    useRef,
    forwardRef,
    useImperativeHandle,
    useCallback,
} from "react";
import { Card2, CardContent, CardHeader } from "./card2";
import { Label2 } from "./label2";
import { CheckboxQuestion2 } from "./CheckboxQuestion2";
import { Textarea2 } from "./textarea2";
import { Button2 } from "./button2";
import {
    CornerDownRight,
    MessagesSquare,
    MoreVertical,
    Paperclip,
} from "lucide-react";
import { ModalShell } from "../common/ModalShell";
import { historyApi } from "@/lib/history";
import type {
    AdminActionType,
    AdminHistoryItem,
    AdminHistoryPage,
} from "@/types/history";
import type {
    CheckListCommentFileResponse,
    CheckListCommentResponse,
    CheckListItemPayload,
    CheckListItemResponse,
    CheckListItemStatus,
    CheckListOptionPayload,
    CheckListOptionResponse,
} from "@/types/checkList";

interface ChecklistSubmissionPayload {
    items: CheckListItemPayload[];
    files: File[];
}

interface ChecklistRemoteFile {
    id: string;
    fileKey: string;
    fileName: string;
}

interface EvidenceItem {
    files: File[];
    links: string[];
    remoteFiles?: ChecklistRemoteFile[];
}

interface ChecklistReply {
    id: number;
    text: string;
    author: string;
    createdAt: string;
    updatedAt?: string | null;
    menuOpen: boolean;
    isEditing: boolean;
    editDraft: string;
    parentReplyId?: number | null;
    parentAuthor?: string | null;
    attachments: CommentAttachment[];
    editAttachmentDraft?: CommentAttachment[];
}

interface CommentAttachment {
    id: number;
    file?: File;
    fileName: string;
    fileUrl?: string;
    fileKey?: string;
    isRemote?: boolean;
}

type ChecklistHistoryAction = "created" | "edited" | "deleted";

interface ChecklistHistoryEntry {
    id: number;
    targetId: number;
    parentCommentId: number | null;
    type: "comment" | "reply";
    action: ChecklistHistoryAction;
    author: string;
    content: string;
    timestamp: string;
}

interface ChecklistHistoryLogEntry {
    id: number;
    groupId: number;
    groupTitle: string;
    author: string;
    content: string;
    timestamp: string;
    action: ChecklistHistoryAction;
    type: "checklist";
}

interface HistoryTargetMeta {
    id: number;
    type: "comment" | "reply";
    parentCommentId: number | null;
    author: string;
    latestContent: string;
    latestTimestamp: string;
    isDeleted: boolean;
}

interface ChecklistComment {
    id: number;
    text: string;
    createdAt: string;
    author: string;
    updatedAt?: string | null;
    replies: ChecklistReply[];
    menuOpen: boolean;
    isEditing: boolean;
    isEditSubmitting?: boolean;
    editDraft: string;
    showReplyBox: boolean;
    replyDraft: string;
    replyingToReplyId: number | null;
    replyingToAuthor: string | null;
    replyAttachmentDraft: CommentAttachment[];
    attachments: CommentAttachment[];
    editAttachmentDraft?: CommentAttachment[];
}

interface ChecklistGroup {
    id: number;
    title: string;
    rules: string[];
    optionIds: number[];
    selectedIndexes: number[];
    evidences: Record<string, EvidenceItem>;
    comments: ChecklistComment[];
    commentDraft: string;
    commentAttachmentDraft: CommentAttachment[];
    isCommentOpen: boolean;
    status: CheckListItemStatus;
    locked: boolean;
    checkListItemId: number | null;
    isStatusUpdating: boolean;
    isCommentSubmitting: boolean;
    openCommentMenuId: number | null;
    isCommentLoading: boolean;
    hasFetchedComments: boolean;
    commentError: string | null;
    historyEntries: ChecklistHistoryEntry[];
    isHistoryOpen: boolean;
    historySelectedTargetId: number | null;
    commentHistoryCache: Record<number, ChecklistHistoryEntry[]>;
    commentHistoryLoading: boolean;
    commentHistoryError: string | null;
    commentHistoryLoadingTargetId: number | null;
}

interface FormQuestionProps {
    resetSignal: number;
    disabled?: boolean;
    unlockSignal?: number;
    allowSelectionWhenDisabled?: boolean;
    allowCommentWhenDisabled?: boolean;
    commentAuthor?: string;
    saveSignal?: number;
    onRemoteFileDownload?: (fileKey: string, fileName: string) => void;
    onItemStatusUpdate?: (
        checkListItemId: number,
        status: CheckListItemStatus,
    ) => Promise<boolean>;
    showDecisionButtons?: boolean;
    showStatusBadges?: boolean;
    onOptionToggle?: (payload: {
        checkListItemId: number;
        optionId: number;
        checked: boolean;
    }) => Promise<boolean | void>;
    onSubmitComment?: (payload: {
        checkListItemId: number;
        content: string;
        attachments: File[];
        fileMeta: { fileName: string; fileOrder: number }[];
        parentCommentId?: number | null;
    }) => Promise<CheckListCommentResponse | void>;
    onUpdateComment?: (payload: {
        checkListItemId: number;
        commentId: number;
        content: string;
        attachments: File[];
        fileMeta: { fileName: string; fileOrder: number }[];
    }) => Promise<CheckListCommentResponse | void>;
    onFetchComments?: (checkListItemId: number) => Promise<CheckListCommentResponse[] | void>;
    onDeleteComment?: (payload: { checkListItemId: number; commentId: number }) => Promise<void>;
}

export interface FormQuestionHandle {
    getChecklistSubmission: () => ChecklistSubmissionPayload;
    setChecklistItems: (items?: CheckListItemResponse[]) => void;
}

const createChecklistGroup = (id: number): ChecklistGroup => ({
    id,
    title: "",
    rules: Array(6).fill(""),
    optionIds: [],
    selectedIndexes: [],
    evidences: {},
    comments: [],
    commentDraft: "",
    commentAttachmentDraft: [],
    isCommentOpen: false,
    status: "PENDING",
    locked: false,
    checkListItemId: null,
    isStatusUpdating: false,
    isCommentSubmitting: false,
    openCommentMenuId: null,
    isCommentLoading: false,
    hasFetchedComments: false,
    commentError: null,
    historyEntries: [],
    isHistoryOpen: false,
    historySelectedTargetId: null,
    commentHistoryCache: {},
    commentHistoryLoading: false,
    commentHistoryError: null,
    commentHistoryLoadingTargetId: null,
});

const normalizeChecklistStatus = (
    status?: CheckListItemStatus | null,
): CheckListItemStatus => {
    if (status === "AGREED" || status === "ON_HOLD") {
        return status;
    }
    return "PENDING";
};

export const FormQuestion2 = forwardRef<FormQuestionHandle, FormQuestionProps>(function FormQuestion2(
    {
        resetSignal,
        disabled = false,
        unlockSignal = 0,
        allowSelectionWhenDisabled = false,
        allowCommentWhenDisabled = false,
        commentAuthor = "작성자",
        saveSignal = 0,
        onRemoteFileDownload,
        onItemStatusUpdate,
        showDecisionButtons = true,
        showStatusBadges = false,
        onOptionToggle,
        onSubmitComment,
        onUpdateComment,
        onFetchComments,
        onDeleteComment,
    },
    ref,
) {
    const [groups, setGroups] = useState<ChecklistGroup[]>([
        createChecklistGroup(1),
    ]);
    const [isHistoryPickerOpen, setIsHistoryPickerOpen] = useState(false);
    const [isChecklistHistoryOpen, setChecklistHistoryOpen] = useState(false);
    const [selectedHistoryGroupIndex, setSelectedHistoryGroupIndex] = useState<number | null>(null);
    const [checklistHistoryLogs, setChecklistHistoryLogs] = useState<
        ChecklistHistoryLogEntry[]
    >([]);
    const [remoteHistoryPage, setRemoteHistoryPage] = useState<AdminHistoryPage | null>(null);
    const [remoteHistoryLoading, setRemoteHistoryLoading] = useState(false);
    const [remoteHistoryError, setRemoteHistoryError] = useState<string | null>(null);
    const [remoteHistoryPageIndex, setRemoteHistoryPageIndex] = useState(0);
    const lastSavedSnapshotRef = useRef<Map<number, string>>(new Map());

    const canSelect = !disabled || allowSelectionWhenDisabled;
    const canComment = !disabled || allowCommentWhenDisabled;
    const canDecide =
        (!disabled || allowSelectionWhenDisabled || Boolean(onItemStatusUpdate)) &&
        showDecisionButtons;
    const isCommentInteractionLocked = (group: ChecklistGroup) =>
        group.locked && !allowCommentWhenDisabled;

    const createHistoryEntry = (
        payload: Omit<ChecklistHistoryEntry, "id" | "timestamp">,
    ): ChecklistHistoryEntry => ({
        id: Date.now() + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        ...payload,
    });

    const groupsRef = useRef(groups);
    useEffect(() => {
        groupsRef.current = groups;
    }, [groups]);

    const handleOptionSelectionChange = useCallback(
        ({
             groupIndex,
             optionIndex,
             checked,
         }: {
            groupIndex: number;
            optionIndex: number;
            checked: boolean;
        }) => {
            if (!canSelect) {
                return;
            }

            const targetGroup = groupsRef.current[groupIndex];
            const isGroupLocked = targetGroup?.locked && !allowSelectionWhenDisabled;
            if (!targetGroup || isGroupLocked) {
                return;
            }

            const previousSelected = [...targetGroup.selectedIndexes];
            const alreadySelected = previousSelected.includes(optionIndex);
            if ((checked && alreadySelected) || (!checked && !alreadySelected)) {
                return;
            }

            const appendSelection = (values: number[]) =>
                values.includes(optionIndex)
                    ? values
                    : [...values, optionIndex];
            const removeSelection = (values: number[]) =>
                values.filter((value) => value !== optionIndex);

            setGroups((prev) =>
                prev.map((group, idx) => {
                    if (idx !== groupIndex || (group.locked && !allowSelectionWhenDisabled)) {
                        return group;
                    }
                    const nextSelected = checked
                        ? appendSelection(group.selectedIndexes)
                        : removeSelection(group.selectedIndexes);
                    return {
                        ...group,
                        selectedIndexes: nextSelected,
                    };
                }),
            );

            const optionId = targetGroup.optionIds[optionIndex];
            const itemId = targetGroup.checkListItemId;
            if (!onOptionToggle || !itemId || typeof optionId !== "number") {
                return;
            }

            void (async () => {
                try {
                    const serverState = await onOptionToggle({
                        checkListItemId: itemId,
                        optionId,
                        checked,
                    });
                    if (typeof serverState === "boolean" && serverState !== checked) {
                        setGroups((prev) =>
                            prev.map((group, idx) => {
                                if (idx !== groupIndex) {
                                    return group;
                                }
                                const nextSelected = serverState
                                    ? appendSelection(group.selectedIndexes)
                                    : removeSelection(group.selectedIndexes);
                                return {
                                    ...group,
                                    selectedIndexes: nextSelected,
                                };
                            }),
                        );
                    }
                } catch {
                    setGroups((prev) =>
                        prev.map((group, idx) =>
                            idx === groupIndex
                                ? {
                                      ...group,
                                      selectedIndexes: previousSelected,
                                  }
                                : group,
                        ),
                    );
                }
            })();
        },
        [canSelect, onOptionToggle],
    );

    const requestStatusChange = useCallback(
        async (groupIndex: number, nextStatus: CheckListItemStatus) => {
            if (!onItemStatusUpdate) {
                setGroups((prev) =>
                    prev.map((group, index) =>
                        index === groupIndex
                            ? { ...group, status: nextStatus, locked: true }
                            : group,
                    ),
                );
                return;
            }

            const targetGroup = groupsRef.current[groupIndex];
            if (!targetGroup || !targetGroup.checkListItemId) {
                return;
            }

            setGroups((prev) =>
                prev.map((group, index) =>
                    index === groupIndex
                        ? { ...group, isStatusUpdating: true }
                        : group,
                ),
            );

            try {
                const success = await onItemStatusUpdate(
                    targetGroup.checkListItemId,
                    nextStatus,
                );
                setGroups((prev) =>
                    prev.map((group, index) => {
                        if (index !== groupIndex) {
                            return group;
                        }
                        if (!success) {
                            return { ...group, isStatusUpdating: false };
                        }
                        return {
                            ...group,
                            status: nextStatus,
                            locked: true,
                            isStatusUpdating: false,
                        };
                    }),
                );
            } catch (error) {
                setGroups((prev) =>
                    prev.map((group, index) =>
                        index === groupIndex
                            ? { ...group, isStatusUpdating: false }
                            : group,
                    ),
                );
            }
        },
        [onItemStatusUpdate],
    );

    const shouldDisableDecisionActions = useCallback(
        (group: ChecklistGroup) =>
            !canDecide ||
            group.isStatusUpdating ||
            (Boolean(onItemStatusUpdate) && !group.checkListItemId),
        [canDecide, onItemStatusUpdate],
    );

    const getStatusBadgeMeta = (status?: CheckListItemStatus | null) => {
        const normalized = normalizeChecklistStatus(status);
        switch (normalized) {
            case "AGREED":
                return {
                    label: "AGREED",
                    className:
                        "border border-emerald-200 bg-emerald-100 text-emerald-800",
                };
            case "ON_HOLD":
                return {
                    label: "ON_HOLD",
                    className: "border border-slate-300 bg-slate-200 text-slate-800",
                };
            case "PENDING":
            default:
                return {
                    label: "PENDING",
                    className: "border border-amber-200 bg-amber-100 text-amber-800",
                };
        }
    };

    const buildChecklistSubmission = (
        sourceGroups: ChecklistGroup[],
    ): ChecklistSubmissionPayload => {
        const attachments: File[] = [];

        const items = sourceGroups
            .map((group, groupIndex) => {
                const options: CheckListOptionPayload[] = group.rules
                    .map((rule, optionIndex) => {
                        const optionContent = rule?.trim();
                        if (!optionContent) {
                            return null;
                        }
                        const evidenceKey = `preCheck-${group.id}-${optionIndex}`;
                        const evidenceItem = group.evidences[evidenceKey];
                        const linkUrls =
                            evidenceItem?.links
                                ?.map((link) => link.trim())
                                .filter(Boolean) ?? [];

                        const remoteFileKeys =
                            evidenceItem?.remoteFiles
                                ?.map((remote) => remote.fileKey?.trim())
                                .filter((key): key is string => Boolean(key)) ?? [];

                        const normalizedFiles = (evidenceItem?.files ?? []).map(
                            (file, fileIndex) => {
                                const safeName = file.name?.trim();
                                if (safeName) {
                                    return file;
                                }
                                const generatedName = `attachment-${group.id}-${optionIndex + 1}-${
                                    fileIndex + 1
                                }`;
                                return new File([file], generatedName, {
                                    type: file.type,
                                });
                            },
                        );

                        normalizedFiles.forEach((file) => attachments.push(file));

                        const attachmentNames = normalizedFiles
                            .map((file) => file.name?.trim())
                            .filter((name): name is string => Boolean(name));

                        return {
                            optionContent,
                            optionOrder: optionIndex,
                            fileUrls: [...remoteFileKeys, ...linkUrls, ...attachmentNames],
                        };
                    })
                    .filter((option): option is CheckListOptionPayload => Boolean(option));

                if (!options.length) {
                    return null;
                }

                return {
                    itemTitle: group.title?.trim() || `체크리스트 ${groupIndex + 1}`,
                    itemOrder: groupIndex,
                    templateId: null,
                    options,
                } as CheckListItemPayload;
            })
            .filter((item): item is CheckListItemPayload => Boolean(item));

        return {
            items,
            files: attachments,
        };
    };

    const applyChecklistItemsToGroups = (items?: CheckListItemResponse[]) => {
        if (!items || items.length === 0) {
            setGroups([createChecklistGroup(1)]);
        } else {
            const sortedItems = [...items].sort(
                (a, b) => (a.itemOrder ?? 0) - (b.itemOrder ?? 0),
            );
            const nextGroups = sortedItems.map((item, index) => {
                const baseGroup = createChecklistGroup(index + 1);
                const sortedOptions: CheckListOptionResponse[] = [...(item.options ?? [])].sort(
                    (a, b) => (a.optionOrder ?? 0) - (b.optionOrder ?? 0),
                );
                const nextRules = sortedOptions.length
                    ? sortedOptions.map((option) => option.optionContent ?? "")
                    : [""];
                const nextOptionIds = sortedOptions.length
                    ? sortedOptions.map((option) => option.checkListOptionId)
                    : [];
                const normalizedStatus = normalizeChecklistStatus(item.status ?? null);
                const statusLocked = normalizedStatus !== "PENDING";

                // isSelected가 true인 옵션의 인덱스를 selectedIndexes로 변환
                const nextSelectedIndexes = sortedOptions
                    .map((option, idx) => (option.isSelected ? idx : -1))
                    .filter((idx) => idx !== -1);

                const evidences: Record<string, EvidenceItem> = {};
                sortedOptions.forEach((option, optionIndex) => {
                    const evidenceKey = `preCheck-${baseGroup.id}-${optionIndex}`;
                    const remoteFiles: ChecklistRemoteFile[] = (option.files ?? []).map(
                        (file, fileIndex) => {
                            const fileUrl = extractServerFileUrl(file);
                            const fileName =
                                extractServerFileName(file) ??
                                fileUrl ??
                                `첨부-${optionIndex + 1}`;

                            return {
                                id:
                                    String(
                                        file.checkListOptionFileId ??
                                            `${
                                                option.checkListOptionId ??
                                                item.checkListItemId ??
                                                baseGroup.id
                                            }-${fileIndex}`,
                                    ),
                                fileKey: fileUrl ?? fileName,
                                fileName,
                            };
                        },
                    );
                    evidences[evidenceKey] = {
                        files: [],
                        links: [],
                        remoteFiles,
                    };
                });

                return {
                    ...baseGroup,
                    title: item.itemTitle ?? "",
                    rules: nextRules.length ? nextRules : [""],
                    optionIds: nextOptionIds,
                    selectedIndexes: nextSelectedIndexes,
                    evidences,
                    status: normalizedStatus,
                    locked: statusLocked,
                    checkListItemId: item.checkListItemId ?? null,
                    isCommentSubmitting: false,
                };
            });
        setGroups(nextGroups);
    }

    setChecklistHistoryLogs([]);
    setChecklistHistoryOpen(false);
    lastSavedSnapshotRef.current = new Map();
};

    useImperativeHandle(
        ref,
        () => ({
            getChecklistSubmission: () => buildChecklistSubmission(groupsRef.current),
            setChecklistItems: (items?: CheckListItemResponse[]) =>
                applyChecklistItemsToGroups(items),
        }),
        [],
    );


    const createAttachment = (file: File): CommentAttachment => ({
        id: Date.now() + Math.floor(Math.random() * 1000),
        file,
        fileName: file.name || "첨부파일",
    });

    const cloneCommentAttachments = (attachments: CommentAttachment[]) =>
        attachments.map((attachment) => ({ ...attachment }));

    type ServerFilePayload = {
        fileUrl?: string | null;
        fileName?: string | null;
        file_url?: string | null;
        file_name?: string | null;
    };

    const extractServerFileUrl = (file: ServerFilePayload) => {
        const url = typeof file.fileUrl === "string" ? file.fileUrl.trim() : "";
        if (url) {
            return url;
        }
        const snakeUrl = typeof file.file_url === "string" ? file.file_url.trim() : "";
        return snakeUrl || undefined;
    };

    const extractServerFileName = (file: ServerFilePayload) => {
        const name = typeof file.fileName === "string" ? file.fileName.trim() : "";
        if (name) {
            return name;
        }
        const snakeName = typeof file.file_name === "string" ? file.file_name.trim() : "";
        return snakeName || undefined;
    };

    const mapServerAttachments = (
        files?: CheckListCommentFileResponse[] | null,
    ): CommentAttachment[] => {
        if (!files || files.length === 0) {
            return [];
        }

        const sorted = [...files].sort(
            (a, b) => (a.fileOrder ?? 0) - (b.fileOrder ?? 0),
        );

        return sorted.map((file, index) => {
            const resolvedId =
                (typeof file.checkListCommentFileId === "number" && file.checkListCommentFileId > 0
                    ? file.checkListCommentFileId
                    : undefined) ??
                (typeof file.commentFileId === "number" && file.commentFileId > 0
                    ? file.commentFileId
                    : undefined) ??
                Date.now() + index + Math.floor(Math.random() * 1000);
            const fileUrl = extractServerFileUrl(file);
            const fileName = extractServerFileName(file) ?? fileUrl ?? `첨부-${index + 1}`;

            return {
                id: resolvedId,
                fileName,
                fileUrl: fileUrl,
                fileKey: fileUrl ?? fileName ?? undefined,
                isRemote: true,
            };
        });
    };

    const getServerFileLookupKey = (
        file: CheckListCommentFileResponse,
        fallbackIndex: number,
    ): string => {
        const primaryId =
            file.checkListCommentFileId ?? file.commentFileId ?? null;
        if (primaryId != null) {
            return `id-${primaryId}`;
        }

        if (typeof file.fileOrder === "number") {
            return `order-${file.fileOrder}`;
        }

        const normalizedUrl = extractServerFileUrl(file);
        if (normalizedUrl) {
            return `url-${normalizedUrl}`;
        }

        const normalizedName = extractServerFileName(file);
        if (normalizedName) {
            return `name-${normalizedName}`;
        }

        return `index-${fallbackIndex}`;
    };

    const mergeServerFilePayloads = (
        primary?: CheckListCommentFileResponse[] | null,
        fallback?: CheckListCommentFileResponse[] | null,
    ): CheckListCommentFileResponse[] => {
        const primaryList = Array.isArray(primary) ? primary : [];
        const fallbackList = Array.isArray(fallback) ? fallback : [];
        if (primaryList.length === 0) {
            return fallbackList;
        }
        if (fallbackList.length === 0) {
            return primaryList;
        }

        const primaryHasUrls = primaryList.some((file) => Boolean(extractServerFileUrl(file)));
        if (primaryHasUrls) {
            return primaryList;
        }

        const fallbackMap = new Map<string, CheckListCommentFileResponse>();
        fallbackList.forEach((file, index) => {
            fallbackMap.set(getServerFileLookupKey(file, index), file);
        });

        return primaryList.map((file, index) => {
            const key = getServerFileLookupKey(file, index);
            const fallbackFile = fallbackMap.get(key);
            if (!fallbackFile) {
                return file;
            }
            return {
                ...fallbackFile,
                ...file,
                fileUrl: extractServerFileUrl(file) ?? extractServerFileUrl(fallbackFile),
                fileName:
                    extractServerFileName(file) ?? extractServerFileName(fallbackFile),
                fileOrder: file.fileOrder ?? fallbackFile.fileOrder,
            };
        });
    };

    const resolveResponseFiles = (item: CheckListCommentResponse) => {
        const attachments = Array.isArray(item.attachments) ? item.attachments : null;
        const files = Array.isArray(item.files) ? item.files : null;
        const mergedFiles = mergeServerFilePayloads(attachments, files);
        return mapServerAttachments(mergedFiles);
    };

    const resolveCommentId = (item: CheckListCommentResponse): number => {
        if (typeof item.checkListCommentId === "number") {
            return item.checkListCommentId;
        }
        if (typeof item.clCommentId === "number") {
            return item.clCommentId;
        }
        return Date.now() + Math.floor(Math.random() * 1000);
    };

    const resolveParentCommentId = (item: CheckListCommentResponse) => {
        const parentId =
            (typeof item.parentCommentId === "number" ? item.parentCommentId : null) ??
            (typeof item.parentClCommentId === "number" ? item.parentClCommentId : null);
        return parentId ?? null;
    };

    const resolveAuthorName = (item: CheckListCommentResponse) => {
        const fallback = commentAuthor;
        const raw = item.authorName ?? item.userName;
        if (typeof raw === "string" && raw.trim().length > 0) {
            return raw.trim();
        }
        return fallback;
    };

    const flattenRepliesFromTree = (
        nodes: CheckListCommentResponse[] | undefined,
        parentReplyId: number | null = null,
        parentAuthor: string | null = null,
    ): ChecklistReply[] => {
        if (!nodes || nodes.length === 0) {
            return [];
        }

        const replies: ChecklistReply[] = [];
        nodes.forEach((node) => {
            const replyId = resolveCommentId(node);
            const replyAuthor = resolveAuthorName(node);
            replies.push({
                id: replyId,
                text: node.content ?? "",
                author: replyAuthor,
                createdAt: node.createdAt ?? new Date().toISOString(),
                updatedAt: node.updatedAt ?? null,
                menuOpen: false,
                isEditing: false,
                editDraft: node.content ?? "",
                parentReplyId,
                parentAuthor,
                attachments: resolveResponseFiles(node),
                editAttachmentDraft: [],
            });

            const childReplies = flattenRepliesFromTree(
                Array.isArray(node.children) ? node.children : undefined,
                replyId,
                replyAuthor,
            );
            if (childReplies.length > 0) {
                replies.push(...childReplies);
            }
        });

        return replies;
    };

    const createLocalCommentRecord = (
        text: string,
        attachments: CommentAttachment[],
    ): ChecklistComment => ({
        id: Date.now() + Math.floor(Math.random() * 1000),
        text,
        createdAt: new Date().toISOString(),
        author: commentAuthor,
        updatedAt: null,
        replies: [],
        menuOpen: false,
        isEditing: false,
        isEditSubmitting: false,
        editDraft: "",
        showReplyBox: false,
        replyDraft: "",
        replyingToReplyId: null,
        replyingToAuthor: null,
        replyAttachmentDraft: [],
        attachments,
        editAttachmentDraft: [],
    });

    const normalizeServerComments = useCallback(
        (items?: CheckListCommentResponse[] | null) => {
            if (!items || items.length === 0) {
                return [];
            }

            const parseTimestamp = (value?: string | null) => {
                if (!value) return 0;
                const date = new Date(value);
                return Number.isNaN(date.getTime()) ? 0 : date.getTime();
            };

            const useChildrenTree = items.some((item) => Array.isArray(item.children));

            const toComment = (item: CheckListCommentResponse): ChecklistComment => ({
                id: resolveCommentId(item),
                text: item.content ?? "",
                createdAt: item.createdAt ?? new Date().toISOString(),
                author: resolveAuthorName(item),
                updatedAt: item.updatedAt ?? null,
                replies: [],
                menuOpen: false,
                isEditing: false,
                isEditSubmitting: false,
                editDraft: "",
                showReplyBox: false,
                replyDraft: "",
                replyingToReplyId: null,
                replyingToAuthor: null,
                replyAttachmentDraft: [],
                attachments: resolveResponseFiles(item),
                editAttachmentDraft: [],
            });

            if (useChildrenTree) {
                return items
                    .map((item) => {
                        const comment = toComment(item);
                        comment.replies = flattenRepliesFromTree(
                            Array.isArray(item.children) ? item.children : undefined,
                        );
                        return comment;
                    })
                    .sort(
                        (a, b) => parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt),
                    );
            }

            const parents: CheckListCommentResponse[] = [];
            const replies: CheckListCommentResponse[] = [];

            items.forEach((item) => {
                const parentId = resolveParentCommentId(item);
                if (parentId != null) {
                    replies.push(item);
                } else {
                    parents.push(item);
                }
            });

            const replyBuckets = new Map<number, CheckListCommentResponse[]>();
            replies.forEach((reply) => {
                const parentId = resolveParentCommentId(reply);
                if (parentId == null) return;
                const bucket = replyBuckets.get(parentId) ?? [];
                bucket.push(reply);
                replyBuckets.set(parentId, bucket);
            });

            parents.sort(
                (a, b) => parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt),
            );

            return parents.map((parent) => {
                const comment = toComment(parent);
                const bucket = replyBuckets.get(resolveCommentId(parent));
                if (bucket && bucket.length > 0) {
                    comment.replies = flattenRepliesFromTree(bucket);
                }
                return comment;
            });
        },
        [commentAuthor],
    );

    const formatHistoryTimestamp = (value?: string | null) => {
        if (!value) return "시간 정보 없음";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString();
    };
    const mapAdminActionToHistoryAction = (
        actionType: AdminActionType,
    ): ChecklistHistoryAction => {
        switch (actionType) {
            case "DELETE":
            case "HIDE":
                return "deleted";
            case "UPDATE":
            case "MOVE":
                return "edited";
            default:
                return "created";
        }
    };
    const extractCommentContentFromHistory = (history: AdminHistoryItem) => {
        const tryParse = (raw?: string | null) => {
            if (!raw) return null;
            try {
                return JSON.parse(raw);
            } catch {
                return raw;
            }
        };

        const candidate = tryParse(history.afterData) ?? tryParse(history.beforeData);
        if (typeof candidate === "string") return candidate;
        if (candidate && typeof candidate === "object") {
            const maybeObject = candidate as Record<string, unknown>;
            const contentKeys = [
                "qnaContent",
                "content",
                "text",
                "clContent",
                "comment",
                "commentContent",
                "replyContent",
                "description",
                "message",
                "body",
            ] as const;

            for (const key of contentKeys) {
                const value = maybeObject[key];
                if (typeof value === "string" && value) {
                    return value;
                }
            }

            return "";
        }
        return history.afterData || history.beforeData || "";
    };
    const mapAdminHistoryToChecklistEntry = (history: AdminHistoryItem): ChecklistHistoryEntry => ({
        id: history.changeLogId,
        targetId: history.targetId,
        parentCommentId: null,
        type: "comment",
        action: mapAdminActionToHistoryAction(history.actionType),
        author: history.updatedBy?.userName || history.createdBy?.userName || "익명",
        content: extractCommentContentFromHistory(history),
        timestamp: history.updatedAt,
    });
    const parseChecklistBeforeData = (
        beforeData?: string | null,
    ): { title: string; items: string[]; status: string } => {
        if (!beforeData) return { title: "", items: [], status: "" };
        try {
            const parsed = JSON.parse(beforeData);
            const title =
                parsed.title ||
                parsed.itemTitle ||
                parsed.Name ||
                parsed.clContent ||
                parsed.checkListItemName ||
                "";
            const status =
                parsed.status ||
                parsed.itemStatus ||
                parsed.checkListItemStatus ||
                parsed.state ||
                parsed.checklistStatus ||
                parsed.clStatus ||
                parsed.statusName ||
                "";

            const statusKeys = new Set([
                "status",
                "itemStatus",
                "checkListItemStatus",
                "state",
                "checklistStatus",
                "clStatus",
                "statusName",
            ]);

            const items: string[] = [];
            const pushArrayContents = (arr?: unknown[], extractor?: (value: any) => string | null) => {
                if (!Array.isArray(arr)) return;
                arr.forEach((entry) => {
                    const value = extractor ? extractor(entry) : typeof entry === "string" ? entry : null;
                    if (value && typeof value === "string") {
                        items.push(value);
                    }
                });
            };

            pushArrayContents(parsed.options, (opt) => opt?.optionContent || opt?.content || opt?.text || null);
            pushArrayContents(parsed.rules, (rule) => (typeof rule === "string" ? rule : null));
            pushArrayContents(parsed.items, (item) => item?.itemTitle || item?.title || item?.content || null);

            if (items.length === 0 && typeof parsed === "object" && parsed !== null) {
                Object.entries(parsed).forEach(([key, value]) => {
                    if (statusKeys.has(key)) return;
                    if (typeof value === "string") items.push(value);
                    if (Array.isArray(value)) {
                        pushArrayContents(value, (v) => (typeof v === "string" ? v : null));
                    }
                });
            }

            return { title, items, status };
        } catch (error) {
            console.error("beforeData 파싱 실패", error);
            return { title: "", items: [], status: "" };
        }
    };
    const renderBeforeDataCard = (history: AdminHistoryItem) => {
        const { title, items, status } = parseChecklistBeforeData(history.beforeData);
        const displayedItems = items.length > 0 ? items : ["check list 1", "check list 2", "check list 3"];
        return (
            <Card2 variant="modal" className="shadow-none border border-border/60">
                <CardContent className="px-6 pt-6 [&:last-child]:pb-6">
                    {(status || history.actionType) && (
                        <div className="mb-4 flex items-center gap-2">
                            {history.actionType && (
                                <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {history.actionType}
                                </span>
                            )}
                            {status && (
                                <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {status}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="space-y-3">
                        <input
                            className="w-full px-3 py-2 rounded-md border text-sm"
                            placeholder="제목을 입력하세요"
                            value={title}
                            disabled
                            readOnly
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {displayedItems.map((itemText, index) => (
                                <div key={`${history.changeLogId}-item-${index}`} className="space-y-2">
                                    <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/70 transition-colors">
                                        <button
                                            type="button"
                                            role="checkbox"
                                            aria-checked="false"
                                            data-state="unchecked"
                                            disabled
                                            value="on"
                                            data-slot="checkbox"
                                            className="peer bg-input-background dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                                        />
                                        <textarea
                                            data-slot="textarea"
                                            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full min-h-[38px] resize-none overflow-hidden"
                                            placeholder={`check list ${index + 1}`}
                                            value={itemText}
                                            disabled
                                            readOnly
                                            style={{ height: "32px" }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {remoteHistoryPage?.totalPages && remoteHistoryPage.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pb-6 px-6">
                            <button
                                type="button"
                                className="h-8 rounded-md border px-3 text-sm border-border bg-background hover:bg-muted disabled:opacity-50"
                                onClick={() =>
                                    fetchRemoteChecklistHistory(
                                        Math.max(0, remoteHistoryPageIndex - 1),
                                        selectedHistoryGroupIndex,
                                    )
                                }
                                disabled={remoteHistoryPageIndex === 0 || remoteHistoryLoading}
                            >
                                이전
                            </button>
                            <span className="text-sm text-muted-foreground">
                                {remoteHistoryPageIndex + 1} / {remoteHistoryPage.totalPages}
                            </span>
                            <button
                                type="button"
                                className="h-8 rounded-md border px-3 text-sm border-border bg-background hover:bg-muted disabled:opacity-50"
                                onClick={() =>
                                    fetchRemoteChecklistHistory(
                                        Math.min(remoteHistoryPage.totalPages - 1, remoteHistoryPageIndex + 1),
                                        selectedHistoryGroupIndex,
                                    )
                                }
                                disabled={
                                    remoteHistoryPageIndex + 1 >= (remoteHistoryPage.totalPages ?? 1) ||
                                    remoteHistoryLoading
                                }
                            >
                                다음
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card2>
        );
    };
    const historyPageSize = 5;
    const commentHistoryPageSize = 10;
    const getActiveChecklistItemId = (groupIndex?: number | null) => {
        if (typeof groupIndex === "number" && groupIndex >= 0) {
            const targetGroup = groupsRef.current[groupIndex];
            return targetGroup?.checkListItemId ?? null;
        }
        const targetGroup = groupsRef.current.find((group) => group.checkListItemId);
        return targetGroup?.checkListItemId ?? null;
    };
    const fetchRemoteChecklistHistory = useCallback(
        async (page = 0, groupIndex?: number | null) => {
            const targetId = getActiveChecklistItemId(groupIndex);
            if (!targetId) {
                setRemoteHistoryError("체크리스트 항목 ID를 찾을 수 없습니다.");
                setRemoteHistoryPage(null);
                setRemoteHistoryLoading(false);
                return;
            }
            setRemoteHistoryLoading(true);
            setRemoteHistoryError(null);
            try {
                const data = await historyApi.getHistoriesByTarget(targetId, {
                    historyType: "CHECK_LIST_ITEM",
                    page,
                    size: historyPageSize,
                    sort: "updatedAt,DESC",
                });
                setRemoteHistoryPage(data);
                setRemoteHistoryPageIndex(page);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "체크리스트 이력을 불러오지 못했습니다.";
                setRemoteHistoryError(message);
                setRemoteHistoryPage(null);
            } finally {
                setRemoteHistoryLoading(false);
            }
        },
        [historyPageSize],
    );

    const fetchCommentHistoryByTarget = useCallback(
        async (groupIndex: number, targetId: number) => {
            setGroups((prev) =>
                prev.map((group, index) =>
                    index === groupIndex
                        ? {
                            ...group,
                            commentHistoryLoading: true,
                            commentHistoryError: null,
                            commentHistoryLoadingTargetId: targetId,
                        }
                        : group,
                ),
            );

            try {
                const data = await historyApi.getHistoriesByTarget(targetId, {
                    historyType: "CHECK_LIST_ITEM_COMMENT",
                    page: 0,
                    size: commentHistoryPageSize,
                    sort: "updatedAt,DESC",
                });

                const mappedEntries =
                    data.content?.map((item) => mapAdminHistoryToChecklistEntry(item)) ?? [];

                setGroups((prev) =>
                    prev.map((group, index) =>
                        index === groupIndex
                            ? {
                                ...group,
                                commentHistoryCache: {
                                    ...group.commentHistoryCache,
                                    [targetId]: mappedEntries,
                                },
                                commentHistoryLoading: false,
                                commentHistoryError: null,
                                commentHistoryLoadingTargetId: null,
                            }
                            : group,
                    ),
                );
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "코멘트 이력을 불러오지 못했습니다.";
                setGroups((prev) =>
                    prev.map((group, index) =>
                        index === groupIndex
                            ? {
                                ...group,
                                commentHistoryError: message,
                                commentHistoryLoading: false,
                                commentHistoryLoadingTargetId: null,
                            }
                            : group,
                    ),
                );
            }
        },
        [commentHistoryPageSize],
    );

    const openChecklistHistoryModal = (groupIndex: number) => {
        setChecklistHistoryOpen(true);
        setSelectedHistoryGroupIndex(groupIndex);
        setRemoteHistoryPageIndex(0);
        void fetchRemoteChecklistHistory(0, groupIndex);
    };

    const closeChecklistHistoryModal = () => {
        setChecklistHistoryOpen(false);
        setSelectedHistoryGroupIndex(null);
        setRemoteHistoryPage(null);
        setRemoteHistoryError(null);
        setRemoteHistoryPageIndex(0);
    };

    const getHistoryActionBadgeClass = (action: ChecklistHistoryAction) => {
        if (action === "created")
            return "bg-emerald-50 text-emerald-700 border border-emerald-200";
        if (action === "edited")
            return "bg-amber-50 text-amber-800 border border-amber-200";
        return "bg-rose-50 text-rose-700 border border-rose-200";
    };

    const describeChecklistGroup = (group: ChecklistGroup, index: number) => {
        const prefix = `preCheck-${group.id}-`;
        const lines = group.rules
            .map((rule, idx) => {
                const trimmed = rule?.trim() ?? "";
                if (!trimmed) return null;
                const label = trimmed;
                const evidence = group.evidences[`${prefix}${idx}`];
                const localFiles =
                    evidence?.files?.map((file) => file.name).filter(Boolean) ?? [];
                const remoteFiles =
                    evidence?.remoteFiles
                        ?.map((file) => file.fileName)
                        .filter(Boolean) ?? [];
                const files = [...remoteFiles, ...localFiles];
                const links = evidence?.links?.filter(Boolean) ?? [];
                const detailLines: string[] = [];
                if (files.length) {
                    detailLines.push(`첨부: ${files.join(", ")}`);
                }
                if (links.length) {
                    detailLines.push(`링크: ${links.join(", ")}`);
                }
                const detailText =
                    detailLines.length > 0
                        ? `\n   - ${detailLines.join("\n   - ")}`
                        : "";
                return `${idx + 1}. ${label}${detailText}`;
            })
            .filter((line): line is string => Boolean(line));

        return lines.length > 0 ? lines.join("\n\n") : "등록된 항목이 없습니다.";
    };

    const renderChecklistSummaryBlocks = (text?: string | null) => {
        const normalized = text?.trim() ?? "";
        if (!normalized) {
            return (
                <p className="text-sm text-muted-foreground">내용 없음</p>
            );
        }

        const blocks = normalized
            .split(/\r?\n\s*\r?\n/)
            .map((block) => block.trim())
            .filter(Boolean);

        if (blocks.length === 0) {
            return (
                <p className="text-sm text-muted-foreground">내용 없음</p>
            );
        }

        return blocks.map((block, index) => (
            <p
                key={`checklist-block-${index}`}
                className="whitespace-pre-wrap text-sm text-foreground leading-relaxed"
            >
                {block}
            </p>
        ));
    };

    const getSelectedHistoryGroupTitle = () => {
        if (selectedHistoryGroupIndex == null) return "";
        const group = groups[selectedHistoryGroupIndex];
        return group?.title?.trim() || `체크리스트 ${selectedHistoryGroupIndex + 1}`;
    };

    const getCurrentGroupInfo = (
        entry: ChecklistHistoryLogEntry | null,
    ) => {
        if (!entry) return null;
        const groupIndex = groups.findIndex((group) => group.id === entry.groupId);
        if (groupIndex === -1) {
            return {
                title: entry.groupTitle,
                summary: "현재 이 체크리스트를 찾을 수 없습니다.",
                stateLabel: "삭제됨",
            };
        }
        const group = groups[groupIndex];
        return {
            title: group.title?.trim() || entry.groupTitle,
            summary: describeChecklistGroup(group, groupIndex),
            stateLabel: "현재 상태",
        };
    };

    useEffect(() => {
        if (!saveSignal) return;
        const snapshot = groupsRef.current;
        if (!snapshot.length) return;
        const timestamp = new Date().toISOString();
        const prevSnapshot = lastSavedSnapshotRef.current;
        const nextSnapshot = new Map<number, string>();
        const newEntries: ChecklistHistoryLogEntry[] = [];

        snapshot.forEach((group, index) => {
            const groupTitle = group.title?.trim() || `체크리스트 ${index + 1}`;
            const content = describeChecklistGroup(group, index);
            const signature = `${groupTitle}\n${content}`;
            nextSnapshot.set(group.id, signature);
            const previousSignature = prevSnapshot.get(group.id);
            const action: ChecklistHistoryAction = previousSignature
                ? "edited"
                : "created";
            if (previousSignature === signature) {
                return;
            }
            newEntries.push({
                id: Date.now() + index + Math.floor(Math.random() * 1000),
                groupId: group.id,
                groupTitle,
                author: commentAuthor,
                content,
                timestamp,
                action,
                type: "checklist",
            });
        });

        if (newEntries.length > 0) {
            setChecklistHistoryLogs((prev) => [...prev, ...newEntries]);
        }
        lastSavedSnapshotRef.current = nextSnapshot;
    }, [saveSignal, commentAuthor]);

    // RESET
    useEffect(() => {
        setGroups([createChecklistGroup(1)]);
    }, [resetSignal]);

    // UNLOCK (e.g., 수정 버튼 클릭 시 group 상태 초기화)
    useEffect(() => {
        if (!unlockSignal) return;
        setGroups((prev) =>
            prev.map((group) => ({ ...group, locked: false })),
        );
    }, [unlockSignal]);

    // 체크리스트 카드 추가
    const handleAddGroup = () => {
        if (disabled) return;
        setGroups((prev) => [...prev, createChecklistGroup(prev.length + 1)]);
    };

    // 체크리스트 카드 제거
    const handleRemoveGroup = () => {
        if (disabled) return;
        setGroups((prev) => {
            if (prev.length <= 1) return prev;
            const removedGroup = prev[prev.length - 1];
            const timestamp = new Date().toISOString();
            const removedEntry: ChecklistHistoryLogEntry = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                groupId: removedGroup.id,
                groupTitle:
                    removedGroup.title?.trim() || `체크리스트 ${prev.length}`,
                author: commentAuthor,
                content: describeChecklistGroup(removedGroup, prev.length - 1),
                timestamp,
                action: "deleted",
                type: "checklist",
            };
            setChecklistHistoryLogs((logs) => [...logs, removedEntry]);
            const nextSnapshot = new Map(lastSavedSnapshotRef.current);
            nextSnapshot.delete(removedGroup.id);
            lastSavedSnapshotRef.current = nextSnapshot;
            return prev.slice(0, -1);
        });
    };

    const loadCommentsForGroup = useCallback(
        async (groupIndex: number): Promise<ChecklistComment[] | null> => {
            const targetGroup = groupsRef.current[groupIndex];
            if (
                !targetGroup ||
                !onFetchComments ||
                !targetGroup.checkListItemId ||
                targetGroup.isCommentLoading ||
                targetGroup.hasFetchedComments
            ) {
                return null;
            }

            setGroups((prev) =>
                prev.map((group, index) =>
                    index === groupIndex
                        ? { ...group, isCommentLoading: true, commentError: null }
                        : group,
                ),
            );

            try {
                const response = await onFetchComments(targetGroup.checkListItemId);
                const normalized = normalizeServerComments(response ?? []);
                setGroups((prev) =>
                    prev.map((group, index) =>
                        index === groupIndex
                            ? {
                                  ...group,
                                  comments: normalized,
                                  isCommentLoading: false,
                                  hasFetchedComments: true,
                                  commentError: null,
                                  openCommentMenuId: null,
                              }
                            : group,
                    ),
                );
                return normalized;
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "댓글을 불러오지 못했습니다.";
                setGroups((prev) =>
                    prev.map((group, index) =>
                        index === groupIndex
                            ? {
                                  ...group,
                                  isCommentLoading: false,
                                  commentError: message,
                              }
                            : group,
                    ),
                );
                return null;
            }
        },
        [normalizeServerComments, onFetchComments],
    );

    const closeCommentMenu = (groupIndex: number) => {
        setGroups((prev) =>
            prev.map((group, index) => {
                if (index !== groupIndex) return group;
                if (group.openCommentMenuId === null) return group;
                return {
                    ...group,
                    openCommentMenuId: null,
                    comments: group.comments.map((comment) =>
                        comment.menuOpen ? { ...comment, menuOpen: false } : comment,
                    ),
                };
            }),
        );
    };

    const toggleComment = (groupIndex: number) => {
        const targetGroup = groupsRef.current[groupIndex];
        const willOpen = targetGroup ? !targetGroup.isCommentOpen : false;
        setGroups((prev) =>
            prev.map((g, i) => {
                if (i !== groupIndex) return g;
                const nextOpen = !g.isCommentOpen;
                return {
                    ...g,
                    isCommentOpen: nextOpen,
                    openCommentMenuId: nextOpen ? g.openCommentMenuId : null,
                    comments: nextOpen
                        ? g.comments
                        : g.comments.map((comment) =>
                              comment.menuOpen
                                  ? { ...comment, menuOpen: false }
                                  : comment,
                          ),
                };
            }),
        );
        if (willOpen) {
            void loadCommentsForGroup(groupIndex);
        }
    };

    const updateCommentDraft = (groupIndex: number, value: string) => {
        if (!canComment) return;
        setGroups((prev) =>
            prev.map((g, i) => {
                if (i !== groupIndex) return g;
                if (isCommentInteractionLocked(g)) return g;
                return { ...g, commentDraft: value };
            }),
        );
    };

    const addComment = async (groupIndex: number) => {
        if (!canComment) return;
        const targetGroup = groupsRef.current[groupIndex];
        if (!targetGroup || isCommentInteractionLocked(targetGroup)) {
            return;
        }

        const draft = targetGroup.commentDraft.trim();
        const attachments = cloneCommentAttachments(
            targetGroup.commentAttachmentDraft,
        );
        const hasAttachments = attachments.length > 0;
        if (!draft && !hasAttachments) return;

        const shouldSyncWithServer = Boolean(
            onSubmitComment && targetGroup.checkListItemId,
        );

        const finalizeCommentAppend = (
            serverComment?: CheckListCommentResponse | void,
        ) => {
            const baseRecord = createLocalCommentRecord(
                serverComment?.content ?? draft,
                cloneCommentAttachments(attachments),
            );
            const resolvedAttachments = serverComment
                ? resolveResponseFiles(serverComment)
                : baseRecord.attachments;
            const newComment = serverComment
                ? {
                    ...baseRecord,
                    id: resolveCommentId(serverComment),
                    text: serverComment.content ?? draft,
                    createdAt: serverComment.createdAt ?? baseRecord.createdAt,
                    updatedAt: serverComment.updatedAt ?? null,
                    author:
                        resolveAuthorName(serverComment),
                    attachments: resolvedAttachments,
                }
                : baseRecord;
            const historyEntry = createHistoryEntry({
                targetId: newComment.id,
                type: "comment",
                action: "created",
                author: newComment.author,
                content: newComment.text,
                parentCommentId: null,
            });

            setGroups((prev) =>
                prev.map((group, index) => {
                    if (index !== groupIndex) return group;
                    return {
                        ...group,
                        comments: [...group.comments, newComment],
                        commentDraft: "",
                        commentAttachmentDraft: [],
                        historyEntries: [...group.historyEntries, historyEntry],
                        historySelectedTargetId:
                            group.historySelectedTargetId ?? newComment.id,
                        isCommentSubmitting: false,
                        openCommentMenuId: null,
                        hasFetchedComments: true,
                        commentError: null,
                    };
                }),
            );
        };

        if (shouldSyncWithServer) {
            setGroups((prev) =>
                prev.map((group, index) =>
                    index === groupIndex
                        ? { ...group, isCommentSubmitting: true }
                        : group,
                ),
            );
            try {
                const files = attachments
                    .map((attachment) => attachment.file)
                    .filter((file): file is File => Boolean(file));
                const fileMeta = attachments.map((attachment, index) => ({
                    fileName:
                        attachment.file?.name ||
                        attachment.fileName ||
                        `attachment-${index + 1}`,
                    fileOrder: index,
                }));
                const response = await onSubmitComment?.({
                    checkListItemId: targetGroup.checkListItemId!,
                    content: draft,
                    attachments: files,
                    fileMeta,
                    parentCommentId: null,
                });
                finalizeCommentAppend(response);
            } catch (error) {
                setGroups((prev) =>
                    prev.map((group, index) =>
                        index === groupIndex
                            ? { ...group, isCommentSubmitting: false }
                            : group,
                    ),
                );
            }
            return;
        }

        finalizeCommentAppend();
    };

    const handleCommentAttachmentSelect = (
        groupIndex: number,
        fileList: FileList | null,
    ) => {
        if (!canComment || !fileList) return;
        const newAttachments = Array.from(fileList).map((file) =>
            createAttachment(file),
        );
        setGroups((prev) =>
            prev.map((g, i) => {
                if (i !== groupIndex || isCommentInteractionLocked(g)) {
                    return g;
                }
                return {
                    ...g,
                    commentAttachmentDraft: [
                        ...g.commentAttachmentDraft,
                        ...newAttachments,
                    ],
                };
            }),
        );
    };

    const removeCommentAttachmentDraft = (
        groupIndex: number,
        attachmentId: number,
    ) => {
        if (!canComment) return;
        setGroups((prev) =>
            prev.map((g, i) =>
                i === groupIndex
                    ? {
                        ...g,
                        commentAttachmentDraft: g.commentAttachmentDraft.filter(
                            (attachment) => attachment.id !== attachmentId,
                        ),
                    }
                    : g,
            ),
        );
    };

    const downloadCommentAttachment = (attachment: CommentAttachment) => {
        if (attachment.file) {
            const url = URL.createObjectURL(attachment.file);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = attachment.file.name;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
            return;
        }

        if (attachment.isRemote && onRemoteFileDownload) {
            const fileKey = attachment.fileKey ?? attachment.fileUrl;
            if (fileKey) {
                onRemoteFileDownload(fileKey, attachment.fileName);
                return;
            }
        }

        if (attachment.fileUrl) {
            const anchor = document.createElement("a");
            anchor.href = attachment.fileUrl;
            anchor.download = attachment.fileName ?? "attachment";
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
        }
    };

    const canDownloadAttachment = (attachment: CommentAttachment) => {
        if (attachment.file || attachment.fileUrl) {
            return true;
        }
        if (attachment.isRemote && onRemoteFileDownload) {
            return Boolean(attachment.fileKey || attachment.fileUrl);
        }
        return false;
    };

    const handleCommentEditAttachmentSelect = (
        groupIndex: number,
        commentId: number,
        fileList: FileList | null,
    ) => {
        if (!canComment || !fileList) return;
        const newAttachments = Array.from(fileList).map((file) =>
            createAttachment(file),
        );
        updateCommentState(groupIndex, commentId, (comment) => ({
            ...comment,
            editAttachmentDraft: [
                ...(comment.editAttachmentDraft ?? comment.attachments ?? []),
                ...newAttachments,
            ],
        }));
    };

    const removeCommentEditAttachment = (
        groupIndex: number,
        commentId: number,
        attachmentId: number,
    ) => {
        if (!canComment) return;
        updateCommentState(groupIndex, commentId, (comment) => ({
            ...comment,
            editAttachmentDraft: (comment.editAttachmentDraft ?? []).filter(
                (attachment) => attachment.id !== attachmentId,
            ),
        }));
    };

    const handleReplyAttachmentSelect = (
        groupIndex: number,
        commentId: number,
        fileList: FileList | null,
    ) => {
        if (!canComment || !fileList) return;
        const newAttachments = Array.from(fileList).map((file) =>
            createAttachment(file),
        );
        setGroups((prev) =>
            prev.map((group, index) => {
                if (index !== groupIndex || isCommentInteractionLocked(group))
                    return group;
                return {
                    ...group,
                    comments: group.comments.map((comment) =>
                        comment.id === commentId
                            ? {
                                ...comment,
                                replyAttachmentDraft: [
                                    ...(comment.replyAttachmentDraft ?? []),
                                    ...newAttachments,
                                ],
                            }
                            : comment,
                    ),
                };
            }),
        );
    };

    const handleReplyEditAttachmentSelect = (
        groupIndex: number,
        commentId: number,
        replyId: number,
        fileList: FileList | null,
    ) => {
        if (!canComment || !fileList) return;
        const newAttachments = Array.from(fileList).map((file) =>
            createAttachment(file),
        );
        updateReplyState(groupIndex, commentId, replyId, (reply) => ({
            ...reply,
            editAttachmentDraft: [
                ...(reply.editAttachmentDraft ?? reply.attachments ?? []),
                ...newAttachments,
            ],
        }));
    };

    const removeReplyEditAttachment = (
        groupIndex: number,
        commentId: number,
        replyId: number,
        attachmentId: number,
    ) => {
        if (!canComment) return;
        updateReplyState(groupIndex, commentId, replyId, (reply) => ({
            ...reply,
            editAttachmentDraft: (reply.editAttachmentDraft ?? []).filter(
                (attachment) => attachment.id !== attachmentId,
            ),
        }));
    };

    const removeReplyAttachmentDraft = (
        groupIndex: number,
        commentId: number,
        attachmentId: number,
    ) => {
        if (!canComment) return;
        setGroups((prev) =>
            prev.map((group, index) => {
                if (index !== groupIndex) return group;
                return {
                    ...group,
                    comments: group.comments.map((comment) =>
                        comment.id === commentId
                            ? {
                                ...comment,
                                replyAttachmentDraft: (comment.replyAttachmentDraft ?? []).filter(
                                    (attachment) => attachment.id !== attachmentId,
                                ),
                            }
                            : comment,
                    ),
                };
            }),
        );
    };

    // helper functions for nested comment updates
    const setCommentsForGroup = (
        groupIndex: number,
        updater: (comments: ChecklistComment[]) => ChecklistComment[],
    ) => {
        setGroups((prev) =>
            prev.map((g, i) =>
                i === groupIndex
                    ? {
                        ...g,
                        comments: updater(g.comments),
                    }
                    : g,
            ),
        );
    };

    const updateCommentState = (
        groupIndex: number,
        commentId: number,
        updater: (comment: ChecklistComment) => ChecklistComment,
    ) => {
        setCommentsForGroup(groupIndex, (comments) =>
            comments.map((comment) =>
                comment.id === commentId ? updater(comment) : comment,
            ),
        );
    };

    const updateReplyState = (
        groupIndex: number,
        commentId: number,
        replyId: number,
        updater: (reply: ChecklistReply) => ChecklistReply,
    ) => {
        updateCommentState(groupIndex, commentId, (comment) => ({
            ...comment,
            replies: comment.replies.map((reply) =>
                reply.id === replyId ? updater(reply) : reply,
            ),
        }));
    };
    const toggleCommentMenu = (groupIndex: number, commentId: number) => {
        setGroups((prev) =>
            prev.map((group, index) => {
                if (index !== groupIndex) return group;
                const shouldOpen = group.openCommentMenuId !== commentId;
                return {
                    ...group,
                    openCommentMenuId: shouldOpen ? commentId : null,
                    comments: group.comments.map((comment) => ({
                        ...comment,
                        menuOpen:
                            comment.id === commentId ? shouldOpen : false,
                    })),
                };
            }),
        );
    };

    const startCommentEdit = (groupIndex: number, commentId: number) => {
        if (!canComment) return;
        closeCommentMenu(groupIndex);
        updateCommentState(groupIndex, commentId, (comment) => ({
            ...comment,
            isEditing: true,
            isEditSubmitting: false,
            editDraft: comment.text,
            menuOpen: false,
            editAttachmentDraft: comment.attachments.map((attachment) => ({
                ...attachment,
            })),
        }));
    };

    const cancelCommentEdit = (groupIndex: number, commentId: number) => {
        updateCommentState(groupIndex, commentId, (comment) => ({
            ...comment,
            isEditing: false,
            isEditSubmitting: false,
            editDraft: "",
            editAttachmentDraft: [],
        }));
    };

    const saveCommentEdit = async (groupIndex: number, commentId: number) => {
        if (!canComment) return;
        const targetGroup = groupsRef.current[groupIndex];
        if (!targetGroup || isCommentInteractionLocked(targetGroup)) {
            return;
        }

        const targetComment = targetGroup.comments.find(
            (comment) => comment.id === commentId,
        );
        if (!targetComment) return;

        const newText = targetComment.editDraft.trim();
        if (!newText) return;
        const updatedAttachments =
            targetComment.editAttachmentDraft ?? targetComment.attachments;

        const uploads = updatedAttachments.reduce(
            (acc, attachment) => {
                if (!attachment.file) {
                    return acc;
                }
                acc.files.push(attachment.file);
                acc.meta.push({
                    fileName:
                        attachment.file.name ||
                        attachment.fileName ||
                        `attachment-${acc.meta.length + 1}`,
                    fileOrder: acc.meta.length,
                });
                return acc;
            },
            { files: [] as File[], meta: [] as { fileName: string; fileOrder: number }[] },
        );

        const finalizeUpdate = (
            serverResponse?: CheckListCommentResponse | void,
        ) => {
            setGroups((prev) =>
                prev.map((group, index) => {
                    if (index !== groupIndex) return group;

                    let historyEntry: ChecklistHistoryEntry | null = null;

                    const updatedComments = group.comments.map((comment) => {
                        if (comment.id !== commentId) return comment;

                        historyEntry = createHistoryEntry({
                            targetId: comment.id,
                            type: "comment",
                            action: "edited",
                            author: comment.author,
                            content: serverResponse?.content ?? newText,
                            parentCommentId: null,
                        });

                        const resolvedAttachments = serverResponse
                            ? resolveResponseFiles(serverResponse)
                            : updatedAttachments;

                        return {
                            ...comment,
                            id: serverResponse
                                ? resolveCommentId(serverResponse)
                                : comment.id,
                            text: serverResponse?.content ?? newText,
                            author:
                                serverResponse
                                    ? resolveAuthorName(serverResponse)
                                    : comment.author,
                            updatedAt:
                                serverResponse?.updatedAt ??
                                new Date().toISOString(),
                            isEditing: false,
                            editDraft: "",
                            attachments: resolvedAttachments,
                            editAttachmentDraft: [],
                            isEditSubmitting: false,
                        };
                    });

                    if (!historyEntry) return group;

                return {
                    ...group,
                    comments: updatedComments,
                    historyEntries: [...group.historyEntries, historyEntry],
                    hasFetchedComments: true,
                    commentError: null,
                    openCommentMenuId: null,
                };
            }),
        );
    };

        const shouldSyncWithServer = Boolean(
            onUpdateComment &&
            targetGroup.checkListItemId &&
            targetComment.id,
        );

        if (shouldSyncWithServer) {
            updateCommentState(groupIndex, commentId, (comment) => ({
                ...comment,
                isEditSubmitting: true,
            }));
            try {
                const response = await onUpdateComment?.({
                    checkListItemId: targetGroup.checkListItemId!,
                    commentId: targetComment.id,
                    content: newText,
                    attachments: uploads.files,
                    fileMeta: uploads.meta,
                });
                finalizeUpdate(response);
            } catch (error) {
                updateCommentState(groupIndex, commentId, (comment) => ({
                    ...comment,
                    isEditSubmitting: false,
                }));
            }
            return;
        }

        finalizeUpdate();
    };

    const deleteComment = async (groupIndex: number, commentId: number) => {
        if (!canComment) return;
        closeCommentMenu(groupIndex);

        const targetGroup = groupsRef.current[groupIndex];
        if (!targetGroup) return;
        const targetComment = targetGroup.comments.find((c) => c.id === commentId);
        if (!targetComment) return;

        const finalizeRemoval = () => {
            setGroups((prev) =>
                prev.map((group, index) => {
                    if (index !== groupIndex) return group;

                    const target = group.comments.find((c) => c.id === commentId);
                    if (!target) return group;

                    const commentHistory = createHistoryEntry({
                        targetId: target.id,
                        type: "comment",
                        action: "deleted",
                        author: target.author,
                        content: target.text,
                        parentCommentId: null,
                    });

                    const replyHistories = target.replies.map((reply) =>
                        createHistoryEntry({
                            targetId: reply.id,
                            type: "reply",
                            action: "deleted",
                            author: reply.author,
                            content: reply.text,
                            parentCommentId: target.id,
                        }),
                    );

                    const removedIds = new Set<number>([
                        target.id,
                        ...target.replies.map((r) => r.id),
                    ]);

                    return {
                        ...group,
                        comments: group.comments.filter((c) => c.id !== commentId),
                        historyEntries: [...group.historyEntries, commentHistory, ...replyHistories],
                        historySelectedTargetId: removedIds.has(
                            group.historySelectedTargetId ?? -1,
                        )
                            ? null
                            : group.historySelectedTargetId,
                    };
                }),
            );
        };

        const shouldSyncWithServer = Boolean(
            onDeleteComment && targetGroup.checkListItemId,
        );

        if (shouldSyncWithServer) {
            try {
                await onDeleteComment?.({
                    checkListItemId: targetGroup.checkListItemId!,
                    commentId,
                });
            } catch (error) {
                return;
            }
        }

        finalizeRemoval();
    };

    const openReplyBox = (
        groupIndex: number,
        commentId: number,
        target?: { replyId?: number | null; author?: string | null },
    ) => {
        closeCommentMenu(groupIndex);
        updateCommentState(groupIndex, commentId, (comment) => {
            const normalizedReplyId = target?.replyId ?? null;
            const normalizedAuthor = target?.author ?? null;

            const isSameTarget =
                comment.showReplyBox &&
                comment.replyingToReplyId === normalizedReplyId &&
                comment.replyingToAuthor === normalizedAuthor;

            const baseState = {
                ...comment,
                menuOpen: false,
                replies: comment.replies.map((reply) =>
                    reply.menuOpen ? { ...reply, menuOpen: false } : reply,
                ),
                replyAttachmentDraft: comment.replyAttachmentDraft ?? [],
            };

            if (isSameTarget) {
                return {
                    ...baseState,
                    showReplyBox: false,
                    replyDraft: "",
                    replyingToReplyId: null,
                    replyingToAuthor: null,
                    replyAttachmentDraft: [],
                };
            }

            return {
                ...baseState,
                showReplyBox: true,
                replyDraft: comment.replyDraft ?? "",
                replyingToReplyId: normalizedReplyId,
                replyingToAuthor: normalizedAuthor,
            };
        });
    };

    const closeReplyBox = (groupIndex: number, commentId: number) => {
        updateCommentState(groupIndex, commentId, (comment) => ({
            ...comment,
            showReplyBox: false,
            replyDraft: "",
            replyingToReplyId: null,
            replyingToAuthor: null,
            replyAttachmentDraft: [],
            replies: comment.replies.map((reply) =>
                reply.menuOpen ? { ...reply, menuOpen: false } : reply,
            ),
        }));
    };
    const updateReplyDraft = (
        groupIndex: number,
        commentId: number,
        value: string,
    ) => {
        updateCommentState(groupIndex, commentId, (comment) => ({
            ...comment,
            replyDraft: value,
        }));
    };

    const submitReply = (groupIndex: number, commentId: number) => {
        if (!canComment) return;

        setGroups((prev) =>
            prev.map((group, index) => {
                if (index !== groupIndex) return group;

                let historyEntry: ChecklistHistoryEntry | null = null;

                const updatedComments = group.comments.map((comment) => {
                    if (comment.id !== commentId || isCommentInteractionLocked(group))
                        return comment;

                    const draft = (comment.replyDraft ?? "").trim();
                    const attachments = comment.replyAttachmentDraft ?? [];
                    if (!draft && attachments.length === 0) return comment;

                    const newReply: ChecklistReply = {
                        id: Date.now(),
                        text: draft,
                        author: commentAuthor,
                        createdAt: new Date().toISOString(),
                        updatedAt: null,
                        menuOpen: false,
                        isEditing: false,
                        editDraft: draft,
                        parentReplyId: comment.replyingToReplyId ?? null,
                        parentAuthor: comment.replyingToAuthor ?? null,
                        attachments: attachments.map((attachment) => ({
                            ...attachment,
                        })),
                        editAttachmentDraft: [],
                    };

                    historyEntry = createHistoryEntry({
                        targetId: newReply.id,
                        type: "reply",
                        action: "created",
                        author: newReply.author,
                        content: newReply.text,
                        parentCommentId: comment.id,
                    });

                    return {
                        ...comment,
                        replies: [...comment.replies, newReply],
                        showReplyBox: false,
                        replyDraft: "",
                        replyingToReplyId: null,
                        replyingToAuthor: null,
                        replyAttachmentDraft: [],
                    };
                });

                if (!historyEntry) return group;

                return {
                    ...group,
                    comments: updatedComments,
                    historyEntries: [...group.historyEntries, historyEntry],
                    historySelectedTargetId:
                        group.historySelectedTargetId ?? historyEntry.targetId,
                };
            }),
        );
    };

    const toggleReplyMenu = (
        groupIndex: number,
        commentId: number,
        replyId: number,
    ) => {
        updateCommentState(groupIndex, commentId, (comment) => ({
            ...comment,
            replies: comment.replies.map((reply) => ({
                ...reply,
                menuOpen: reply.id === replyId ? !reply.menuOpen : false,
            })),
        }));
    };

    const startReplyEdit = (
        groupIndex: number,
        commentId: number,
        replyId: number,
    ) => {
        if (!canComment) return;

        updateReplyState(groupIndex, commentId, replyId, (reply) => ({
            ...reply,
            isEditing: true,
            editDraft: reply.text,
            menuOpen: false,
            editAttachmentDraft: reply.attachments.map((attachment) => ({
                ...attachment,
            })),
        }));
    };

    const cancelReplyEdit = (
        groupIndex: number,
        commentId: number,
        replyId: number,
    ) => {
        updateReplyState(groupIndex, commentId, replyId, (reply) => ({
            ...reply,
            isEditing: false,
            editDraft: "",
            editAttachmentDraft: [],
        }));
    };

    const saveReplyEdit = (
        groupIndex: number,
        commentId: number,
        replyId: number,
    ) => {
        if (!canComment) return;

        setGroups((prev) =>
            prev.map((group, index) => {
                if (index !== groupIndex) return group;

                let entry: ChecklistHistoryEntry | null = null;

                const comments = group.comments.map((comment) => {
                    if (comment.id !== commentId) return comment;

                    const replies = comment.replies.map((reply) => {
                        if (reply.id !== replyId) return reply;

                        const newText = reply.editDraft.trim();
                        if (!newText) return reply;
                        const updatedAttachments =
                            reply.editAttachmentDraft ?? reply.attachments;

                        entry = createHistoryEntry({
                            targetId: reply.id,
                            type: "reply",
                            action: "edited",
                            author: reply.author,
                            content: newText,
                            parentCommentId: comment.id,
                        });

                            return {
                                ...reply,
                                text: newText,
                                updatedAt: new Date().toISOString(),
                                isEditing: false,
                                editDraft: "",
                                attachments: updatedAttachments,
                                editAttachmentDraft: [],
                            };
                        });

                        return { ...comment, replies };
                });

                if (!entry) return group;

                return {
                    ...group,
                    comments,
                    historyEntries: [...group.historyEntries, entry],
                };
            }),
        );
    };

    const deleteReply = (
        groupIndex: number,
        commentId: number,
        replyId: number,
    ) => {
        if (!canComment) return;

        setGroups((prev) =>
            prev.map((group, index) => {
                if (index !== groupIndex) return group;

                const targetComment = group.comments.find(
                    (c) => c.id === commentId,
                );
                if (!targetComment) return group;

                const targetReply = targetComment.replies.find(
                    (r) => r.id === replyId,
                );
                if (!targetReply) return group;

                const historyEntry = createHistoryEntry({
                    targetId: targetReply.id,
                    type: "reply",
                    action: "deleted",
                    author: targetReply.author,
                    content: targetReply.text,
                    parentCommentId: targetComment.id,
                });

                return {
                    ...group,
                    comments: group.comments.map((comment) =>
                        comment.id === commentId
                            ? {
                                ...comment,
                                replies: comment.replies.filter(
                                    (reply) => reply.id !== replyId,
                                ),
                            }
                            : comment,
                    ),
                    historyEntries: [...group.historyEntries, historyEntry],
                    historySelectedTargetId:
                        group.historySelectedTargetId === replyId
                            ? null
                            : group.historySelectedTargetId,
                };
            }),
        );
    };
    const getHistoryActionLabel = (action: ChecklistHistoryAction) => {
        if (action === "created") return "등록됨";
        if (action === "edited") return "수정됨";
        return "삭제됨";
    };

    const ensureHistorySelection = useCallback(
        (
            groupIndex: number,
            options: { comments?: ChecklistComment[] } = {},
        ) => {
            const targetGroup = groupsRef.current[groupIndex];
            if (!targetGroup) return;

            const sourceComments =
                options.comments && options.comments.length > 0
                    ? options.comments
                    : targetGroup.comments;

            const fallbackTarget =
                targetGroup.historySelectedTargetId ??
                sourceComments[0]?.id ??
                targetGroup.historyEntries[targetGroup.historyEntries.length - 1]?.targetId ??
                null;

            if (fallbackTarget == null) return;

            setGroups((prev) =>
                prev.map((group, index) =>
                    index === groupIndex
                        ? {
                            ...group,
                            historySelectedTargetId: fallbackTarget,
                        }
                        : group,
                ),
            );

            if (!targetGroup.commentHistoryCache[fallbackTarget]) {
                void fetchCommentHistoryByTarget(groupIndex, fallbackTarget);
            }
        },
        [fetchCommentHistoryByTarget],
    );

    const openHistoryModal = (groupIndex: number) => {
        const targetGroup = groupsRef.current[groupIndex];
        if (!targetGroup) return;

        setGroups((prev) =>
            prev.map((group, index) =>
                index === groupIndex
                    ? {
                        ...group,
                        isHistoryOpen: true,
                    }
                    : group,
            ),
        );

        const prepareHistory = async () => {
            let loadedComments: ChecklistComment[] | null = null;
            const latestGroup = groupsRef.current[groupIndex];
            if (
                latestGroup &&
                !latestGroup.hasFetchedComments &&
                onFetchComments &&
                latestGroup.checkListItemId
            ) {
                loadedComments = await loadCommentsForGroup(groupIndex);
            }

            ensureHistorySelection(groupIndex, {
                comments: loadedComments ?? undefined,
            });
        };

        void prepareHistory();
    };

    const closeHistoryModal = (groupIndex: number) => {
        setGroups((prev) =>
            prev.map((group, index) =>
                index === groupIndex
                    ? { ...group, isHistoryOpen: false }
                    : group,
            ),
        );
    };

    const selectHistoryTarget = (groupIndex: number, targetId: number) => {
        setGroups((prev) =>
            prev.map((group, index) =>
                index === groupIndex
                    ? {
                        ...group,
                        historySelectedTargetId: targetId,
                        commentHistoryError: null,
                    }
                    : group,
            ),
        );

        const group = groupsRef.current[groupIndex];
        const hasCache = group?.commentHistoryCache?.[targetId];
        if (!hasCache) {
            void fetchCommentHistoryByTarget(groupIndex, targetId);
        }
    };

    const renderHistoryModal = (group: ChecklistGroup, groupIndex: number) => {
        const sortedEntries = [...group.historyEntries].sort(
            (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime(),
        );

        const targetMap = new Map<number, HistoryTargetMeta>();

        const seedTarget = (meta: HistoryTargetMeta) => {
            const existing = targetMap.get(meta.id);

            if (
                !existing ||
                new Date(existing.latestTimestamp).getTime() <
                new Date(meta.latestTimestamp).getTime()
            ) {
                targetMap.set(meta.id, meta);
            }
        };

        // 현재 살아있는 comment/reply 기본 seed
        group.comments.forEach((comment) => {
            seedTarget({
                id: comment.id,
                type: "comment",
                parentCommentId: null,
                author: comment.author,
                latestContent: comment.text,
                latestTimestamp:
                    comment.updatedAt ?? comment.createdAt,
                isDeleted: false,
            });

            comment.replies.forEach((reply) =>
                seedTarget({
                    id: reply.id,
                    type: "reply",
                    parentCommentId: comment.id,
                    author: reply.author,
                    latestContent: reply.text,
                    latestTimestamp:
                        reply.updatedAt ?? reply.createdAt,
                    isDeleted: false,
                }),
            );
        });

        // history 기반으로 최신 상태 갱신
        sortedEntries.forEach((entry) => {
            const existing = targetMap.get(entry.targetId);

            if (existing) {
                targetMap.set(entry.targetId, {
                    ...existing,
                    author: entry.author || existing.author,
                    latestContent: entry.content || existing.latestContent,
                    latestTimestamp: entry.timestamp,
                    isDeleted:
                        entry.action === "deleted"
                            ? true
                            : existing.isDeleted,
                });
            } else {
                seedTarget({
                    id: entry.targetId,
                    type: entry.type,
                    parentCommentId: entry.parentCommentId,
                    author: entry.author,
                    latestContent: entry.content,
                    latestTimestamp: entry.timestamp,
                    isDeleted: entry.action === "deleted",
                });
            }
        });

        const activeComments = group.comments;

        const activeCount =
            activeComments.length +
            activeComments.reduce(
                (sum, c) => sum + c.replies.length,
                0,
            );

        const selectedTarget =
            group.historySelectedTargetId !== null
                ? targetMap.get(group.historySelectedTargetId) ?? null
                : null;

        const cachedTimelineEntries =
            selectedTarget && selectedTarget.id != null
                ? group.commentHistoryCache[selectedTarget.id] ?? null
                : null;
        const timelineEntries = cachedTimelineEntries
            ? cachedTimelineEntries
            : selectedTarget
                ? sortedEntries.filter(
                    (entry) => entry.targetId === selectedTarget.id,
                )
                : [];
        const isTimelineLoading =
            group.commentHistoryLoading &&
            group.commentHistoryLoadingTargetId === selectedTarget?.id;
        const timelineError =
            group.commentHistoryError &&
            group.commentHistoryLoadingTargetId === selectedTarget?.id
                ? group.commentHistoryError
                : group.commentHistoryError;
        const renderHistoryButton = (
            meta: HistoryTargetMeta,
            options: { showDeletedLabel?: boolean } = {},
        ) => {
            const isSelected =
                group.historySelectedTargetId === meta.id;
            const isDeleted = meta.isDeleted;
            const showDeletedLabel =
                options.showDeletedLabel ?? true;

            return (
                <button
                    key={`history-button-${meta.id}`}
                    type="button"
                    onClick={() =>
                        selectHistoryTarget(groupIndex, meta.id)
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition
                    ${
                        isSelected
                            ? "border-primary bg-primary/10"
                            : "hover:bg-muted"
                    }
                    ${
                        isDeleted
                            ? "border-destructive/40 bg-destructive/5"
                            : ""
                    }
                `}
                >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        {meta.type === "reply" && (
                            <CornerDownRight className="h-4 w-4 text-primary" />
                        )}

                        <span
                            className={
                                isDeleted
                                    ? "text-destructive"
                                    : "text-foreground"
                            }
                        >
                            {meta.author || "익명"}
                        </span>
                    </span>

                        <span
                            className={
                                isDeleted
                                    ? "text-destructive"
                                    : undefined
                            }
                        >
                        {meta.latestTimestamp
                            ? `${new Date(
                                meta.latestTimestamp,
                            ).toLocaleString()}${
                                isDeleted &&
                                showDeletedLabel
                                    ? " (삭제됨)"
                                    : ""
                            }`
                            : ""}
                    </span>
                    </div>

                    <p className="mt-1 line-clamp-2 whitespace-pre-line text-foreground">
                        {meta.latestContent || "내용이 없습니다."}
                    </p>
                </button>
            );
        };

        return (
            <ModalShell
                open={group.isHistoryOpen}
                onClose={() => closeHistoryModal(groupIndex)}
                maxWidth="64rem"
                className="h-full"
            >
                <Card2 variant="modal" className="flex h-full max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden">
                    <CardHeader className="relative border-b text-center">
                        <h3 className="text-lg font-semibold">코멘트 이력</h3>
                        <button
                            type="button"
                            aria-label="댓글 이력 닫기"
                            className="absolute right-4 top-3 rounded-md p-1 hover:bg-muted"
                            onClick={() => closeHistoryModal(groupIndex)}
                        />
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-6 py-6">
                        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden md:grid-cols-2">
                            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
                                <div className="space-y-2 pb-6">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <p className="font-medium text-foreground">현재 댓글</p>
                                        <span>총 {activeCount}건</span>
                                    </div>
                                    <div className="space-y-2">
                                        {activeComments.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">아직 등록된 댓글이 없습니다.</p>
                                        ) : (
                                            activeComments.map((comment) => (
                                                <div key={`history-active-${comment.id}`} className="space-y-2">
                                                    {renderHistoryButton({
                                                        id: comment.id,
                                                        type: "comment",
                                                        parentCommentId: null,
                                                        author: comment.author,
                                                        latestContent: comment.text,
                                                        latestTimestamp: comment.updatedAt ?? comment.createdAt,
                                                        isDeleted: false,
                                                    })}

                                                    {comment.replies.map((reply) => (
                                                        <div key={`history-active-reply-${reply.id}`} className="pl-5">
                                                            {renderHistoryButton({
                                                                id: reply.id,
                                                                type: "reply",
                                                                parentCommentId: comment.id,
                                                                author: reply.author,
                                                                latestContent: reply.text,
                                                                latestTimestamp: reply.updatedAt ?? reply.createdAt,
                                                                isDeleted: false,
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                            </div>

                            <div className="flex h-full min-h-0 flex-col space-y-2 overflow-hidden">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <p className="font-medium">선택한 댓글의 히스토리</p>
                                    {selectedTarget && <span>총 {timelineEntries.length}건</span>}
                                </div>
                                <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                                    <div className="space-y-3">
                                        {!selectedTarget && (
                                            <p className="text-sm text-muted-foreground">왼쪽 목록에서 댓글을 선택해 주세요.</p>
                                        )}
                                        {selectedTarget && (
                                            <>
                                                {selectedTarget.parentCommentId && (
                                                    <div className="space-y-1 rounded-md border bg-background p-3">
                                                        <span className="text-xs text-muted-foreground">원 댓글</span>
                                                        <p className="text-xs text-muted-foreground">
                                                            {targetMap.get(selectedTarget.parentCommentId)?.author ||
                                                                group.comments.find((c) => c.id === selectedTarget.parentCommentId)?.author ||
                                                                "익명"}
                                                        </p>
                                                        <p className="text-sm whitespace-pre-wrap text-foreground">
                                                            {targetMap.get(selectedTarget.parentCommentId)?.latestContent ||
                                                                group.comments.find((c) => c.id === selectedTarget.parentCommentId)?.text ||
                                                                "내용이 없습니다."}
                                                        </p>
                                                    </div>
                                                )}

                                                {timelineError && (
                                                    <p className="text-sm text-destructive">{timelineError}</p>
                                                )}

                                                {isTimelineLoading && (
                                                    <p className="text-sm text-muted-foreground">이력을 불러오는 중입니다...</p>
                                                )}

                                                {!isTimelineLoading &&
                                                    !timelineError &&
                                                    (timelineEntries.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground">수정/삭제 이력이 없습니다.</p>
                                                    ) : (
                                                        timelineEntries.map((entry) => {
                                                            const isDeleted = entry.action === "deleted";
                                                            return (
                                                                <div
                                                                    key={`timeline-${entry.id}`}
                                                                    className={`rounded-md border px-3 py-2 text-sm ${
                                                                        isDeleted
                                                                            ? "border-destructive/40 bg-destructive/5"
                                                                            : "bg-background"
                                                                    }`}
                                                                >
                                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                    <span
                                                                        className={`flex items-center gap-1 ${
                                                                            isDeleted ? "text-destructive" : ""
                                                                        }`}
                                                                    >
                                                                        {getHistoryActionLabel(entry.action)}
                                                                    </span>
                                                                    <span className={isDeleted ? "text-destructive" : undefined}>
                                                                        {new Date(entry.timestamp).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                                                                    <p className="whitespace-pre-line text-foreground">
                                                                        {entry.content || "내용이 없습니다."}
                                                                    </p>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {entry.author}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <div className="-mx-6 flex justify-end border-t border-border px-6 pt-6 pb-6">
                        <Button2
                            type="button"
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => closeHistoryModal(groupIndex)}
                        >
                            닫기
                        </Button2>
                    </div>
                </Card2>
            </ModalShell>
        );
    };
    return (
        <>
        <div>
            {/* 상단: 체크리스트 전체 + / - */}
            <div className="mb-2 flex items-center justify-between">
                <Label2 className="flex items-center gap-1 text-sm font-medium">
                    체크리스트
                </Label2>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleAddGroup}
                        disabled={disabled}
                        className="flex h-6 w-6 items-center justify-center rounded-md border text-xs hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="체크리스트 추가"
                    >
                        +
                    </button>

                    <button
                        type="button"
                        onClick={handleRemoveGroup}
                        disabled={disabled}
                        className="flex h-6 w-6 items-center justify-center rounded-md border text-xs hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="체크리스트 제거"
                    >
                        -
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            if (groups.length === 0) return;
                            setIsHistoryPickerOpen(true);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md border text-xs hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="체크리스트 이력 보기"
                        disabled={groups.length === 0}
                    >
                        <span className="text-xs leading-none">⋮</span>
                    </button>
                </div>
            </div>

            {isHistoryPickerOpen && groups.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                    {groups.map((group, idx) => (
                        <button
                            key={group.id}
                            type="button"
                            onClick={() => {
                                openChecklistHistoryModal(idx);
                                setIsHistoryPickerOpen(false);
                            }}
                            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className="font-medium">
                                {group.title?.trim() || `체크리스트 ${idx + 1}`}
                            </span>
                            <span className="text-muted-foreground">이력 보기</span>
                        </button>
                    ))}
                </div>
            )}

            {/* 체크리스트 카드들 */}
            <div className="space-y-2">
                {groups.map((group, groupIndex) => (
                    <div key={group.id} className="relative">
                        <Card2 className="border border-border/60 bg-muted/40 shadow-none">
                            <CardContent className="pt-6">
                                <CheckboxQuestion2
                                    titleValue={group.title}
                                    onTitleChange={(value) => {
                                        if (disabled) return;
                                        setGroups((prev) =>
                                            prev.map((g, i) =>
                                                i === groupIndex
                                                    ? { ...g, title: value }
                                                    : g,
                                            ),
                                        );
                                    }}
                                    fieldName={`preCheck-${group.id}`}
                                    options={group.rules}
                                    selectedIndexes={group.selectedIndexes}
                                    onSelectionChange={(itemIndex, checked) => {
                                        handleOptionSelectionChange({
                                            groupIndex,
                                            optionIndex: itemIndex,
                                            checked: Boolean(checked),
                                        });
                                    }}
                                    evidences={group.evidences}
                                    onEvidenceUpload={(evidenceId, files) => {
                                        if (disabled) return;

                                        setGroups((prev) =>
                                            prev.map((g, i) => {
                                                if (i !== groupIndex || g.locked)
                                                    return g;

                                                const existingEvidence =
                                                    g.evidences[evidenceId];

                                                return {
                                                    ...g,
                                                    evidences: {
                                                        ...g.evidences,
                                                        [evidenceId]: {
                                                            files,
                                                            links:
                                                                existingEvidence?.links ??
                                                                [],
                                                            remoteFiles:
                                                                existingEvidence?.remoteFiles ??
                                                                [],
                                                        },
                                                    },
                                                };
                                            }),
                                        );
                                    }}
                                    onEvidenceLinksChange={(evidenceId, links) => {
                                        if (disabled) return;

                                        setGroups((prev) =>
                                            prev.map((g, i) => {
                                                if (i !== groupIndex || g.locked)
                                                    return g;

                                                const existingEvidence =
                                                    g.evidences[evidenceId];

                                                return {
                                                    ...g,
                                                    evidences: {
                                                        ...g.evidences,
                                                        [evidenceId]: {
                                                            files:
                                                                existingEvidence?.files ??
                                                                [],
                                                            links,
                                                            remoteFiles:
                                                                existingEvidence?.remoteFiles ??
                                                                [],
                                                        },
                                                    },
                                                };
                                            }),
                                        );
                                    }}
                                    onOptionChange={(itemIndex, newValue) => {
                                        if (disabled) return;

                                        setGroups((prev) =>
                                            prev.map((g, i) => {
                                                if (i !== groupIndex || g.locked)
                                                    return g;

                                                const nextRules = [...g.rules];
                                                nextRules[itemIndex] = newValue;

                                                return { ...g, rules: nextRules };
                                            }),
                                        );
                                    }}
                                    onAddOption={() => {
                                        if (disabled) return;

                                        setGroups((prev) =>
                                            prev.map((g, i) =>
                                                i === groupIndex && !g.locked
                                                    ? {
                                                        ...g,
                                                        rules: [...g.rules, ""],
                                                    }
                                                    : g,
                                            ),
                                        );
                                    }}
                                    onRemoveOption={(removeIndex) => {
                                        if (disabled) return;

                                        setGroups((prev) =>
                                            prev.map((g, i) => {
                                                if (i !== groupIndex || g.locked)
                                                    return g;

                                                if (g.rules.length <= 1) return g;

                                                const newRules = g.rules.filter(
                                                    (_, idx) =>
                                                        idx !== removeIndex,
                                                );

                                                const newSelected =
                                                    g.selectedIndexes
                                                        .filter(
                                                            (idx) =>
                                                                idx !== removeIndex,
                                                        )
                                                        .map((idx) =>
                                                            idx > removeIndex
                                                                ? idx - 1
                                                                : idx,
                                                        );

                                                const prefix = `preCheck-${g.id}-`;
                                                const newEvidences: Record<
                                                    string,
                                                    EvidenceItem
                                                > = {};

                                                for (const [
                                                    key,
                                                    evidenceItem,
                                                ] of Object.entries(g.evidences)) {
                                                    if (!key.startsWith(prefix)) {
                                                        newEvidences[key] =
                                                            evidenceItem;
                                                        continue;
                                                    }

                                                    const indexStr =
                                                        key.slice(prefix.length);
                                                    const oldIndex = Number(indexStr);

                                                    if (Number.isNaN(oldIndex)) {
                                                        newEvidences[key] =
                                                            evidenceItem;
                                                        continue;
                                                    }

                                                    if (oldIndex === removeIndex) {
                                                        continue;
                                                    }

                                                    const newIndex =
                                                        oldIndex > removeIndex
                                                            ? oldIndex - 1
                                                            : oldIndex;

                                                    const newKey = `${prefix}${newIndex}`;
                                                    newEvidences[newKey] =
                                                        evidenceItem;
                                                }

                                                return {
                                                    ...g,
                                                    rules: newRules,
                                                    selectedIndexes: newSelected,
                                                    evidences: newEvidences,
                                                };
                                            }),
                                        );
                                    }}
                                    disabled={disabled}
                                    selectionEnabled={
                                        canSelect && (!group.locked || allowSelectionWhenDisabled)
                                    }
                                    onRemoteFileDownload={onRemoteFileDownload}
                                />

                                {/* 코멘트 / 이력 / 동의·보류 버튼 */}
                                <div className="my-2 mt-2 flex w-full flex-col items-end gap-2">
                                    {/* 동의 / 보류 버튼 */}
                                    {showDecisionButtons && (
                                        <div className="mb-6 flex items-center gap-1">
                                            {/* 동의 */}
                                            <button
                                                type="button"
                                                disabled={
                                                    shouldDisableDecisionActions(group) ||
                                                    normalizeChecklistStatus(group.status) ===
                                                        "AGREED"
                                                }
                                                className={`h-9 rounded-md border px-4 text-sm ${
                                                    group.status === "AGREED"
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border bg-background hover:bg-muted"
                                                }`}
                                                onClick={() => {
                                                    if (
                                                        !confirm("‘동의’로 확정하시겠습니까?")
                                                    )
                                                        return;

                                                    void requestStatusChange(groupIndex, "AGREED");
                                                }}
                                            >
                                                동의
                                            </button>

                                            {/* 보류 */}
                                            <button
                                                type="button"
                                                disabled={
                                                    shouldDisableDecisionActions(group) ||
                                                    normalizeChecklistStatus(group.status) ===
                                                        "AGREED" ||
                                                    normalizeChecklistStatus(group.status) ===
                                                        "ON_HOLD"
                                                }
                                                className={`h-9 rounded-md border px-4 text-sm ${
                                                    group.status === "ON_HOLD"
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border bg-background hover:bg-muted"
                                                }`}
                                                onClick={() => {
                                                    if (
                                                        !confirm("‘보류’로 확정하시겠습니까?")
                                                    )
                                                        return;

                                                    void requestStatusChange(groupIndex, "ON_HOLD");
                                                }}
                                            >
                                                보류
                                            </button>
                                        </div>
                                    )}

                                    {showStatusBadges && (
                                        <div className={`flex w-full justify-end ${showDecisionButtons ? "mt-2" : "mt-2 mb-6"}`}>
                                            {(() => {
                                                const meta = getStatusBadgeMeta(group.status);
                                                return (
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}
                                                    >
                                                        {meta.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {/* 말풍선 + 이력 버튼 */}
                                    <div className="pt-4 border-t flex w-full items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleComment(groupIndex)
                                            }
                                            className="mb-4 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-muted"
                                        >
                                            <MessagesSquare className="h-4 w-4 text-muted-foreground " />
                                        </button>

                                        <div className="mb-4 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openHistoryModal(groupIndex)
                                                }
                                                className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                                            >
                                                코멘트 이력 보기
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* === 코멘트 영역 === */}
                                {group.isCommentOpen && (
                                    <div className="mt-3">
                                        <div className="space-y-2 pb-6">
                                            {group.isCommentLoading && (
                                                <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                                                    댓글을 불러오는 중입니다...
                                                </div>
                                            )}
                                            {group.commentError && (
                                                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                                    {group.commentError}
                                                </div>
                                            )}
                                            {!group.isCommentLoading &&
                                                !group.commentError &&
                                                group.comments.length === 0 && (
                                                    <p className="text-sm text-muted-foreground">
                                                        아직 등록된 댓글이 없습니다.
                                                    </p>
                                                )}
                                            {group.comments.map((comment) => {
                                                const isEditing =
                                                    comment.isEditing;
                                                const isMenuOpen =
                                                    group.openCommentMenuId ===
                                                    comment.id;

                                                return (
                                                    <div
                                                        key={comment.id}
                                                        className="relative rounded-md border border-border bg-background px-3 py-2"
                                                    >
                                                        {/* 부모 댓글 헤더 */}
                                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span className="font-medium">
                                                            {comment.author}
                                                        </span>

                                                            <div className="flex items-center gap-2">
                                                            <span className="flex flex-wrap items-center gap-1 text-[11px] opacity-70">
                                                                <span>
                                                                    {new Date(
                                                                        comment.createdAt,
                                                                    ).toLocaleString()}
                                                                </span>

                                                                {comment.updatedAt && (
                                                                    <span className="flex items-center gap-1 text-[10px]">
                                                                        <span>·</span>
                                                                        <span>
                                                                            수정:{" "}
                                                                            {new Date(
                                                                                comment.updatedAt,
                                                                            ).toLocaleString()}
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </span>

                                                                {canComment &&
                                                                    !isCommentInteractionLocked(
                                                                        group,
                                                                    ) && (
                                                                        <button
                                                                            type="button"
                                                                            className="rounded-md p-1 transition hover:bg-muted"
                                                                            aria-label="코멘트 옵션"
                                                                            onClick={() =>
                                                                                toggleCommentMenu(
                                                                                    groupIndex,
                                                                                    comment.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </button>
                                                                    )}
                                                            </div>
                                                        </div>

                                                        {/* 부모 댓글 메뉴 */}
                                                        {isMenuOpen && (
                                                            <div className="absolute right-2 top-8 z-10 w-28 rounded-md border bg-background shadow-md">
                                                                <button
                                                                    type="button"
                                                                    className="block w-full px-3 py-1 text-left text-sm hover:bg-muted"
                                                                    onClick={() =>
                                                                        openReplyBox(
                                                                            groupIndex,
                                                                            comment.id,
                                                                            {
                                                                                author:
                                                                                comment.author,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    답글
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="block w-full px-3 py-1 text-left text-sm hover:bg-muted"
                                                                    onClick={() =>
                                                                        startCommentEdit(
                                                                            groupIndex,
                                                                            comment.id,
                                                                        )
                                                                    }
                                                                >
                                                                    수정
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="block w-full px-3 py-1 text-left text-sm text-destructive hover:bg-muted"
                                                                    onClick={() =>
                                                                        deleteComment(
                                                                            groupIndex,
                                                                            comment.id,
                                                                        )
                                                                    }
                                                                >
                                                                    삭제
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* === 부모 댓글 본문 or 수정모드 === */}
                                                        {isEditing ? (
                                                            <div className="space-y-2">
                                                                <Textarea2
                                                                    value={
                                                                        comment.editDraft
                                                                    }
                                                                    onChange={(e) =>
                                                                        updateCommentState(
                                                                            groupIndex,
                                                                            comment.id,
                                                                            (current) => ({
                                                                                ...current,
                                                                                editDraft:
                                                                                e.target.value,
                                                                            }),
                                                                        )
                                                                    }
                                                                    rows={3}
                                                                    className="text-xs"
                                                                />

                                                                <div className="space-y-2">
                                                                    <input
                                                                        id={`comment-edit-attachment-input-${group.id}-${comment.id}`}
                                                                        type="file"
                                                                        multiple
                                                                        className="hidden"
                                                                        disabled={
                                                                            !canComment ||
                                                                            isCommentInteractionLocked(group)
                                                                        }
                                                                        onChange={(event) => {
                                                                            handleCommentEditAttachmentSelect(
                                                                                groupIndex,
                                                                                comment.id,
                                                                                event.target.files,
                                                                            );
                                                                            event.target.value = "";
                                                                        }}
                                                                    />

                                                {(comment.editAttachmentDraft?.length ?? 0) > 0 && (
                                                    <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 px-3 py-2 text-[11px]">
                                                        {comment.editAttachmentDraft?.map((attachment) => (
                                                            <div
                                                                key={attachment.id}
                                                                className="flex items-center justify-between gap-2"
                                                            >
                                                                <div className="flex items-center gap-2 overflow-hidden text-[11px]">
                                                                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="truncate !text-[11px]" style={{ fontSize: "11px" }}>
                                                                        {attachment.file?.name ||
                                                                            attachment.fileName}
                                                                    </span>
                                                                </div>
                                                                <Button2
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="!h-5 px-2 !text-[11px]"
                                                                    style={{ fontSize: "11px" }}
                                                                    onClick={() =>
                                                                        removeCommentEditAttachment(
                                                                            groupIndex,
                                                                                                comment.id,
                                                                                                attachment.id,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        제거
                                                                                    </Button2>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-center justify-between gap-2">
                                                                <Button2
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={
                                                                        !canComment ||
                                                                        isCommentInteractionLocked(group) ||
                                                                        comment.isEditSubmitting
                                                                    }
                                                                    onClick={() =>
                                                                        document
                                                                            .getElementById(
                                                                                `comment-edit-attachment-input-${group.id}-${comment.id}`,
                                                                                    )
                                                                                    ?.click()
                                                                            }
                                                                        >
                                                                            <Paperclip className="h-4 w-4" />
                                                                            파일 첨부
                                                                        </Button2>

                                                                        <div className="flex items-center gap-2">
                                                                            <Button2
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                disabled={comment.isEditSubmitting}
                                                                                onClick={() =>
                                                                                    cancelCommentEdit(
                                                                                        groupIndex,
                                                                                        comment.id,
                                                                                    )
                                                                                }
                                                                            >
                                                                                취소
                                                                            </Button2>

                                                                            <Button2
                                                                                type="button"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    void saveCommentEdit(
                                                                                        groupIndex,
                                                                                        comment.id,
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    !comment.editDraft.trim() ||
                                                                                    comment.isEditSubmitting
                                                                                }
                                                                            >
                                                                                {comment.isEditSubmitting
                                                                                    ? "저장 중..."
                                                                                    : "저장"}
                                                                            </Button2>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="mt-1 break-words whitespace-pre-line text-sm leading-6">
                                                                {comment.text}
                                                            </p>
                                                        )}

                                                        {!isEditing &&
                                                            (comment.attachments?.length ?? 0) > 0 && (
                                                            <div className="mt-3 space-y-2 text-xs">
                                                                {comment.attachments?.map((attachment) => {
                                                                    const downloadable =
                                                                        canDownloadAttachment(
                                                                            attachment,
                                                                        );
                                                                    return (
                                                                        <button
                                                                            key={attachment.id}
                                                                            type="button"
                                                                            className={`mt-2 flex w-full items-center gap-2 overflow-hidden rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-left text-xs underline-offset-2 ${
                                                                                downloadable
                                                                                    ? "text-primary hover:underline"
                                                                                    : "cursor-not-allowed text-muted-foreground"
                                                                            }`}
                                                                            disabled={!downloadable}
                                                                            onClick={() =>
                                                                                downloadable &&
                                                                                downloadCommentAttachment(
                                                                                    attachment,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                                            <span className="truncate">
                                                                                {attachment.file?.name ||
                                                                                    attachment.fileName}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* === 대댓글 리스트 === */}
                                                        {comment.replies &&
                                                            comment.replies.length >
                                                            0 && (
                                                                <div className="mt-3 space-y-2">
                                                                    {comment.replies.map(
                                                                        (reply) => {
                                                                            const isReplyEditing =
                                                                                reply.isEditing;
                                                                            const isReplyMenuOpen =
                                                                                reply.menuOpen;

                                                                            return (
                                                                                <div
                                                                                    key={
                                                                                        reply.id
                                                                                    }
                                                                                    className="flex"
                                                                                >
                                                                                    <div className="relative flex-1 rounded-md bg-muted/40 px-2 py-2 text-sm">
                                                                                        {/* 대댓글 헤더 */}
                                                                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                                        <span className="flex items-center gap-1 text-xs font-medium">
                                                                                            <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                                                                                            {
                                                                                                reply.author
                                                                                            }
                                                                                        </span>

                                                                                            <div className="flex items-center gap-2">
                                                                                            <span className="flex flex-wrap items-center gap-1 text-[11px] opacity-70">
                                                                                                <span>
                                                                                                    {new Date(
                                                                                                        reply.createdAt,
                                                                                                    ).toLocaleString()}
                                                                                                </span>

                                                                                                {reply.updatedAt && (
                                                                                                    <span className="flex items-center gap-1 text-[10px]">
                                                                                                        <span>
                                                                                                            ·
                                                                                                        </span>
                                                                                                        <span>
                                                                                                            수정:{" "}
                                                                                                            {new Date(
                                                                                                                reply.updatedAt,
                                                                                                            ).toLocaleString()}
                                                                                                        </span>
                                                                                                    </span>
                                                                                                )}
                                                                                            </span>

                                                                                                {canComment &&
                                                                                                    !isCommentInteractionLocked(
                                                                                                        group,
                                                                                                    ) && (
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            className="rounded-md p-1 transition hover:bg-muted"
                                                                                                            aria-label="답글 옵션"
                                                                                                            onClick={() =>
                                                                                                                toggleReplyMenu(
                                                                                                                    groupIndex,
                                                                                                                    comment.id,
                                                                                                                    reply.id,
                                                                                                                )
                                                                                                            }
                                                                                                        >
                                                                                                            <MoreVertical className="h-4 w-4" />
                                                                                                        </button>
                                                                                                    )}
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* 대댓글 메뉴 */}
                                                                                        {isReplyMenuOpen && (
                                                                                            <div className="absolute right-2 top-8 z-10 w-20 rounded-md border bg-background shadow-md">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="block w-full px-3 py-1 text-left text-sm hover:bg-muted"
                                                                                                    onClick={() =>
                                                                                                        openReplyBox(
                                                                                                            groupIndex,
                                                                                                            comment.id,
                                                                                                            {
                                                                                                                replyId:
                                                                                                                reply.id,
                                                                                                                author:
                                                                                                                reply.author,
                                                                                                            },
                                                                                                        )
                                                                                                    }
                                                                                                >
                                                                                                    답글
                                                                                                </button>

                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="block w-full px-3 py-1 text-left text-sm hover:bg-muted"
                                                                                                    onClick={() =>
                                                                                                        startReplyEdit(
                                                                                                            groupIndex,
                                                                                                            comment.id,
                                                                                                            reply.id,
                                                                                                        )
                                                                                                    }
                                                                                                >
                                                                                                    수정
                                                                                                </button>

                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="block w-full px-3 py-1 text-left text-sm text-destructive hover:bg-muted"
                                                                                                    onClick={() =>
                                                                                                        deleteReply(
                                                                                                            groupIndex,
                                                                                                            comment.id,
                                                                                                            reply.id,
                                                                                                        )
                                                                                                    }
                                                                                                >
                                                                                                    삭제
                                                                                                </button>
                                                                                            </div>
                                                                                        )}

                                                                                        {/* 대댓글 본문 or 수정모드 */}
                                                                                        {isReplyEditing ? (
                                                                                            <div className="mt-2 space-y-2">
                                                                                                <Textarea2
                                                                                                    value={reply.editDraft}
                                                                                                    onChange={(e) =>
                                                                                                        updateReplyState(
                                                                                                            groupIndex,
                                                                                                            comment.id,
                                                                                                            reply.id,
                                                                                                            (current) => ({ ...current, editDraft: e.target.value }),
                                                                                                        )
                                                                                                    }
                                                                                                    rows={3}
                                                                                                    className="text-xs"
                                                                                                />
                                                                                                <div className="space-y-2">
                                                                                                    <input
                                                                                                        id={`reply-edit-attachment-input-${group.id}-${comment.id}-${reply.id}`}
                                                                                                        type="file"
                                                                                                        multiple
                                                                                                        className="hidden"
                                                                                                        disabled={
                                                                                                            !canComment ||
                                                                                                            isCommentInteractionLocked(
                                                                                                                group,
                                                                                                            )
                                                                                                        }
                                                                                                        onChange={(event) => {
                                                                                                            handleReplyEditAttachmentSelect(
                                                                                                                groupIndex,
                                                                                                                comment.id,
                                                                                                                reply.id,
                                                                                                                event.target.files,
                                                                                                            );
                                                                                                            event.target.value = "";
                                                                                                        }}
                                                                                                    />
                                            {(reply.editAttachmentDraft?.length ?? 0) > 0 && (
                                                <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 px-3 py-2 text-[11px]">
                                                    {reply.editAttachmentDraft?.map((attachment) => (
                                                        <div
                                                            key={attachment.id}
                                                            className="flex items-center justify-between gap-2"
                                                        >
                                                            <div className="flex items-center gap-2 overflow-hidden text-[11px]">
                                                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                                <span className="truncate !text-[11px]" style={{ fontSize: "11px" }}>
                                                                    {attachment.file?.name ||
                                                                        attachment.fileName}
                                                                </span>
                                                            </div>
                                                            <Button2
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                className="!h-5 px-2 !text-[11px]"
                                                                style={{ fontSize: "11px" }}
                                                                onClick={() =>
                                                                    removeReplyEditAttachment(
                                                                        groupIndex,
                                                                                                                                comment.id,
                                                                                                                                reply.id,
                                                                                                                                attachment.id,
                                                                                                                            )
                                                                                                                        }
                                                                                                                    >
                                                                                                                        제거
                                                                                                                    </Button2>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    )}
                                                                                                    <div className="flex items-center justify-between gap-2">
                                                                                                        <Button2
                                                                                                            type="button"
                                                                                                            variant="outline"
                                                                                                            size="sm"
                                                                                                            disabled={
                                                                                                                !canComment ||
                                                                                                                isCommentInteractionLocked(
                                                                                                                    group,
                                                                                                                )
                                                                                                            }
                                                                                                            onClick={() =>
                                                                                                                document
                                                                                                                    .getElementById(
                                                                                                                        `reply-edit-attachment-input-${group.id}-${comment.id}-${reply.id}`,
                                                                                                                    )
                                                                                                                    ?.click()
                                                                                                            }
                                                                                                        >
                                                                                                            <Paperclip className="h-4 w-4" />
                                                                                                            파일 첨부
                                                                                                        </Button2>
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <Button2
                                                                                                                type="button"
                                                                                                                variant="outline"
                                                                                                                size="sm"
                                                                                                                onClick={() =>
                                                                                                                    cancelReplyEdit(
                                                                                                                        groupIndex,
                                                                                                                        comment.id,
                                                                                                                        reply.id,
                                                                                                                    )
                                                                                                                }
                                                                                                            >
                                                                                                                취소
                                                                                                            </Button2>
                                                                                                            <Button2
                                                                                                                type="button"
                                                                                                                size="sm"
                                                                                                                onClick={() =>
                                                                                                                    saveReplyEdit(
                                                                                                                        groupIndex,
                                                                                                                        comment.id,
                                                                                                                        reply.id,
                                                                                                                    )
                                                                                                                }
                                                                                                                disabled={!reply.editDraft.trim()}
                                                                                                            >
                                                                                                                저장
                                                                                                            </Button2>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="mt-1 space-y-1">
                                                                                                <p className="break-words whitespace-pre-line text-sm leading-6">
                                                                                                    {reply.text}
                                                                                                </p>
                                                                                            </div>
                                                                                        )}

                                                                                        {!isReplyEditing &&
                                                                                            (reply.attachments?.length ?? 0) > 0 && (
                                                                                            <div className="mt-2 space-y-1 text-xs">
                                                                                                {reply.attachments?.map((attachment) => {
                                                                                                    const downloadable =
                                                                                                        canDownloadAttachment(
                                                                                                            attachment,
                                                                                                        );
                                                                                                    return (
                                                                                                        <button
                                                                                                            key={attachment.id}
                                                                                                            type="button"
                                                                                                            className={`flex w-full items-center gap-2 overflow-hidden rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-left text-xs underline-offset-2 ${
                                                                                                                downloadable
                                                                                                                    ? "text-primary hover:underline"
                                                                                                                    : "cursor-not-allowed text-muted-foreground"
                                                                                                            }`}
                                                                                                            disabled={!downloadable}
                                                                                                            onClick={() =>
                                                                                                                downloadable &&
                                                                                                                downloadCommentAttachment(
                                                                                                                    attachment,
                                                                                                                )
                                                                                                            }
                                                                                                        >
                                                                                                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                                                                            <span className="truncate">
                                                                                                                {attachment.file?.name ||
                                                                                                                    attachment.fileName}
                                                                                                            </span>
                                                                                                        </button>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        },
                                                                    )}
                                                                </div>
                                                            )}

                                                        {/* === 대댓글 작성 폼 === */}
                                {comment.showReplyBox &&
                                    canComment &&
                                    !isCommentInteractionLocked(group) && (
                                        <div className="mt-2 space-y-2">
                                            <Textarea2
                                                value={
                                                    comment.replyDraft
                                                }
                                                onChange={(e) =>
                                                    updateReplyDraft(
                                                        groupIndex,
                                                        comment.id,
                                                        e.target.value,
                                                    )
                                                }
                                                rows={3}
                                                className="text-sm"
                                                placeholder="답글을 입력하세요"
                                            />

                                            <div className="space-y-2">
                                                <input
                                                    id={`reply-attachment-input-${group.id}-${comment.id}`}
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    disabled={
                                                        !canComment ||
                                                        isCommentInteractionLocked(group)
                                                    }
                                                    onChange={(event) => {
                                                        handleReplyAttachmentSelect(
                                                            groupIndex,
                                                            comment.id,
                                                            event.target.files,
                                                        );
                                                        event.target.value = "";
                                                    }}
                                                />

                                                {(comment.replyAttachmentDraft?.length ?? 0) > 0 && (
                                                    <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 px-3 py-2 text-[11px]">
                                                        {comment.replyAttachmentDraft?.map((attachment) => (
                                                            <div
                                                                key={attachment.id}
                                                                className="flex items-center justify-between gap-2"
                                                            >
                                                                <div className="flex items-center gap-2 overflow-hidden text-[11px]">
                                                                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="truncate !text-[11px]" style={{ fontSize: "11px" }}>
                                                                        {attachment.file?.name ||
                                                                            attachment.fileName}
                                                                    </span>
                                                                </div>
                                                                <Button2
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="!h-5 px-2 !text-[11px]"
                                                                    style={{ fontSize: "11px" }}
                                                                    onClick={() =>
                                                                        removeReplyAttachmentDraft(
                                                                            groupIndex,
                                                                            comment.id,
                                                                            attachment.id,
                                                                        )
                                                                    }
                                                                >
                                                                    제거
                                                                </Button2>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between gap-2">
                                                    <Button2
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={
                                                            !canComment ||
                                                            isCommentInteractionLocked(group)
                                                        }
                                                        onClick={() =>
                                                            document
                                                                .getElementById(
                                                                    `reply-attachment-input-${group.id}-${comment.id}`,
                                                                )
                                                                ?.click()
                                                        }
                                                    >
                                                        <Paperclip className="h-4 w-4" />
                                                        파일 첨부
                                                    </Button2>

                                                    <div className="flex items-center gap-2">
                                                        <Button2
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                closeReplyBox(
                                                                    groupIndex,
                                                                    comment.id,
                                                                )
                                                            }
                                                        >
                                                            취소
                                                        </Button2>

                                                        <Button2
                                                            type="button"
                                                            size="sm"
                                                            onClick={() =>
                                                                submitReply(
                                                                    groupIndex,
                                                                    comment.id,
                                                                )
                                                            }
                                                            disabled={
                                                                !comment.replyDraft.trim() &&
                                                                (comment.replyAttachmentDraft?.length ?? 0) === 0
                                                            }
                                                        >
                                                            등록
                                                        </Button2>
                                                    </div>
                                                </div>
                                            </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* === 신규 코멘트 작성 === */}
                                        {canComment &&
                                            !isCommentInteractionLocked(group) && (
                                            <div className="mt-2 space-y-2">
                                                <Textarea2
                                                    value={group.commentDraft}
                                                    disabled={
                                                        !canComment ||
                                                        isCommentInteractionLocked(group) ||
                                                        group.isCommentSubmitting
                                                    }
                                                    onChange={(e) =>
                                                        updateCommentDraft(
                                                            groupIndex,
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="코멘트를 입력 후 등록 버튼을 눌러주세요"
                                                    rows={3}
                                                    className="text-sm"
                                                />

                                                <div className="space-y-2">
                                                    <input
                                                        id={`comment-attachment-input-${group.id}`}
                                                        type="file"
                                                        multiple
                                                        className="hidden"
                                                        disabled={
                                                            !canComment ||
                                                            isCommentInteractionLocked(group) ||
                                                            group.isCommentSubmitting
                                                        }
                                                        onChange={(event) => {
                                                            handleCommentAttachmentSelect(
                                                                groupIndex,
                                                                event.target.files,
                                                            );
                                                            event.target.value = "";
                                                        }}
                                                    />
                                                    {group.commentAttachmentDraft.length > 0 && (
                                                        <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 px-3 py-2 text-[11px]">
                                                            {group.commentAttachmentDraft.map((attachment) => (
                                                                <div
                                                                    key={attachment.id}
                                                                    className="flex items-center justify-between gap-2"
                                                                >
                                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="truncate !text-[11px]" style={{ fontSize: "11px" }}>
                                                                            {attachment.file?.name ||
                                                                                attachment.fileName}
                                                                        </span>
                                                                    </div>
                                                                    <Button2
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="!h-5 px-2 !text-[11px]"
                                                                        style={{ fontSize: "11px" }}
                                                                        onClick={() =>
                                                                            removeCommentAttachmentDraft(
                                                                                groupIndex,
                                                                                attachment.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        제거
                                                                    </Button2>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="pb-6 flex items-center justify-between gap-3">
                                                        <Button2
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={
                                                                !canComment ||
                                                                isCommentInteractionLocked(group) ||
                                                                group.isCommentSubmitting
                                                            }
                                                            onClick={() =>
                                                                document
                                                                    .getElementById(
                                                                        `comment-attachment-input-${group.id}`,
                                                                    )
                                                                    ?.click()
                                                            }
                                                        >
                                                            <Paperclip className="h-4 w-4" />
                                                            파일 첨부
                                                        </Button2>

                                                        <Button2
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => {
                                                                void addComment(groupIndex);
                                                            }}
                                                            disabled={
                                                                group.isCommentSubmitting ||
                                                                (!group.commentDraft.trim() &&
                                                                    group.commentAttachmentDraft.length === 0)
                                                            }
                                                        >
                                                            {group.isCommentSubmitting
                                                                ? "등록 중..."
                                                                : "등록"}
                                                        </Button2>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card2>

                        {/* 이력 모달 */}
                        {group.isHistoryOpen &&
                            renderHistoryModal(group, groupIndex)}
                    </div>
                ))}
            </div>
        </div>

        {isHistoryPickerOpen && (
            <ModalShell
                open={isHistoryPickerOpen}
                onClose={() => setIsHistoryPickerOpen(false)}
                maxWidth="32rem"
            >
                <Card2
                    variant="modal"
                    className="w-full max-w-md overflow-hidden min-h-[420px] max-h-[75vh] flex flex-col"
                >
                    <CardHeader className="flex items-start justify-between gap-2 border-b">
                        <div>
                            <h3 className="text-lg font-semibold">체크리스트 이력 선택</h3>
                            <p className="text-sm text-muted-foreground">확인할 체크리스트를 선택하세요.</p>
                        </div>
                        <button
                            type="button"
                            aria-label="이력 선택 닫기"
                            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted"
                            onClick={() => setIsHistoryPickerOpen(false)}
                        >
                            ✕
                        </button>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-6 overflow-y-auto px-6 py-6 pb-10">
                        {groups.map((group, idx) => (
                            <button
                                key={group.id}
                                type="button"
                                onClick={() => {
                                    openChecklistHistoryModal(idx);
                                    setIsHistoryPickerOpen(false);
                                }}
                                className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm transition hover:bg-muted"
                            >
                                <span className="truncate">
                                    {group.title?.trim() || `체크리스트 ${idx + 1}`}
                                </span>
                                <span className="text-xs text-muted-foreground">이력 보기</span>
                            </button>
                        ))}
                    </CardContent>

                    <div className="mt-auto border-t bg-muted/30 px-6 py-4 pb-6">
                        <Button2
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsHistoryPickerOpen(false)}
                        >
                            닫기
                        </Button2>
                    </div>
                </Card2>
            </ModalShell>
        )}

        {isChecklistHistoryOpen && (
            <ModalShell
                open={isChecklistHistoryOpen}
                onClose={closeChecklistHistoryModal}
                maxWidth="64rem"
                className="h-full"
            >
                <Card2 variant="modal" className="login-theme flex h-full max-h-[90vh] w-full max-w-4xl flex-col gap-6 overflow-hidden rounded-xl border border-border shadow-2xl min-h-0">
                    <div className="flex flex-col gap-2 border-b px-6 pt-6 pb-6 text-center sm:flex-row sm:items-center sm:text-left">
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold">체크리스트 이력</h2>
                            <p className="text-sm text-muted-foreground">
                                {selectedHistoryGroupIndex != null
                                    ? `${getSelectedHistoryGroupTitle()}의 이력을 확인합니다.`
                                    : "저장된 체크리스트 내용을 이력으로 확인할 수 있습니다."}
                            </p>
                        </div>
                        <span className="text-sm font-semibold text-sky-600">
                            총 {remoteHistoryPage?.totalElements ?? 0}건
                        </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-6 px-6 pb-6 min-h-0 overflow-y-auto">
                        {remoteHistoryLoading && (
                            <p className="py-8 text-center text-sm text-muted-foreground">체크리스트 이력을 불러오는 중입니다...</p>
                        )}
                        {!remoteHistoryLoading && remoteHistoryError && (
                            <p className="py-8 text-center text-sm text-destructive">{remoteHistoryError}</p>
                        )}
                        {!remoteHistoryLoading &&
                            !remoteHistoryError &&
                            remoteHistoryPage?.content &&
                            remoteHistoryPage.content.length > 0 && (
                                <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                                    {remoteHistoryPage.content.map((history) => (
                                        <div key={history.changeLogId}>
                                            {renderBeforeDataCard(history)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        {!remoteHistoryLoading &&
                            !remoteHistoryError &&
                            (!remoteHistoryPage?.content || remoteHistoryPage.content.length === 0) && (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    아직 저장된 이력이 없습니다.
                                </p>
                            )}
                    </div>

                    <div className="border-t px-6 py-4">
                        <Button2 type="button" className="w-full" onClick={closeChecklistHistoryModal}>
                            닫기
                        </Button2>
                    </div>
                </Card2>
            </ModalShell>
        )}


        </>
    );
});
