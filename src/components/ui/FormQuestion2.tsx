import { useState, useEffect } from "react";
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

interface EvidenceItem {
    files: File[];
    links: string[];
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
    file: File;
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
    selectedIndexes: number[];
    evidences: Record<string, EvidenceItem>;
    comments: ChecklistComment[];
    commentDraft: string;
    commentAttachmentDraft: CommentAttachment[];
    isCommentOpen: boolean;
    status: "pending" | "approved" | "hold";
    locked: boolean;
    historyEntries: ChecklistHistoryEntry[];
    isHistoryOpen: boolean;
    historySelectedTargetId: number | null;
}

interface FormQuestionProps {
    resetSignal: number;
    disabled?: boolean;
    unlockSignal?: number;
    allowSelectionWhenDisabled?: boolean;
    allowCommentWhenDisabled?: boolean;
    commentAuthor?: string;
}

const createChecklistGroup = (id: number): ChecklistGroup => ({
    id,
    title: "",
    rules: Array(6).fill(""),
    selectedIndexes: [],
    evidences: {},
    comments: [],
    commentDraft: "",
    commentAttachmentDraft: [],
    isCommentOpen: false,
    status: "pending",
    locked: false,
    historyEntries: [],
    isHistoryOpen: false,
    historySelectedTargetId: null,
});

export function FormQuestion2({
                                  resetSignal,
                                  disabled = false,
                                  unlockSignal = 0,
                                  allowSelectionWhenDisabled = false,
                                  allowCommentWhenDisabled = false,
                                  commentAuthor = "작성자",
                              }: FormQuestionProps) {
    const [groups, setGroups] = useState<ChecklistGroup[]>([
        createChecklistGroup(1),
    ]);

    const canSelect = !disabled || allowSelectionWhenDisabled;
    const canComment = !disabled || allowCommentWhenDisabled;
    const canDecide = !disabled || allowSelectionWhenDisabled;
    const shouldClearSelectionsForReview = disabled && allowSelectionWhenDisabled;
    const [hasClearedForReview, setHasClearedForReview] = useState(false);

    const createHistoryEntry = (
        payload: Omit<ChecklistHistoryEntry, "id" | "timestamp">,
    ): ChecklistHistoryEntry => ({
        id: Date.now() + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        ...payload,
    });

    const createAttachment = (file: File): CommentAttachment => ({
        id: Date.now() + Math.floor(Math.random() * 1000),
        file,
    });

    // RESET
    useEffect(() => {
        setGroups([createChecklistGroup(1)]);
    }, [resetSignal]);

    // UNLOCK (e.g., 수정 버튼 클릭 시 group 상태 초기화)
    useEffect(() => {
        if (!unlockSignal) return;
        setGroups((prev) =>
            prev.map((group) => ({ ...group, status: "pending", locked: false })),
        );
    }, [unlockSignal]);

    // Client 리뷰 모드에서는 기존 체크 상태를 초기화한다.
    useEffect(() => {
        if (shouldClearSelectionsForReview && !hasClearedForReview) {
            setGroups((prev) =>
                prev.map((group) =>
                    group.selectedIndexes.length
                        ? { ...group, selectedIndexes: [] }
                        : group,
                ),
            );
            setHasClearedForReview(true);
        }

        if (!shouldClearSelectionsForReview && hasClearedForReview) {
            setHasClearedForReview(false);
        }
    }, [shouldClearSelectionsForReview, hasClearedForReview]);

    // 체크리스트 카드 추가
    const handleAddGroup = () => {
        if (disabled) return;
        setGroups((prev) => [...prev, createChecklistGroup(prev.length + 1)]);
    };

    // 체크리스트 카드 제거
    const handleRemoveGroup = () => {
        if (disabled) return;
        setGroups((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));
    };

    const toggleComment = (groupIndex: number) => {
        if (!canComment) return;
        setGroups((prev) =>
            prev.map((g, i) =>
                i === groupIndex ? { ...g, isCommentOpen: !g.isCommentOpen } : g,
            ),
        );
    };

    const updateCommentDraft = (groupIndex: number, value: string) => {
        if (!canComment) return;
        setGroups((prev) =>
            prev.map((g, i) =>
                i === groupIndex && !g.locked ? { ...g, commentDraft: value } : g,
            ),
        );
    };

    const addComment = (groupIndex: number) => {
        if (!canComment) return;
        setGroups((prev) =>
            prev.map((g, i) => {
                if (i !== groupIndex || g.locked) return g;
                const draft = g.commentDraft.trim();
                const hasAttachments = g.commentAttachmentDraft.length > 0;
                if (!draft && !hasAttachments) return g;

                const newComment: ChecklistComment = {
                    id: Date.now(),
                    text: draft,
                    createdAt: new Date().toISOString(),
                    author: commentAuthor,
                    updatedAt: null,
                    replies: [],
                    menuOpen: false,
                    isEditing: false,
                    editDraft: "",
                    showReplyBox: false,
                    replyDraft: "",
                    replyingToReplyId: null,
                    replyingToAuthor: null,
                    replyAttachmentDraft: [],
                    attachments: g.commentAttachmentDraft.map((attachment) => ({
                        ...attachment,
                    })),
                    editAttachmentDraft: [],
                };

                const historyEntry = createHistoryEntry({
                    targetId: newComment.id,
                    type: "comment",
                    action: "created",
                    author: newComment.author,
                    content: newComment.text,
                    parentCommentId: null,
                });

                return {
                    ...g,
                    comments: [...g.comments, newComment],
                    commentDraft: "",
                    commentAttachmentDraft: [],
                    historyEntries: [...g.historyEntries, historyEntry],
                    historySelectedTargetId: g.historySelectedTargetId ?? newComment.id,
                };
            }),
        );
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
            prev.map((g, i) =>
                i === groupIndex && !g.locked
                    ? {
                        ...g,
                        commentAttachmentDraft: [
                            ...g.commentAttachmentDraft,
                            ...newAttachments,
                        ],
                    }
                    : g,
            ),
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
        const url = URL.createObjectURL(attachment.file);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = attachment.file.name;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
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
                if (index !== groupIndex || group.locked) return group;
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
        setCommentsForGroup(groupIndex, (comments) =>
            comments.map((comment) => ({
                ...comment,
                menuOpen: comment.id === commentId ? !comment.menuOpen : false,
            })),
        );
    };

    const startCommentEdit = (groupIndex: number, commentId: number) => {
        if (!canComment) return;

        updateCommentState(groupIndex, commentId, (comment) => ({
            ...comment,
            isEditing: true,
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
            editDraft: "",
            editAttachmentDraft: [],
        }));
    };

    const saveCommentEdit = (groupIndex: number, commentId: number) => {
        if (!canComment) return;

        setGroups((prev) =>
            prev.map((group, index) => {
                if (index !== groupIndex) return group;

                let historyEntry: ChecklistHistoryEntry | null = null;

                const updatedComments = group.comments.map((comment) => {
                    if (comment.id !== commentId) return comment;

                    const newText = comment.editDraft.trim();
                    if (!newText) return comment;
                    const updatedAttachments =
                        comment.editAttachmentDraft ?? comment.attachments;

                    historyEntry = createHistoryEntry({
                        targetId: comment.id,
                        type: "comment",
                        action: "edited",
                        author: comment.author,
                        content: newText,
                        parentCommentId: null,
                    });

                    return {
                        ...comment,
                        text: newText,
                        updatedAt: new Date().toISOString(),
                        isEditing: false,
                        editDraft: "",
                        attachments: updatedAttachments,
                        editAttachmentDraft: [],
                    };
                });

                if (!historyEntry) return group;

                return {
                    ...group,
                    comments: updatedComments,
                    historyEntries: [...group.historyEntries, historyEntry],
                };
            }),
        );
    };

    const deleteComment = (groupIndex: number, commentId: number) => {
        if (!canComment) return;

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
                    historySelectedTargetId: removedIds.has(group.historySelectedTargetId ?? -1)
                        ? null
                        : group.historySelectedTargetId,
                };
            }),
        );
    };

    const openReplyBox = (
        groupIndex: number,
        commentId: number,
        target?: { replyId?: number | null; author?: string | null },
    ) => {
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
                    if (comment.id !== commentId || group.locked) return comment;

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

    const openHistoryModal = (groupIndex: number) => {
        setGroups((prev) =>
            prev.map((group, index) => {
                if (index !== groupIndex) return group;

                const fallbackTarget =
                    group.historySelectedTargetId ??
                    group.comments[0]?.id ??
                    group.historyEntries[group.historyEntries.length - 1]?.targetId ??
                    null;

                return {
                    ...group,
                    isHistoryOpen: true,
                    historySelectedTargetId: fallbackTarget,
                };
            }),
        );
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
                    ? { ...group, historySelectedTargetId: targetId }
                    : group,
            ),
        );
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

        const targetValues = Array.from(targetMap.values());

        const activeComments = group.comments;

        const deletedTargets = targetValues.filter((meta) => meta.isDeleted);
        const deletedComments = deletedTargets.filter(
            (meta) => meta.type === "comment",
        );
        const deletedReplies = deletedTargets.filter(
            (meta) => meta.type === "reply",
        );

        const deletedCommentIds = new Set(
            deletedComments.map((meta) => meta.id),
        );

        // 삭제된 댓글 중, 부모도 삭제된 댓글 아래에 들어갈 reply 정리
        const orphanDeletedReplies: HistoryTargetMeta[] = [];

        const deletedRepliesByParent = deletedReplies.reduce<
            Map<number, HistoryTargetMeta[]>
        >((map, meta) => {
            const parentId = meta.parentCommentId ?? -1;

            if (!deletedCommentIds.has(parentId)) {
                orphanDeletedReplies.push(meta);
                return map;
            }

            const list = map.get(parentId) ?? [];
            list.push(meta);
            map.set(parentId, list);
            return map;
        }, new Map());

        const activeCount =
            activeComments.length +
            activeComments.reduce(
                (sum, c) => sum + c.replies.length,
                0,
            );

        const deletedCount = deletedTargets.length;

        const selectedTarget =
            group.historySelectedTargetId !== null
                ? targetMap.get(group.historySelectedTargetId) ?? null
                : null;

        const timelineEntries = selectedTarget
            ? sortedEntries.filter(
                (entry) => entry.targetId === selectedTarget.id,
            )
            : [];
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
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
                <div
                    className="absolute inset-0"
                    onClick={() => closeHistoryModal(groupIndex)}
                    aria-hidden
                />

                <div className="relative z-10 flex h-full items-center justify-center p-4">
                    <Card2 className="flex h-full max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden">
                        <CardHeader className="relative border-b text-center">
                            <h3 className="text-lg font-semibold">
                                코멘트 이력
                            </h3>

                            <button
                                type="button"
                                aria-label="댓글 이력 닫기"
                                className="absolute right-4 top-3 rounded-md p-1 hover:bg-muted"
                                onClick={() =>
                                    closeHistoryModal(groupIndex)
                                }
                            />
                        </CardHeader>

                        <CardContent className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-6 py-6">
                            <div className="grid min-h-0 flex-1 gap-4 overflow-hidden md:grid-cols-2">
                                {/* 왼쪽: 현재 + 삭제된 댓글 리스트 */}
                                <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
                                    {/* 현재 댓글 */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <p className="font-medium text-foreground">
                                                현재 댓글
                                            </p>
                                            <span>총 {activeCount}건</span>
                                        </div>

                                        <div className="space-y-2">
                                            {activeComments.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    아직 등록된 댓글이 없습니다.
                                                </p>
                                            ) : (
                                                activeComments.map((comment) => (
                                                    <div
                                                        key={`history-active-${comment.id}`}
                                                        className="space-y-2"
                                                    >
                                                        {renderHistoryButton({
                                                            id: comment.id,
                                                            type: "comment",
                                                            parentCommentId: null,
                                                            author: comment.author,
                                                            latestContent:
                                                            comment.text,
                                                            latestTimestamp:
                                                                comment.updatedAt ??
                                                                comment.createdAt,
                                                            isDeleted: false,
                                                        })}

                                                        {comment.replies.map((reply) => (
                                                            <div
                                                                key={`history-active-reply-${reply.id}`}
                                                                className="pl-5"
                                                            >
                                                                {renderHistoryButton({
                                                                    id: reply.id,
                                                                    type: "reply",
                                                                    parentCommentId:
                                                                    comment.id,
                                                                    author:
                                                                    reply.author,
                                                                    latestContent:
                                                                    reply.text,
                                                                    latestTimestamp:
                                                                        reply.updatedAt ??
                                                                        reply.createdAt,
                                                                    isDeleted:
                                                                        false,
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* 삭제된 댓글 */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <p className="font-medium text-muted-foreground">
                                                삭제된 댓글
                                            </p>
                                            <span>총 {deletedCount}건</span>
                                        </div>

                                        <div className="space-y-2">
                                            {deletedCount === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    삭제된 댓글이 없습니다.
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {deletedComments.map((meta) => (
                                                        <div
                                                            key={`history-del-${meta.id}`}
                                                            className="space-y-1"
                                                        >
                                                            {renderHistoryButton(meta)}

                                                            {(deletedRepliesByParent.get(
                                                                    meta.id,
                                                                ) ?? []
                                                            ).map((reply) => (
                                                                <div
                                                                    key={`history-del-reply-${reply.id}`}
                                                                    className="pl-5"
                                                                >
                                                                    {renderHistoryButton(reply)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}

                                                    {orphanDeletedReplies.map(
                                                        (reply) => (
                                                            <div
                                                                key={`history-orphan-${reply.id}`}
                                                            >
                                                                {renderHistoryButton(reply)}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* 오른쪽: 선택한 댓글의 타임라인 */}
                                <div className="flex h-full min-h-0 flex-col space-y-2 overflow-hidden">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <p className="font-medium">
                                            선택한 댓글의 히스토리
                                        </p>
                                        {selectedTarget && (
                                            <span>총 {timelineEntries.length}건</span>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                                        <div className="space-y-3">
                                            {!selectedTarget && (
                                                <p className="text-sm text-muted-foreground">
                                                    왼쪽 목록에서 댓글을 선택해 주세요.
                                                </p>
                                            )}

                                            {selectedTarget && (
                                                <>
                                                    {/* 선택한 대상이 대댓글일 때 → 원댓글 표시 */}
                                                    {selectedTarget.parentCommentId && (
                                                        <div className="space-y-1 rounded-md border bg-background p-3">
                                                        <span className="text-xs text-muted-foreground">
                                                            원 댓글
                                                        </span>

                                                            <p className="text-xs text-muted-foreground">
                                                                {targetMap.get(
                                                                        selectedTarget.parentCommentId,
                                                                    )?.author ||
                                                                    group.comments.find(
                                                                        (c) =>
                                                                            c.id ===
                                                                            selectedTarget.parentCommentId,
                                                                    )?.author ||
                                                                    "익명"}
                                                            </p>

                                                            <p className="text-sm whitespace-pre-wrap text-foreground">
                                                                {targetMap.get(
                                                                        selectedTarget.parentCommentId,
                                                                    )?.latestContent ||
                                                                    group.comments.find(
                                                                        (c) =>
                                                                            c.id ===
                                                                            selectedTarget.parentCommentId,
                                                                    )?.text ||
                                                                    "내용이 없습니다."}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* 타임라인 */}
                                                    {timelineEntries.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground">
                                                            수정/삭제 이력이 없습니다.
                                                        </p>
                                                    ) : (
                                                        timelineEntries.map((entry) => {
                                                            const isDeleted =
                                                                entry.action === "deleted";
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
                                                                            isDeleted
                                                                                ? "text-destructive"
                                                                                : ""
                                                                        }`}
                                                                    >
                                                                        {getHistoryActionLabel(
                                                                            entry.action,
                                                                        )}
                                                                    </span>

                                                                        <span
                                                                            className={
                                                                                isDeleted
                                                                                    ? "text-destructive"
                                                                                    : undefined
                                                                            }
                                                                        >
                                                                        {new Date(
                                                                            entry.timestamp,
                                                                        ).toLocaleString()}
                                                                    </span>
                                                                    </div>

                                                                    <p className="mt-1 whitespace-pre-line text-sm text-foreground">
                                                                        {entry.content ||
                                                                            "내용이 없습니다."}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <div className="-mx-6 flex justify-end border-t border-border px-6 pb-6 pt-6">
                            <Button2
                                type="button"
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={() => closeHistoryModal(groupIndex)}
                            >
                                닫기
                            </Button2>
                        </div>
                    </Card2>
                </div>
            </div>
        );
    };
    return (
        <div>
            {/* 상단: 체크리스트 전체 + / - */}
            <div className="mb-2 flex items-center justify-between">
                <Label2 className="flex items-center gap-1 text-sm font-medium">
                    체크리스트
                </Label2>

                {!disabled && (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleAddGroup}
                            className="flex h-6 w-6 items-center justify-center rounded-md border text-xs hover:bg-muted/80"
                        >
                            +
                        </button>

                        <button
                            type="button"
                            onClick={handleRemoveGroup}
                            className="flex h-6 w-6 items-center justify-center rounded-md border text-xs hover:bg-muted/80"
                        >
                            -
                        </button>
                    </div>
                )}
            </div>

            {/* 체크리스트 카드들 */}
            <div className="space-y-6">
                {groups.map((group, groupIndex) => (
                    <div key={group.id} className="relative">
                        <Card2 className="border border-border/60 bg-muted/40 shadow-none">
                            <CardContent className="pt-4">
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
                                        if (!canSelect) return;

                                        setGroups((prev) =>
                                            prev.map((g, i) => {
                                                if (i !== groupIndex || g.locked)
                                                    return g;

                                                const selected = checked
                                                    ? [...g.selectedIndexes, itemIndex]
                                                    : g.selectedIndexes.filter(
                                                        (v) => v !== itemIndex,
                                                    );

                                                return {
                                                    ...g,
                                                    selectedIndexes: selected,
                                                };
                                            }),
                                        );
                                    }}
                                    evidences={group.evidences}
                                    onEvidenceUpload={(evidenceId, files) => {
                                        if (disabled) return;

                                        setGroups((prev) =>
                                            prev.map((g, i) => {
                                                if (i !== groupIndex || g.locked)
                                                    return g;

                                                return {
                                                    ...g,
                                                    evidences: {
                                                        ...g.evidences,
                                                        [evidenceId]: {
                                                            files,
                                                            links:
                                                                g.evidences[evidenceId]?.links ??
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

                                                return {
                                                    ...g,
                                                    evidences: {
                                                        ...g.evidences,
                                                        [evidenceId]: {
                                                            files:
                                                                g.evidences[evidenceId]?.files ??
                                                                [],
                                                            links,
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
                                    selectionEnabled={canSelect}
                                />

                                {/* 코멘트 / 이력 / 동의·보류 버튼 */}
                                <div className="my-2 mt-2 flex w-full flex-col items-end gap-2">
                                    {/* 동의 / 보류 버튼 */}
                                    <div className="flex items-center gap-1">
                                        {/* 동의 */}
                                        <button
                                            type="button"
                                            disabled={group.locked || !canDecide}
                                            className={`h-9 rounded-md border px-4 text-sm ${
                                                group.status === "approved"
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-background hover:bg-muted"
                                            }`}
                                            onClick={() => {
                                                if (
                                                    group.locked ||
                                                    !canDecide
                                                )
                                                    return;

                                                if (
                                                    !confirm(
                                                        "‘동의’로 확정하시겠습니까? \n 동의를 선택하면 이후에는 내용을 수정할 수 없습니다.",
                                                    )
                                                )
                                                    return;

                                                setGroups((prev) =>
                                                    prev.map((g, i) =>
                                                        i === groupIndex
                                                            ? {
                                                                ...g,
                                                                status:
                                                                    "approved",
                                                                locked: true,
                                                            }
                                                            : g,
                                                    ),
                                                );
                                            }}
                                        >
                                            동의
                                        </button>

                                        {/* 보류 */}
                                        <button
                                            type="button"
                                            disabled={group.locked || !canDecide}
                                            className={`h-9 rounded-md border px-4 text-sm ${
                                                group.status === "hold"
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-background hover:bg-muted"
                                            }`}
                                            onClick={() => {
                                                if (
                                                    group.locked ||
                                                    !canDecide
                                                )
                                                    return;

                                                if (
                                                    !confirm(
                                                        "‘보류’로 확정하시겠습니까? \n 보류를 선택하면 이후에는 내용을 수정할 수 없습니다.",
                                                    )
                                                )
                                                    return;

                                                setGroups((prev) =>
                                                    prev.map((g, i) =>
                                                        i === groupIndex
                                                            ? {
                                                                ...g,
                                                                status: "hold",
                                                                locked: true,
                                                            }
                                                            : g,
                                                    ),
                                                );
                                            }}
                                        >
                                            보류
                                        </button>
                                    </div>

                                    {/* 말풍선 + 이력 버튼 */}
                                    <div className="border-t flex w-full items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            disabled={!canComment}
                                            onClick={() =>
                                                toggleComment(groupIndex)
                                            }
                                            className="mb-2 mt-2 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-muted disabled:cursor-not-allowed"
                                        >
                                            <MessagesSquare className="h-4 w-4 text-muted-foreground " />
                                        </button>

                                        <button
                                            type="button"
                                            disabled={!canComment}
                                            onClick={() =>
                                                openHistoryModal(groupIndex)
                                            }
                                            className="mb-2 mt-2 text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline disabled:cursor-not-allowed"
                                        >
                                            코멘트 이력 보기
                                        </button>
                                    </div>
                                </div>

                                {/* === 코멘트 영역 === */}
                                {group.isCommentOpen && (
                                    <div className="mt-3 pb-6">
                                        <div className="space-y-2">
                                            {group.comments.map((comment) => {
                                                const isEditing =
                                                    comment.isEditing;
                                                const isMenuOpen =
                                                    comment.menuOpen;

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
                                                                    !group.locked && (
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
                                                            <div className="mt-2 space-y-2">
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
                                                                        disabled={!canComment || group.locked}
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
                                                                        {attachment.file.name}
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
                                                                            disabled={!canComment || group.locked}
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
                                                                                    saveCommentEdit(
                                                                                        groupIndex,
                                                                                        comment.id,
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    !comment.editDraft.trim()
                                                                                }
                                                                            >
                                                                                저장
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
                                                                {comment.attachments?.map((attachment) => (
                                                                    <button
                                                                        key={attachment.id}
                                                                        type="button"
                                                                        className="mt-2 flex w-full items-center gap-2 overflow-hidden rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-left text-xs text-primary underline-offset-2 hover:underline"
                                                                        onClick={() =>
                                                                            downloadCommentAttachment(
                                                                                attachment,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="truncate">{attachment.file.name}</span>
                                                                    </button>
                                                                ))}
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
                                                                                                    !group.locked && (
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
                                                                                                        disabled={!canComment || group.locked}
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
                                                                    {attachment.file.name}
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
                                                                                                            disabled={!canComment || group.locked}
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
                                                                                                {reply.attachments?.map((attachment) => (
                                                                                                    <button
                                                                                                        key={attachment.id}
                                                                                                        type="button"
                                                                                                        className="flex w-full items-center gap-2 overflow-hidden rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-left text-xs text-primary underline-offset-2 hover:underline"
                                                                                                        onClick={() =>
                                                                                                            downloadCommentAttachment(
                                                                                                                attachment,
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                                                                        <span className="truncate">
                                                                                                            {attachment.file.name}
                                                                                                        </span>
                                                                                                    </button>
                                                                                                ))}
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
                                    !group.locked && (
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
                                                    disabled={!canComment || group.locked}
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
                                                                        {attachment.file.name}
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
                                                        disabled={!canComment || group.locked}
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
                                        {canComment && !group.locked && (
                                            <div className="mt-2 space-y-2">
                                                <Textarea2
                                                    value={group.commentDraft}
                                                    disabled={
                                                        !canComment || group.locked
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
                                                        disabled={!canComment || group.locked}
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
                                                                            {attachment.file.name}
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

                                                    <div className="flex items-center justify-between gap-3">
                                                        <Button2
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={!canComment || group.locked}
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
                                                            onClick={() => addComment(groupIndex)}
                                                            disabled={
                                                                !group.commentDraft.trim() &&
                                                                group.commentAttachmentDraft.length === 0
                                                            }
                                                        >
                                                            등록
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
    );
}
