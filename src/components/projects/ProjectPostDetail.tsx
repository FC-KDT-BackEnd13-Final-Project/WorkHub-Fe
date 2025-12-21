import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card2, CardContent, CardFooter, CardHeader } from "../ui/card2";
import { Badge2 } from "../ui/badge2";
import { Button2 } from "../ui/button2";
import { Textarea2 } from "../ui/textarea2";
import { MoreVertical, Pencil, Trash2, CornerDownRight, History, X } from "lucide-react";
import { PostCard } from "./PostCard";
import { RichTextDemo, type RichTextDraft, type AttachmentDraft } from "../RichTextDemo";
import { postRevisionsByPostId, type PostRevision } from "../../data/postRevisions";
import {
    loadRepliesForPost,
    saveRepliesForPost,
    type PostReplyItem,
    POST_REPLIES_UPDATED_EVENT,
    POST_REPLIES_STORAGE_KEY,
} from "../../utils/postRepliesStorage";
import { mockProjectPosts } from "../../data/mockProjectPosts";
import { calculateTotalPages, clampPage, paginate } from "../../utils/pagination";
import {
    supportTicketStatusLabel,
    type SupportTicketStatus,
} from "../../data/supportTickets";
import { removeSupportStatus, saveSupportStatus } from "../../utils/supportTicketStatusStorage";
import { ModalShell } from "../common/ModalShell";
import {
    createComment,
    createPost,
    deleteComment,
    deletePost,
    fetchComments,
    fetchPost,
    fetchPostThreads,
    flattenPostReplies,
    mapLabelToPostType,
    mapPostTypeToLabel,
    updateComment,
    updatePost,
} from "../../lib/posts";
import type { CommentResponse, PostResponse, PostThreadResponse } from "../../types/post";
import { fileApi } from "@/lib/api";
import { historyApi } from "@/lib/history";
import type { AdminActionType } from "@/types/history";

export interface ReplyDraftPayload {
    title: string;
    content: string;
    attachments: AttachmentDraft[];
    links: { url: string; description: string; linkId?: number }[];
}

const COMMENTS_PER_PAGE = 5;
const SUPPORT_STATUS_OPTIONS: SupportTicketStatus[] = [
    "RECEIVED",
    "IN_PROGRESS",
    "COMPLETED",
];

const DEFAULT_POST_IP = "0.0.0.0";
const COMMENT_HISTORY_PAGE_SIZE = 10;
const POST_HISTORY_PAGE_SIZE = 10;

// 단일 CS 문의/포스트를 상세 뷰 및 편집 모드로 보여줌
interface PostPayload {
    id: string;
    customerName: string;
    type: "공지" | "질문" | "일반" | "접수" | "처리중" | "완료";
    title: string;
    content: string;
    createdDate: string;
    updatedDate: string;
    hashtag: string;
    isOwner?: boolean;
    parentId?: string | null; // 원글이면 null, 답글이면 원글 id
    ticketStatus?: SupportTicketStatus;
    attachments?: AttachmentDraft[];
    links?: { url: string; description: string }[];
}

interface CommentHistoryEntry {
    id: string;
    content: string;
    timestamp: string;
    action?: "created" | "edited" | "deleted" | "restored" | "moved" | "hidden";
    author?: string;
    targetId?: string | number;
}

interface CommentItem {
    id: string;
    author: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
    isEditing?: boolean;
    isOwner?: boolean;
    showReply?: boolean;
    replyContent?: string;
    parentId?: string | null; // null이면 최상위 댓글, 아니면 해당 댓글의 쓰레드 id
    menuOpen?: boolean; // … 메뉴 열림 여부
    history?: CommentHistoryEntry[];
    parentAuthor?: string;
    status?: "active" | "deleted";
    deletedAt?: string;
    deletedBy?: string;
}

interface ProjectPostDetailProps {
    initialPost?: PostPayload;
    backPath?: string;
    showBackButton?: boolean;
    startInEditMode?: boolean;
    onDeletePost?: () => Promise<void> | void;
    isDeletingPost?: boolean;
    onSubmitPostEdit?: (draft: RichTextDraft) => Promise<void> | void;
    showPostTypeSelector?: boolean;
    showStatusControls?: boolean;
    onChangeTicketStatus?: (status: SupportTicketStatus) => Promise<void> | void;
    isStatusUpdating?: boolean;
    onSubmitReplyDraft?: (draft: ReplyDraftPayload) => Promise<PostReplyItem> | void;
    isReplySubmitting?: boolean;
    onSubmitInlineComment?: (payload: { content: string; parentId?: string | null }) => Promise<PostReplyItem> | void;
    isInlineCommentSubmitting?: boolean;
    onUpdateInlineComment?: (payload: { content: string; commentId: string }) => Promise<PostReplyItem> | void;
    onDeleteInlineComment?: (commentId: string, options?: { skipRefresh?: boolean }) => Promise<void> | void;
    useExternalCommentSync?: boolean;
    allowPostLinkAttachments?: boolean;
}

export function ProjectPostDetail({
                                      initialPost,
                                      backPath,
                                      showBackButton = true,
                                      startInEditMode = false,
                                      onDeletePost,
                                      isDeletingPost = false,
                                      onSubmitPostEdit,
                                      showPostTypeSelector = true,
                                      showStatusControls = false,
                                      onChangeTicketStatus,
                                      isStatusUpdating = false,
                                      onSubmitReplyDraft,
                                      isReplySubmitting = false,
                                      onSubmitInlineComment,
                                      isInlineCommentSubmitting = false,
                                      onUpdateInlineComment,
                                      onDeleteInlineComment,
                                      useExternalCommentSync = false,
                                      allowPostLinkAttachments = true,
                                  }: ProjectPostDetailProps = {}) {
    const navigate = useNavigate();
    const { projectId, nodeId, postId, ticketId } = useParams<{
        projectId?: string;
        nodeId?: string;
        postId?: string;
        ticketId?: string;
    }>();
    const location = useLocation();
    const stateData = location.state as { post?: PostPayload; reply?: PostReplyItem; replyId?: string } | undefined;
    const statePost = stateData?.post;
    const replyIdFromState = stateData?.replyId;
    const useProjectApi = Boolean(projectId && nodeId && !initialPost && !useExternalCommentSync);

    const [fetchedPost, setFetchedPost] = useState<PostPayload | null>(null);
    const [commentTotalPages, setCommentTotalPages] = useState(1);
    const [mainPostId, setMainPostId] = useState<string | null>(postId ?? null);

    const fallbackPost =
        !statePost && !initialPost && postId
            ? mockProjectPosts.find((item) => item.id === postId)
            : undefined;

    const post: PostPayload =
        fetchedPost ||
        statePost ||
        initialPost ||
        (fallbackPost
            ? {
                id: fallbackPost.id,
                customerName: fallbackPost.customerName,
                type: fallbackPost.type,
                title: fallbackPost.title,
                content: fallbackPost.content,
                createdDate: fallbackPost.createdDate,
                updatedDate: fallbackPost.updatedDate,
                hashtag: fallbackPost.hashtag,
                isOwner: true,
                ticketStatus: undefined,
                attachments: [],
                links: [],
            }
            : {
                id: postId ?? "",
                customerName: "",
                type: "일반",
                title: "",
                content: "",
                createdDate: "",
                updatedDate: "",
                hashtag: "",
                isOwner: true,
                ticketStatus: undefined,
                attachments: [],
                links: [],
            });

    const derivedAttachmentsFromProps = useMemo(() => {
        if (fetchedPost?.attachments && fetchedPost.attachments.length > 0) {
            return fetchedPost.attachments;
        }
        if (statePost?.attachments && statePost.attachments.length > 0) {
            return statePost.attachments;
        }
        if (initialPost?.attachments && initialPost.attachments.length > 0) {
            return initialPost.attachments;
        }
        return fetchedPost?.attachments ?? statePost?.attachments ?? initialPost?.attachments ?? [];
    }, [fetchedPost?.attachments, statePost?.attachments, initialPost?.attachments]);

    const derivedLinksFromProps = useMemo(() => {
        if (fetchedPost?.links && fetchedPost.links.length > 0) {
            return fetchedPost.links;
        }
        if (statePost?.links && statePost.links.length > 0) {
            return statePost.links;
        }
        if (initialPost?.links && initialPost.links.length > 0) {
            return initialPost.links;
        }
        return fetchedPost?.links ?? statePost?.links ?? initialPost?.links ?? [];
    }, [fetchedPost?.links, statePost?.links, initialPost?.links]);

    const [postTitleState, setPostTitleState] = useState(post.title);
    const [postContentState, setPostContentState] = useState(post.content);
    const [postTypeState, setPostTypeState] = useState<PostPayload["type"]>(post.type);
    const [ticketStatus, setTicketStatus] = useState<SupportTicketStatus | undefined>(
        post.ticketStatus,
    );
    const [postAttachments, setPostAttachments] = useState<AttachmentDraft[]>(
        derivedAttachmentsFromProps,
    );
    const [postLinks, setPostLinks] = useState<
        { url: string; description: string; linkId?: number }[]
    >(derivedLinksFromProps);
    const [isPostEditing, setIsPostEditing] = useState(startInEditMode);
    const [postEditorKey, setPostEditorKey] = useState(0);
    const [postEditDraft, setPostEditDraft] = useState<RichTextDraft>({
        title: post.title,
        content: post.content,
        attachments: derivedAttachmentsFromProps,
        links: derivedLinksFromProps,
        type: post.type,
    });
    const [isPostSaving, setIsPostSaving] = useState(false);
    const isPostOwner = post.isOwner ?? true; // 임시: 작성자로 가정
    const [postMenuOpen, setPostMenuOpen] = useState(false); // 게시글 메뉴 열림 여부

    const [commentPage, setCommentPage] = useState(1);
    const [isCommentHistoryOpen, setIsCommentHistoryOpen] = useState(false);
    const [historyViewCommentId, setHistoryViewCommentId] = useState<string | null>(null);
    const [commentHistoryCache, setCommentHistoryCache] = useState<Record<string, CommentHistoryEntry[]>>({});
    const [commentHistoryLoadingTargetId, setCommentHistoryLoadingTargetId] = useState<string | null>(null);
    const [commentHistoryError, setCommentHistoryError] = useState<string | null>(null);
    const [postHistory, setPostHistory] = useState<PostRevision[]>([]);
    const [postHistoryLoading, setPostHistoryLoading] = useState(false);
    const [postHistoryError, setPostHistoryError] = useState<string | null>(null);

    // 게시글 수정 이력 모달 및 선택된 버전 상태
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedRevision, setSelectedRevision] = useState<PostRevision | null>(null);
    const revisions = postHistory.length
        ? postHistory
        : postRevisionsByPostId[post.id] ?? postRevisionsByPostId.default;

    const createEmptyReplyDraft = (): RichTextDraft => ({
        title: "",
        content: "",
        attachments: [],
        links: [],
        type: "일반",
    });

    const [replyDraft, setReplyDraft] = useState<RichTextDraft>(createEmptyReplyDraft);
    const [isReplying, setIsReplying] = useState(false);
    const [replyEditorKey, setReplyEditorKey] = useState(0);

    const postStorageKey = post.id || "default-post";

    const [postReplies, setPostReplies] = useState<PostReplyItem[]>([]);

    const normalizePostLinks = (links: PostResponse["links"] | undefined) =>
        (links ?? []).map((link) => ({
            url: link.referenceLink,
            description: link.linkDescription,
            linkId: link.linkId,
        }));

    const normalizePostFiles = (files: PostResponse["files"] | undefined) =>
        (files ?? []).map((file) => ({
            id: `file-${file.postFileId}`,
            name: file.originalFileName ?? file.fileName,
            size: 0,
            dataUrl: "",
            fileKey: file.fileName, // 백엔드에서 내려주는 저장 키를 다운로드 요청에 사용
        }));

    const toPostPayload = (response: PostResponse, createdAt?: string): PostPayload => ({
        id: String(response.postId),
        customerName: response.userName ?? "알 수 없음",
        type: mapPostTypeToLabel(response.postType),
        title: response.title,
        content: response.content,
        createdDate: createdAt ?? "",
        updatedDate: createdAt ?? "",
        hashtag: "",
        isOwner: true,
        parentId: response.parentPostId ? String(response.parentPostId) : null,
        ticketStatus: undefined,
    });

    const toReplyItemFromPost = (response: PostResponse, createdAt?: string): PostReplyItem => ({
        id: String(response.postId),
        title: response.title,
        content: response.content,
        createdAt: createdAt ?? new Date().toISOString(),
        author: response.userName ?? "알 수 없음",
        attachments: normalizePostFiles(response.files),
        links: normalizePostLinks(response.links),
        updatedAt: undefined,
        parentId: response.parentPostId ? String(response.parentPostId) : null,
        isComment: false,
    });

    const toReplyItemFromThread = (reply: PostThreadResponse): PostReplyItem => ({
        id: String(reply.postId),
        title: reply.title,
        content: reply.contentPreview,
        createdAt: reply.createdAt,
        author: (reply as any).userName ?? "알 수 없음",
        attachments: [],
        links: [],
        updatedAt: undefined,
        parentId: reply.parentPostId ? String(reply.parentPostId) : null,
        isComment: false,
    });

    const flattenComments = (items: CommentResponse[]): PostReplyItem[] => {
        const result: PostReplyItem[] = [];
        const walk = (comment: CommentResponse) => {
            result.push({
                id: String(comment.commentId),
                title: "",
                content: comment.commentContent,
                createdAt: comment.createAt,
                updatedAt: comment.updateAt,
                author: comment.userName ?? (comment.userId ? `사용자 ${comment.userId}` : "알 수 없음"),
                attachments: [],
                links: [],
                parentId: comment.parentCommentId ? String(comment.parentCommentId) : null,
                isComment: true,
            });
            (comment.children ?? []).forEach(walk);
        };
        items.forEach(walk);
        return result;
    };

    const replyFromState = stateData?.reply;
    const [focusedReply, setFocusedReply] = useState<PostReplyItem | null>(
        replyFromState ?? null,
    );
    const [focusedReplyMenuOpen, setFocusedReplyMenuOpen] = useState(false);
    const [editingReply, setEditingReply] = useState<PostReplyItem | null>(null);

    const startPostEditing = () => {
        setPostEditDraft({
            title: postTitleState,
            content: postContentState,
            attachments: postAttachments,
            links: postLinks,
            type: postTypeState,
        });
        setPostEditorKey((prev) => prev + 1);
        setIsPostEditing(true);
    };

    useEffect(() => {
        setPostTitleState(post.title);
        setPostContentState(post.content);
        setPostTypeState(post.type);
        setTicketStatus(post.ticketStatus);
        setPostAttachments(derivedAttachmentsFromProps);
        setPostLinks(derivedLinksFromProps);
    }, [
        post.title,
        post.content,
        post.type,
        post.ticketStatus,
        derivedAttachmentsFromProps,
        derivedLinksFromProps,
    ]);

    useEffect(() => {
        if (startInEditMode) {
            startPostEditing();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startInEditMode]);

    useEffect(() => {
        if (!useExternalCommentSync) return;
        const syncReplies = () => {
            const replies = loadRepliesForPost(postStorageKey);
            setPostReplies(replies);
        };

        syncReplies();

        if (typeof window === "undefined") {
            return undefined;
        }

        const handleStorage = (event: StorageEvent) => {
            if (event.key && event.key !== POST_REPLIES_STORAGE_KEY) {
                return;
            }
            syncReplies();
        };

        const handleCustomUpdate = () => {
            syncReplies();
        };

        window.addEventListener("storage", handleStorage);
        window.addEventListener(
            POST_REPLIES_UPDATED_EVENT,
            handleCustomUpdate as EventListener,
        );

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener(
                POST_REPLIES_UPDATED_EVENT,
                handleCustomUpdate as EventListener,
            );
        };
    }, [postStorageKey, useExternalCommentSync]);

    useEffect(() => {
        if (!useProjectApi || !projectId || !nodeId || !postId) return;
        let cancelled = false;

        const findThread = (
            threads: PostThreadResponse[],
            targetId: string,
        ): { parent: PostThreadResponse | null; reply: PostThreadResponse | null } => {
            for (const parent of threads) {
                if (String(parent.postId) === targetId) {
                    return { parent, reply: null };
                }
                const stack = [...(parent.replies ?? [])];
                while (stack.length > 0) {
                    const current = stack.pop();
                    if (!current) continue;
                    if (String(current.postId) === targetId) {
                        return { parent, reply: current };
                    }
                    stack.push(...(current.replies ?? []));
                }
            }
            return { parent: null, reply: null };
        };

        const loadPostDetail = async () => {
            try {
                const threadResponse = await fetchPostThreads({
                    projectId,
                    nodeId,
                    page: 0,
                    size: 50,
                });
                if (cancelled) return;
                const threads = threadResponse.posts ?? [];

                const { parent: matchedParent, reply: matchedReply } = findThread(threads, postId);
                const parentCreatedAt = matchedParent?.createdAt;

                const rawPost = await fetchPost({ projectId, nodeId, postId });
                if (cancelled) return;

                let mainPost = rawPost;
                let replyPost: PostResponse | null = null;
                let replyCreatedAt: string | undefined;

                if (rawPost.parentPostId) {
                    replyPost = rawPost;
                    replyCreatedAt = matchedReply?.createdAt;
                    mainPost = await fetchPost({
                        projectId,
                        nodeId,
                        postId: String(rawPost.parentPostId),
                    });
                    if (cancelled) return;
                }

                const payload = toPostPayload(mainPost, parentCreatedAt ?? "");
                const attachments = normalizePostFiles(mainPost.files);
                const links = normalizePostLinks(mainPost.links);
                setFetchedPost({
                    ...payload,
                    attachments,
                    links,
                });
                setMainPostId(String(mainPost.postId));

                setPostAttachments(attachments);
                setPostLinks(links);
                setPostEditDraft({
                    title: payload.title,
                    content: payload.content,
                    attachments,
                    links,
                    type: payload.type,
                });

                const replyItems = matchedParent
                    ? flattenPostReplies(matchedParent.replies ?? []).map(toReplyItemFromThread)
                    : [];
                setPostReplies((prev) => {
                    const commentsOnly = prev.filter((item) => item.isComment);
                    return [...replyItems, ...commentsOnly];
                });

                if (replyPost) {
                    setFocusedReply(toReplyItemFromPost(replyPost, replyCreatedAt));
                } else if (replyIdFromState) {
                    const found = replyItems.find((item) => item.id === replyIdFromState);
                    if (found) {
                        setFocusedReply(found);
                    } else {
                        const replyDetail = await fetchPost({
                            projectId,
                            nodeId,
                            postId: replyIdFromState,
                        });
                        if (cancelled) return;
                        setFocusedReply(toReplyItemFromPost(replyDetail));
                    }
                }
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "게시글 상세를 불러오는 중 오류가 발생했습니다.";
                toast.error(message);
            }
        };

        void loadPostDetail();
        return () => {
            cancelled = true;
        };
    }, [nodeId, postId, projectId, replyIdFromState, useProjectApi]);

    useEffect(() => {
        if (!useProjectApi) return;
        setCommentPage(1);
    }, [mainPostId, useProjectApi]);

    useEffect(() => {
        if (!useProjectApi || !projectId || !nodeId || !mainPostId) return;
        let cancelled = false;

        const loadComments = async () => {
            try {
                const commentResponse = await fetchComments({
                    projectId,
                    nodeId,
                    postId: mainPostId,
                    page: commentPage - 1,
                    size: COMMENTS_PER_PAGE,
                });
                if (cancelled) return;
                const commentItems = flattenComments(commentResponse.content ?? []);
                setCommentTotalPages(Math.max(commentResponse.totalPages ?? 1, 1));
                setPostReplies((prev) => {
                    const repliesOnly = prev.filter((item) => !item.isComment);
                    return [...repliesOnly, ...commentItems];
                });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "댓글을 불러오는 중 오류가 발생했습니다.";
                toast.error(message);
            }
        };

        void loadComments();
        return () => {
            cancelled = true;
        };
    }, [commentPage, mainPostId, nodeId, projectId, useProjectApi]);

    useEffect(() => {
        setFocusedReply(replyFromState ?? null);
    }, [replyFromState?.id]);

    // PostReplyItem을 CommentItem으로 변환 (함수를 먼저 정의)
    const convertReplyToComment = (reply: PostReplyItem): CommentItem => {
        return {
            id: reply.id,
            author: reply.author,
            content: reply.content,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
            isOwner: reply.isOwner ?? true,
            parentId: reply.parentId ?? null,
            history: [
                {
                    id: `hist-${reply.id}-initial`,
                    content: reply.content,
                    timestamp: reply.createdAt,
                    action: "created",
                },
            ],
            status: "active",
        };
    };

    const [comments, setComments] = useState<CommentItem[]>([]);

    // postReplies가 변경되면 comments도 업데이트
    useEffect(() => {
        const convertedComments = postReplies
            .filter((reply) => reply.isComment)
            .map(convertReplyToComment);
        setComments(convertedComments);
    }, [postReplies]);
    const [newComment, setNewComment] = useState("");

    const activeComments = comments.filter((comment) => comment.status !== "deleted");
    const topLevelComments = activeComments.filter((c) => (c.parentId ?? null) === null);

    const fallbackCommentPages = calculateTotalPages(topLevelComments.length, COMMENTS_PER_PAGE);
    const totalCommentPages = useProjectApi ? Math.max(commentTotalPages, 1) : fallbackCommentPages;
    const paginatedTopLevel = useProjectApi
        ? topLevelComments
        : paginate(topLevelComments, commentPage, COMMENTS_PER_PAGE);

    useEffect(() => {
        setCommentPage((prev) => clampPage(prev, totalCommentPages));
    }, [totalCommentPages]);

    const listPath =
        backPath ??
        (projectId && nodeId ? `/projects/${projectId}/nodes/${nodeId}/posts` : undefined);

    const formatDateOnly = (value?: string) => {
        if (!value) return "";
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, "0");
        const day = String(parsed.getDate()).padStart(2, "0");
        return `${year}.${month}.${day}`;
    };

    const postMetaItems = [
        post.customerName ? `작성자: ${post.customerName}` : undefined,
        post.createdDate ? `작성일: ${formatDateOnly(post.createdDate)}` : undefined,
        post.updatedDate ? `수정일: ${formatDateOnly(post.updatedDate)}` : undefined,
    ].filter(Boolean) as string[];

    const currentPostCardData = {
        title: postTitleState,
        content: postContentState,
        type: postTypeState,
    };

    const formatReplyDisplayDate = (value: string) => {
        if (!value) return "";
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("ko-KR");
    };

    const getReplyUpdatedLabel = (reply: PostReplyItem) => {
        if (!reply.updatedAt) return null;
        return formatReplyDisplayDate(reply.updatedAt);
    };

    const navigateBackToList = () => {
        if (listPath) {
            navigate(listPath, { replace: true });
        } else {
            navigate(-1);
        }
    };

    const handleTicketStatusChange = async (nextStatus: SupportTicketStatus) => {
        if (!post.id || isStatusUpdating) return;
        const previousStatus = ticketStatus;
        const previousType = postTypeState;

        setTicketStatus(nextStatus);
        const mappedLabel = supportTicketStatusLabel[nextStatus];
        setPostTypeState(mappedLabel as PostPayload["type"]);
        post.type = mappedLabel as PostPayload["type"];
        post.ticketStatus = nextStatus;

        const revertToPrevious = () => {
            setTicketStatus(previousStatus);
            const revertLabel = previousStatus
                ? supportTicketStatusLabel[previousStatus]
                : previousType;
            setPostTypeState(revertLabel as PostPayload["type"]);
            post.type = revertLabel as PostPayload["type"];
            post.ticketStatus = previousStatus;
        };

        try {
            if (onChangeTicketStatus) {
                await onChangeTicketStatus(nextStatus);
            }
            saveSupportStatus(post.id, nextStatus);
        } catch (error) {
            revertToPrevious();
            if (previousStatus) {
                saveSupportStatus(post.id, previousStatus);
            } else {
                removeSupportStatus(post.id);
            }
        }
    };

    const closeCommentHistory = () => {
        setIsCommentHistoryOpen(false);
        setHistoryViewCommentId(null);
    };

    const resetReplyDraft = () => {
        setReplyDraft(createEmptyReplyDraft());
        setReplyEditorKey((prev) => prev + 1);
    };

    const startReplying = () => {
        setEditingReply(null);
        setFocusedReplyMenuOpen(false);
        resetReplyDraft();
        setIsReplying(true);
    };

    const startEditingReply = (target: PostReplyItem) => {
        setFocusedReplyMenuOpen(false);
        setEditingReply(target);
        setIsReplying(false);
        setReplyDraft({
            title: target.title,
            content: target.content,
            attachments:
                target.attachments?.map((file, index) => ({
                    id: `reply-edit-${target.id}-${index}`,
                    name: file.name,
                    size: file.size ?? 0,
                    dataUrl: file.dataUrl ?? "",
                })) ?? [],
            links: target.links,
        });
        setReplyEditorKey((prev) => prev + 1);
    };

    const exitReplyEditor = () => {
        setIsReplying(false);
        setEditingReply(null);
        setFocusedReplyMenuOpen(false);
        resetReplyDraft();
    };

    const cancelPostEditing = () => {
        setIsPostEditing(false);
    };

    const handlePostDraftChange = (draft: RichTextDraft) => {
        setPostEditDraft(draft);
    };

    const submitPostEdit = async () => {
        const trimmedTitle = postEditDraft.title.trim() || "무제";
        if (!trimmedTitle && !postEditDraft.content.trim()) {
            return;
        }

        if (onSubmitPostEdit) {
            try {
                setIsPostSaving(true);
                await onSubmitPostEdit({
                    ...postEditDraft,
                    title: trimmedTitle,
                });
            } catch (error) {
                setIsPostSaving(false);
                return;
            }
            setIsPostSaving(false);
        } else if (useProjectApi && projectId && nodeId && mainPostId) {
            try {
                setIsPostSaving(true);
                const updated = await updatePost({
                    projectId,
                    nodeId,
                    postId: mainPostId,
                    payload: {
                        title: trimmedTitle,
                        content: postEditDraft.content,
                        postType: mapLabelToPostType(postEditDraft.type),
                        postIp: DEFAULT_POST_IP,
                        links: postEditDraft.links?.map((link) => ({
                            url: link.url,
                            description: link.description,
                            linkId: link.linkId,
                        })),
                    },
                });
                const attachments = normalizePostFiles(updated.files);
                const links = normalizePostLinks(updated.links);
                setPostAttachments(attachments);
                setPostLinks(links);
                setFetchedPost((prev) =>
                    prev
                        ? {
                            ...prev,
                            title: trimmedTitle,
                            content: updated.content,
                            type: mapPostTypeToLabel(updated.postType),
                        }
                        : prev,
                );
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "게시글 수정에 실패했습니다.";
                toast.error(message);
                setIsPostSaving(false);
                return;
            }
            setIsPostSaving(false);
        }

        const shouldApplyDraft = !useProjectApi || Boolean(onSubmitPostEdit);
        setPostTitleState(trimmedTitle);
        setPostContentState(postEditDraft.content);
        if (shouldApplyDraft) {
            setPostAttachments(postEditDraft.attachments);
            setPostLinks(postEditDraft.links);
        }
        setPostTypeState(postEditDraft.type);
        post.title = trimmedTitle;
        post.content = postEditDraft.content;
        post.type = postEditDraft.type;
        post.attachments = postEditDraft.attachments;
        post.links = postEditDraft.links;
        post.updatedDate = new Date().toISOString();
        setIsPostEditing(false);
    };

    const normalizeHtml = (value: string) =>
        value
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/\s+/g, " ")
            .trim();

    const draftAttachmentsToFiles = (attachments: AttachmentDraft[]) =>
        attachments
            .filter((file) => file.dataUrl)
            .map((file) => {
                const [header, encoded] = file.dataUrl.split(",");
                const mimeMatch = /data:(.*?);base64/.exec(header ?? "");
                const mime = mimeMatch?.[1] ?? "application/octet-stream";
                const binary = atob(encoded ?? "");
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i += 1) {
                    bytes[i] = binary.charCodeAt(i);
                }
                return new File([bytes], file.name, { type: mime });
            });

    const handleSubmitReplyDraft = async () => {
        const hasBody = normalizeHtml(replyDraft.content).length > 0;
        const replyTitle = replyDraft.title.trim();
        if (!hasBody && !replyTitle) {
            return;
        }

        const normalized = {
            title: replyTitle || "무제 답글",
            content: replyDraft.content,
            attachments: replyDraft.attachments.map((file) => ({
                name: file.name,
                size: file.size,
                dataUrl: file.dataUrl,
            })),
            links: replyDraft.links,
        };

        if (editingReply) {
            if (useProjectApi && projectId && nodeId) {
                try {
                    const updated = await updatePost({
                        projectId,
                        nodeId,
                        postId: editingReply.id,
                        payload: {
                            title: normalized.title,
                            content: normalized.content,
                            postType: mapLabelToPostType(
                                postTypeState as "공지" | "질문" | "일반",
                            ),
                            postIp: DEFAULT_POST_IP,
                            links: normalized.links?.map((link) => ({
                                url: link.url,
                                description: link.description,
                                linkId: link.linkId,
                            })),
                        },
                    });
                    const updatedReply = toReplyItemFromPost(updated);
                    setPostReplies((prev) => {
                        const updatedList = prev.map((reply) =>
                            reply.id === editingReply.id ? updatedReply : reply,
                        );
                        saveRepliesForPost(postStorageKey, updatedList);
                        return updatedList;
                    });
                    setFocusedReply(updatedReply);
                    exitReplyEditor();
                    return;
                } catch (error) {
                    const message =
                        error instanceof Error ? error.message : "답글 수정에 실패했습니다.";
                    toast.error(message);
                    return;
                }
            }

            const updatedReply: PostReplyItem = {
                ...editingReply,
                ...normalized,
                updatedAt: new Date().toISOString(),
            };
            setPostReplies((prev) => {
                const updated = prev.map((reply) =>
                    reply.id === editingReply.id ? updatedReply : reply,
                );
                saveRepliesForPost(postStorageKey, updated);
                return updated;
            });
            setFocusedReply(updatedReply);
            exitReplyEditor();
            return;
        }

        if (onSubmitReplyDraft) {
            try {
                const createdReply = await onSubmitReplyDraft(normalized);
                if (createdReply) {
                    setPostReplies((prev) => {
                        const updated = [createdReply, ...prev];
                        saveRepliesForPost(postStorageKey, updated);
                        return updated;
                    });
                    setFocusedReply(createdReply);
                    exitReplyEditor();
                    return;
                }
            } catch (error) {
                return;
            }
        }

        if (useProjectApi && projectId && nodeId && mainPostId) {
            try {
                const created = await createPost({
                    projectId,
                    nodeId,
                    payload: {
                        title: normalized.title,
                        content: normalized.content,
                        postType: mapLabelToPostType(
                            postTypeState as "공지" | "질문" | "일반",
                        ),
                        postIp: DEFAULT_POST_IP,
                        parentPostId: Number(mainPostId),
                        links: normalized.links?.map((link) => ({
                            url: link.url,
                            description: link.description,
                        })),
                    },
                    files: draftAttachmentsToFiles(replyDraft.attachments),
                });
                const createdReply = toReplyItemFromPost(created);
                setPostReplies((prev) => {
                    const updated = [createdReply, ...prev];
                    saveRepliesForPost(postStorageKey, updated);
                    return updated;
                });
                setFocusedReply(createdReply);
                exitReplyEditor();
                return;
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "답글 등록에 실패했습니다.";
                toast.error(message);
                return;
            }
        }

        const now = new Date();
        const newReply: PostReplyItem = {
            id: `reply-${Date.now()}`,
            ...normalized,
            createdAt: now.toISOString(),
            author: "나",
            updatedAt: undefined,
            isComment: false,
        };
        setPostReplies((prev) => {
            const updated = [newReply, ...prev];
            saveRepliesForPost(postStorageKey, updated);
            return updated;
        });
        setFocusedReply(newReply);
        exitReplyEditor();
    };

    const deleteFocusedReply = () => {
        if (!focusedReply) return;
        if (useProjectApi && projectId && nodeId) {
            deletePost({ projectId, nodeId, postId: focusedReply.id })
                .then(() => {
                    setPostReplies((prev) => {
                        const updated = prev.filter((reply) => reply.id !== focusedReply.id);
                        saveRepliesForPost(postStorageKey, updated);
                        return updated;
                    });
                    setFocusedReply(null);
                    setFocusedReplyMenuOpen(false);
                    if (editingReply && editingReply.id === focusedReply.id) {
                        exitReplyEditor();
                    }
                })
                .catch((error) => {
                    const message =
                        error instanceof Error ? error.message : "답글 삭제에 실패했습니다.";
                    toast.error(message);
                });
            return;
        }
        setPostReplies((prev) => {
            const updated = prev.filter((reply) => reply.id !== focusedReply.id);
            saveRepliesForPost(postStorageKey, updated);
            return updated;
        });
        setFocusedReply(null);
        setFocusedReplyMenuOpen(false);
        if (editingReply && editingReply.id === focusedReply.id) {
            exitReplyEditor();
        }
    };

    const refreshCommentsPage = async (pageOverride?: number) => {
        if (!useProjectApi || !projectId || !nodeId || !mainPostId) return;
        const targetPage = pageOverride ?? commentPage;
        try {
            const commentResponse = await fetchComments({
                projectId,
                nodeId,
                postId: mainPostId,
                page: targetPage - 1,
                size: COMMENTS_PER_PAGE,
            });
            const commentItems = flattenComments(commentResponse.content ?? []);
            setCommentTotalPages(Math.max(commentResponse.totalPages ?? 1, 1));
            setPostReplies((prev) => {
                const repliesOnly = prev.filter((item) => !item.isComment);
                return [...repliesOnly, ...commentItems];
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "댓글을 불러오는 중 오류가 발생했습니다.";
            toast.error(message);
        }
    };

    const handleHistoryOpen = () => {
        setSelectedRevision(null);
        setPostMenuOpen(false);
        setIsHistoryOpen(true);
    };

    const getRevisionTimestamp = (revision: PostRevision) =>
        revision.updatedAt ?? revision.editedAt ?? revision.createdAt ?? "";

    const getRevisionPreview = (content: string) => {
        if (!content) return "";
        const trimmed = content.trim();
        const firstLineBreak = trimmed.indexOf("\n");
        const line = firstLineBreak !== -1 ? trimmed.slice(0, firstLineBreak) : trimmed;
        const firstSentenceEnd = line.indexOf(".");
        if (firstSentenceEnd !== -1) {
            return line.slice(0, firstSentenceEnd + 1);
        }
        return line;
    };

    const sortedRevisions = [...revisions].sort((a, b) => {
        const aTime = getRevisionTimestamp(a)
            ? new Date(getRevisionTimestamp(a)).getTime()
            : 0;
        const bTime = getRevisionTimestamp(b)
            ? new Date(getRevisionTimestamp(b)).getTime()
            : 0;
        return bTime - aTime;
    });

    const closeHistory = () => {
        setIsHistoryOpen(false);
        setSelectedRevision(null);
    };

    useEffect(() => {
        if (!isHistoryOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeHistory();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isHistoryOpen]);

    const extractCommentContentFromHistory = (afterData?: string | null, beforeData?: string | null) => {
        const tryParse = (raw?: string | null) => {
            if (!raw) return null;
            try {
                return JSON.parse(raw);
            } catch {
                return raw;
            }
        };

        const candidate = tryParse(afterData) ?? tryParse(beforeData);
        if (typeof candidate === "string") return candidate;
        if (candidate && typeof candidate === "object") {
            const text =
                (candidate as any).qnaContent ||
                (candidate as any).content ||
                (candidate as any).text ||
                (candidate as any).clContent ||
                (candidate as any).comment ||
                (candidate as any).commentContent ||
                (candidate as any).replyContent ||
                (candidate as any).description ||
                (candidate as any).message ||
                (candidate as any).body ||
                "";
            if (typeof text === "string") return text;
        }
        return afterData || beforeData || "";
    };

    const mapAdminHistoryToCommentHistoryEntry = (item: { changeLogId: number | string; actionType: AdminActionType; updatedBy?: { userName?: string | null } | null; createdBy?: { userName?: string | null } | null; updatedAt: string; afterData?: string | null; beforeData?: string | null; targetId: number | string; }): CommentHistoryEntry => ({
        id: String(item.changeLogId),
        content: extractCommentContentFromHistory(item.afterData, item.beforeData),
        timestamp: item.updatedAt,
        action: mapAdminActionToCommentHistoryAction(item.actionType),
        author: item.updatedBy?.userName || item.createdBy?.userName || "익명",
        targetId: item.targetId,
    });

    const fetchCommentHistory = useCallback(
        async (commentId: string) => {
            setCommentHistoryError(null);
            setCommentHistoryLoadingTargetId(commentId);
            try {
                const data = await historyApi.getHistoriesByTarget(commentId, {
                    historyType: useExternalCommentSync ? "CS_QNA" : "POST_COMMENT",
                    page: 0,
                    size: COMMENT_HISTORY_PAGE_SIZE,
                    sort: "updatedAt,DESC",
                });

                const entries =
                    data.content?.map((item) =>
                        mapAdminHistoryToCommentHistoryEntry({
                            changeLogId: item.changeLogId,
                            actionType: item.actionType as AdminActionType,
                            updatedBy: item.updatedBy,
                            createdBy: item.createdBy,
                            updatedAt: item.updatedAt,
                            afterData: item.afterData,
                            beforeData: item.beforeData,
                            targetId: item.targetId,
                        }),
                    ) ?? [];

                setCommentHistoryCache((prev) => ({
                    ...prev,
                    [commentId]: entries,
                }));
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "댓글 이력을 불러오지 못했습니다.";
                setCommentHistoryError(message);
            } finally {
                setCommentHistoryLoadingTargetId(null);
            }
        },
        [COMMENT_HISTORY_PAGE_SIZE],
    );

    useEffect(() => {
        if (!isCommentHistoryOpen || !historyViewCommentId) return;
        if (commentHistoryCache[historyViewCommentId]) return;
        void fetchCommentHistory(historyViewCommentId);
    }, [isCommentHistoryOpen, historyViewCommentId, commentHistoryCache, fetchCommentHistory]);

    const parsePostBeforeData = (beforeData?: string | null): { title: string; content: string } => {
        if (!beforeData) return { title: "", content: "" };
        try {
            const parsed = JSON.parse(beforeData);
            const title =
                parsed.title ||
                parsed.postTitle ||
                parsed.subject ||
                "";
            const content =
                parsed.content ||
                parsed.body ||
                parsed.description ||
                parsed.text ||
                parsed.postContent ||
                parsed.clContent ||
                "";
            return {
                title: typeof title === "string" ? title : "",
                content: typeof content === "string" ? content : "",
            };
        } catch {
            return { title: "", content: beforeData };
        }
    };

    const mapAdminHistoryToPostRevision = (
        item: {
            changeLogId: number | string;
            updatedBy?: { userName?: string | null } | null;
            createdBy?: { userName?: string | null } | null;
            updatedAt: string;
            beforeData?: string | null;
            actionType?: AdminActionType;
        },
        index: number,
    ): PostRevision => {
        const { title, content } = parsePostBeforeData(item.beforeData);
        const author = item.updatedBy?.userName || item.createdBy?.userName || "익명";
        return {
            id: String(item.changeLogId),
            version: index + 1,
            title: title || "제목 없음",
            content: content || "",
            author,
            createdAt: item.updatedAt,
            updatedAt: item.updatedAt,
            editor: author,
            editedAt: item.updatedAt,
            actionType: mapAdminActionToPostRevisionAction(item.actionType),
        };
    };

    const fetchPostHistory = useCallback(
        async () => {
            const targetId = useExternalCommentSync ? ticketId : mainPostId ?? postId;
            if (!targetId) return;
            setPostHistoryError(null);
            setPostHistoryLoading(true);
            try {
                const data = await historyApi.getHistoriesByTarget(targetId, {
                    historyType: useExternalCommentSync ? "CS_POST" : "POST",
                    page: 0,
                    size: POST_HISTORY_PAGE_SIZE,
                    sort: "updatedAt,DESC",
                });

                const entries =
                    data.content?.map((item, index) =>
                        mapAdminHistoryToPostRevision(
                            {
                                changeLogId: item.changeLogId,
                                updatedBy: item.updatedBy,
                                createdBy: item.createdBy,
                                updatedAt: item.updatedAt,
                                beforeData: item.beforeData,
                                actionType: item.actionType as AdminActionType | undefined,
                            },
                            index,
                        ),
                    ) ?? [];

                setPostHistory(entries);
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "게시글 이력을 불러오지 못했습니다.";
                setPostHistoryError(message);
            } finally {
                setPostHistoryLoading(false);
            }
        },
        [mainPostId, postId, ticketId, useExternalCommentSync],
    );

    useEffect(() => {
        if (!isHistoryOpen) return;
        if (postHistory.length || postHistoryLoading) return;
        void fetchPostHistory();
    }, [isHistoryOpen, postHistory.length, postHistoryLoading, fetchPostHistory]);

    const handleDeletePost = async () => {
        if (onDeletePost) {
            await onDeletePost();
            return;
        }
        if (useProjectApi && projectId && nodeId && mainPostId) {
            try {
                await deletePost({ projectId, nodeId, postId: mainPostId });
                navigateBackToList();
                return;
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "게시글 삭제에 실패했습니다.";
                toast.error(message);
                return;
            }
        } else {
            navigate(-1);
        }
    };

    const shouldShowStatusControls = showStatusControls || typeof ticketStatus !== "undefined";

    const postActionMenu = !isPostEditing ? (
        <div className="relative">
            <button
                type="button"
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                onClick={() => setPostMenuOpen((prev) => !prev)}
                aria-label="게시글 메뉴 열기"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {postMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-md border bg-background shadow-lg text-sm overflow-hidden z-20">
                    {shouldShowStatusControls && (
                        <div className="border-b px-4 py-4 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">상태 변경</p>
                            <div className="flex flex-wrap gap-2">
                                {SUPPORT_STATUS_OPTIONS.map((status) => {
                                    const label = supportTicketStatusLabel[status];
                                    const isActive = ticketStatus === status;
                                    return (
                                        <button
                                            key={status}
                                            type="button"
                                            className={`rounded-full border px-2 py-0.5 text-xs ${
                                                isActive
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-muted text-muted-foreground hover:bg-accent"
                                            }`}
                                            onClick={() => {
                                                void handleTicketStatusChange(status);
                                            }}
                                            disabled={isStatusUpdating}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {isPostOwner && (
                        <button
                            type="button"
                            className="flex w-full items-center px-4 py-2 hover:bg-muted"
                            onClick={() => {
                                setPostMenuOpen(false);
                                startPostEditing();
                            }}
                        >
                            <Pencil className="w-4 h-4" />
                            <span className="whitespace-nowrap pl-2">수정하기</span>
                        </button>
                    )}
                    <button
                        type="button"
                        className="flex w-full items-center px-4 py-2 hover:bg-muted"
                        onClick={handleHistoryOpen}
                    >
                        <History className="w-4 h-4" />
                        <span className="whitespace-nowrap pl-2">이력 보기</span>
                    </button>
                    {isPostOwner && (
                        <button
                            type="button"
                            className="flex w-full items-center px-4 py-2 text-destructive hover:bg-muted"
                            onClick={() => {
                                setPostMenuOpen(false);
                                void handleDeletePost();
                            }}
                            disabled={isDeletingPost}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="whitespace-nowrap pl-2">
                                {isDeletingPost ? "삭제 중..." : "삭제하기"}
                            </span>
                        </button>
                    )}
                </div>
            )}
        </div>
    ) : null;

    if (!post) {
        return (
            <div className="w-full max-w-5xl mx-auto p-6 space-y-4">
                <Card2>
                    <CardContent className="py-12 text-center space-y-4">
                        <p className="text-lg font-medium">게시글 정보를 불러올 수 없습니다.</p>
                        <Button2 onClick={navigateBackToList}>목록으로 돌아가기</Button2>
                    </CardContent>
                </Card2>
            </div>
        );
    }

    const isEditingReply = Boolean(editingReply);

    if (isPostEditing) {
        const canSubmitPost = Boolean(
            postEditDraft.title.trim() || normalizeHtml(postEditDraft.content),
        );

        return (
            <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">게시글 수정</h1>
                </div>
                <RichTextDemo
                    key={postEditorKey}
                    initialDraft={postEditDraft}
                    onChange={(draft) => {
                        handlePostDraftChange(draft);
                    }}
                    showTypeSelector={showPostTypeSelector && !post.ticketStatus}
                    allowLinks={allowPostLinkAttachments}
                    actionButtons={({ clear }) => (
                        <div className="flex items-center gap-2">
                            <Button2
                                variant="outline"
                                onClick={() => {
                                    clear();
                                    cancelPostEditing();
                                }}
                                disabled={isPostSaving}
                            >
                                취소
                            </Button2>
                            <Button2
                                onClick={submitPostEdit}
                                disabled={!canSubmitPost || isPostSaving}
                            >
                                {isPostSaving ? "저장 중..." : "저장"}
                            </Button2>
                        </div>
                    )}
                />
            </div>
        );
    }

    if (isReplying || isEditingReply) {
        const canSubmitReply = Boolean(
            replyDraft.title.trim() || normalizeHtml(replyDraft.content),
        );

        return (
            <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">
                        {isEditingReply ? "답글 수정" : "답글 작성"}
                    </h1>
                </div>
                <RichTextDemo
                    key={replyEditorKey}
                    initialDraft={isEditingReply ? replyDraft : undefined}
                    onChange={setReplyDraft}
                    showTypeSelector={false}
                    actionButtons={({ clear }) => (
                        <div className="flex items-center gap-2">
                            <Button2
                                variant="outline"
                                onClick={() => {
                                    clear();
                                    exitReplyEditor();
                                }}
                            >
                                취소
                            </Button2>
                            <Button2
                                onClick={() => {
                                    void handleSubmitReplyDraft();
                                }}
                                disabled={!canSubmitReply || isReplySubmitting}
                            >
                                {isEditingReply ? "수정 완료" : "등록"}
                            </Button2>
                        </div>
                    )}
                />
            </div>
        );
    }

    // ───────────── 댓글 CRUD 핸들러 ─────────────

    const handleAddComment = async () => {
        if (!newComment.trim() || isInlineCommentSubmitting) return;

        const trimmed = newComment.trim();
        const nextTopLevelCount = topLevelComments.length + 1;
        const nextPage = calculateTotalPages(nextTopLevelCount, COMMENTS_PER_PAGE);

        if (onSubmitInlineComment) {
            try {
                const created = await onSubmitInlineComment({ content: trimmed });
                if (created && !useExternalCommentSync) {
                    const commentReply: PostReplyItem = { ...created, isComment: true };
                    setPostReplies((prev) => {
                        const updated = [...prev, commentReply];
                        saveRepliesForPost(postStorageKey, updated);
                        return updated;
                    });
                    setNewComment("");
                    setCommentPage(nextPage);
                    return;
                }
            } catch {
                return;
            }
        }

        if (useProjectApi && projectId && nodeId && mainPostId) {
            try {
                await createComment({
                    projectId,
                    nodeId,
                    postId: mainPostId,
                    payload: { content: trimmed },
                });
                setNewComment("");
                setCommentPage(1);
                await refreshCommentsPage(1);
                return;
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "댓글 등록에 실패했습니다.";
                toast.error(message);
                return;
            }
        }

        const createdAt = new Date().toLocaleString("ko-KR");
        const now = Date.now();
        const newCommentId = `c-${now}`;
        const initialHistory: CommentHistoryEntry = {
            id: `hist-${newCommentId}-created`,
            content: trimmed,
            timestamp: createdAt,
            action: "created",
        };
        setComments((prev) => [
            ...prev,
            {
                id: newCommentId,
                author: "나",
                content: trimmed,
                createdAt,
                isOwner: true,
                parentId: null,
                history: [initialHistory],
                parentAuthor: undefined,
                status: "active",
            },
        ]);
        setNewComment("");
        setCommentPage(nextPage);
    };

    const collectDescendantCommentIds = (targetId: string, list: CommentItem[]): string[] => {
        const children = list.filter((comment) => comment.parentId === targetId);
        return children.flatMap((child) => [
            ...collectDescendantCommentIds(child.id, list),
            child.id,
        ]);
    };

    const handleDeleteComment = async (id: string) => {
        const cascadeIds = collectDescendantCommentIds(id, comments);
        const idsToRemove = [...cascadeIds, id];

        if (!onDeleteInlineComment && !(useProjectApi && projectId && nodeId && mainPostId)) {
            setComments((prev) => prev.filter((comment) => !idsToRemove.includes(comment.id)));
            return;
        }

        try {
            if (onDeleteInlineComment) {
                for (const targetId of cascadeIds) {
                    await onDeleteInlineComment(targetId, { skipRefresh: true });
                }
                await onDeleteInlineComment(id);

                if (!useExternalCommentSync) {
                    setPostReplies((prev) => {
                        const removalSet = new Set(idsToRemove);
                        const updated = prev.filter((reply) => !removalSet.has(reply.id));
                        saveRepliesForPost(postStorageKey, updated);
                        return updated;
                    });
                }
                return;
            }

            if (useProjectApi && projectId && nodeId && mainPostId) {
                for (const targetId of cascadeIds) {
                    await deleteComment({
                        projectId,
                        nodeId,
                        postId: mainPostId,
                        commentId: targetId,
                    });
                }
                await deleteComment({
                    projectId,
                    nodeId,
                    postId: mainPostId,
                    commentId: id,
                });
                await refreshCommentsPage();
            }
        } catch {
            // swallow
        }
    };

    const handleToggleEdit = (id: string, editing: boolean) => {
        if (!editing && onUpdateInlineComment) {
            // when cancelling edit after API, revert to stored content
            const target = postReplies.find((reply) => reply.id === id);
            if (target) {
                setComments((prev) =>
                    prev.map((comment) =>
                        comment.id === id
                            ? { ...comment, content: target.content, isEditing: false, menuOpen: false }
                            : comment,
                    ),
                );
                return;
            }
        }
        setComments((prev) =>
            prev.map((comment) =>
                comment.id === id ? { ...comment, isEditing: editing, menuOpen: false } : comment,
            ),
        );
    };

    const handleUpdateComment = async (id: string, content: string) => {
        if (!onUpdateInlineComment && !(useProjectApi && projectId && nodeId && mainPostId)) {
            const updatedAt = new Date().toLocaleString("ko-KR");
            setComments((prev) =>
                prev.map((comment) =>
                    comment.id === id
                        ? {
                            ...comment,
                            content,
                            updatedAt,
                            isEditing: false,
                            menuOpen: false,
                        }
                        : comment,
                ),
            );
            return;
        }

        const previous = comments.find((comment) => comment.id === id)?.content;

        try {
            if (onUpdateInlineComment) {
                const updated = await onUpdateInlineComment({ commentId: id, content });
                if (updated) {
                    const normalizedUpdated: PostReplyItem = { ...updated, isComment: true };
                    setPostReplies((prev) => {
                        const next = prev.map((reply) =>
                            reply.id === id ? normalizedUpdated : reply,
                        );
                        saveRepliesForPost(postStorageKey, next);
                        return next;
                    });
                }
                return;
            }

            if (useProjectApi && projectId && nodeId && mainPostId) {
                await updateComment({
                    projectId,
                    nodeId,
                    postId: mainPostId,
                    commentId: id,
                    payload: { commentContext: content },
                });
                await refreshCommentsPage();
            }
        } catch {
            setComments((prev) =>
                prev.map((comment) =>
                    comment.id === id
                        ? {
                            ...comment,
                            content: previous ?? comment.content,
                            isEditing: false,
                            menuOpen: false,
                        }
                        : comment,
                ),
            );
        }
    };

    const toggleReplyBox = (id: string) => {
        setComments((prev) =>
            prev.map((c) => (c.id === id ? { ...c, showReply: !c.showReply } : c)),
        );
    };

    const changeReplyText = (id: string, value: string) => {
        setComments((prev) =>
            prev.map((c) => (c.id === id ? { ...c, replyContent: value } : c)),
        );
    };

    // target(댓글/대댓글)에 대한 답글 등록
    const handleSubmitReply = async (targetId: string) => {
        if (isInlineCommentSubmitting) return;
        const target = comments.find((c) => c.id === targetId);
        if (!target) return;

        const text = target.replyContent?.trim();
        if (!text) return;

        const rootId = (target.parentId ?? null) === null ? target.id : (target.parentId as string);

        if (onSubmitInlineComment) {
            setComments((prev) =>
                prev.map((c) =>
                    c.id === targetId ? { ...c, showReply: false, replyContent: "" } : c,
                ),
            );
            try {
                const created = await onSubmitInlineComment({ content: text, parentId: rootId });
                if (created && !useExternalCommentSync) {
                    const commentReply: PostReplyItem = { ...created, isComment: true };
                    setPostReplies((postPrev) => {
                        const updated = [...postPrev, commentReply];
                        saveRepliesForPost(postStorageKey, updated);
                        return updated;
                    });
                }
            } catch {
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === targetId ? { ...c, showReply: true, replyContent: text } : c,
                    ),
                );
            }
            return;
        }

        if (useProjectApi && projectId && nodeId && mainPostId) {
            setComments((prev) =>
                prev.map((c) =>
                    c.id === targetId ? { ...c, showReply: false, replyContent: "" } : c,
                ),
            );
            try {
                await createComment({
                    projectId,
                    nodeId,
                    postId: mainPostId,
                    payload: { content: text, parentCommentId: Number(rootId) },
                });
                await refreshCommentsPage();
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : "댓글 답글 등록에 실패했습니다.";
                toast.error(message);
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === targetId ? { ...c, showReply: true, replyContent: text } : c,
                    ),
                );
            }
            return;
        }

        setComments((prev) => {
            const updated = prev.map((c) =>
                c.id === targetId ? { ...c, showReply: false, replyContent: "" } : c,
            );

            const createdAt = new Date().toLocaleString("ko-KR");
            const now = Date.now();
            const replyId = `${rootId}-reply-${now}`;
            const newReply: CommentItem = {
                id: replyId,
                author: "나",
                content: text,
                createdAt,
                isOwner: true,
                parentId: rootId,
                history: [
                    {
                        id: `hist-${replyId}-created`,
                        content: text,
                        timestamp: createdAt,
                        action: "created",
                    },
                ],
                parentAuthor: target.author,
                status: "active",
            };

            return [...updated, newReply];
        });
    };

    const toggleMenu = (id: string) => {
        setComments((prev) =>
            prev.map((c) =>
                c.id === id ? { ...c, menuOpen: !c.menuOpen } : { ...c, menuOpen: false },
            ),
        );
    };

    // ───────────── 렌더링: 댓글/대댓글 ─────────────

    const renderCommentList = (targetTopLevel: CommentItem[]) => {
        return targetTopLevel.map((comment) => {
            const replies = comments.filter(
                (c) => c.parentId === comment.id && c.status !== "deleted",
            );

            return (
                <div key={comment.id} className="space-y-2">
                    {/* 최상위 댓글 */}
                    <div className="rounded-md bg-background px-6 py-4 border border-border">
                        {/* 상단: 작성자 / 시간 / ⋮ 메뉴 */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground text-sm">{comment.author}</span>
                                <span>{comment.createdAt}</span>
                                {comment.updatedAt && (
                                    <span className="text-[11px] text-muted-foreground">
                    · 수정: {comment.updatedAt}
                  </span>
                                )}
                            </div>

                            {/* ⋮ 메뉴 (누구나 볼 수 있고, 수정/삭제는 작성자만) */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="p-1 text-muted-foreground hover:text-foreground"
                                    onClick={() => toggleMenu(comment.id)}
                                >
                                    ⋮
                                </button>
                                {comment.menuOpen && (
                                    <div className="absolute right-0 mt-1 w-24 rounded-md border bg-background shadow-sm text-sm overflow-hidden z-10 flex flex-col">
                                        <button
                                            type="button"
                                            className="w-full px-3 py-2 text-center whitespace-nowrap hover:bg-muted"
                                            onClick={() => {
                                                toggleReplyBox(comment.id);
                                                toggleMenu(comment.id); // 메뉴 닫기
                                            }}
                                        >
                                            답글
                                        </button>
                                        {comment.isOwner && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="w-full px-3 py-2 text-center whitespace-nowrap hover:bg-muted"
                                                    onClick={() => handleToggleEdit(comment.id, true)}
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    type="button"
                                                    className="w-full px-3 py-2 text-center whitespace-nowrap text-destructive hover:bg-muted"
                                                    onClick={() => {
                                                        void handleDeleteComment(comment.id);
                                                    }}
                                                    disabled={isInlineCommentSubmitting}
                                                >
                                                삭제
                                            </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 내용 or 수정 모드 */}
                        {comment.isEditing ? (
                            <div className="space-y-2 mt-2">
                                <Textarea2
                                    rows={3}
                                    value={comment.content}
                                    onChange={(e) =>
                                        setComments((prev) =>
                                            prev.map((c) =>
                                                c.id === comment.id ? { ...c, content: e.target.value } : c,
                                            ),
                                        )
                                    }
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button2
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleEdit(comment.id, false)}
                                    >
                                        취소
                                    </Button2>
                                    <Button2
                                        size="sm"
                                        onClick={() => handleUpdateComment(comment.id, comment.content)}
                                        disabled={isInlineCommentSubmitting}
                                    >
                                        저장
                                    </Button2>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm whitespace-pre-line">{comment.content}</p>
                        )}

                        {/* 이 댓글에 대한 답글 입력창 */}
                        {comment.showReply && (
                            <div className="mt-2 space-y-2">
                                <Textarea2
                                    rows={2}
                                    placeholder="답글을 입력하세요"
                                    value={comment.replyContent ?? ""}
                                    onChange={(e) => changeReplyText(comment.id, e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button2
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setComments((prev) =>
                                                prev.map((c) =>
                                                    c.id === comment.id
                                                        ? { ...c, showReply: false, replyContent: "" }
                                                        : c,
                                                ),
                                            )
                                        }
                                    >
                                        취소
                                    </Button2>
                                    <Button2
                                        size="sm"
                                        onClick={() => {
                                            void handleSubmitReply(comment.id);
                                        }}
                                        disabled={isInlineCommentSubmitting}
                                    >
                                        답글 등록
                                    </Button2>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 대댓글들 */}
                    {replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2 pl-10">
                            {/* 대댓글 아이콘 표시 */}
                            <CornerDownRight className="w-4 h-4 text-muted-foreground mt-4" />

                            <div className="flex-1 border-b border-border pb-6 pt-4">
                                {/* 상단: 작성자 / 시간 / ⋮ 메뉴 */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground text-sm">
                      {reply.author}
                    </span>
                                        <span>{reply.createdAt}</span>
                                        {reply.updatedAt && (
                                            <span className="text-[11px] text-muted-foreground">
                        · 수정: {reply.updatedAt}
                      </span>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <button
                                            type="button"
                                            className="p-1 text-muted-foreground hover:text-foreground"
                                            onClick={() => toggleMenu(reply.id)}
                                        >
                                            ⋮
                                        </button>
                                        {reply.menuOpen && (
                                            <div className="absolute right-0 mt-1 w-24 rounded-md border bg-background shadow-sm text-sm overflow-hidden z-10 flex flex-col">
                                                <button
                                                    type="button"
                                                    className="w-full px-3 py-2 text-center whitespace-nowrap hover:bg-muted"
                                                    onClick={() => {
                                                        toggleReplyBox(reply.id);
                                                        toggleMenu(reply.id);
                                                    }}
                                                >
                                                    답글
                                                </button>
                                                {reply.isOwner && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="w-full px-3 py-2 text-center whitespace-nowrap hover:bg-muted"
                                                            onClick={() => handleToggleEdit(reply.id, true)}
                                                        >
                                                            수정
                                                        </button>
                                                       <button
                                                           type="button"
                                                           className="w-full px-3 py-2 text-center whitespace-nowrap text-destructive hover:bg-muted"
                                                            onClick={() => {
                                                                void handleDeleteComment(reply.id);
                                                            }}
                                                            disabled={isInlineCommentSubmitting}
                                                        >
                                                            삭제
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 내용 / 수정 모드 */}
                                {reply.isEditing ? (
                                    <div className="space-y-2 mt-1">
                                        <Textarea2
                                            rows={3}
                                            value={reply.content}
                                            onChange={(e) =>
                                                setComments((prev) =>
                                                    prev.map((c) =>
                                                        c.id === reply.id ? { ...c, content: e.target.value } : c,
                                                    ),
                                                )
                                            }
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <Button2
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleEdit(reply.id, false)}
                                            >
                                                취소
                                            </Button2>
                                            <Button2
                                                size="sm"
                                                onClick={() => handleUpdateComment(reply.id, reply.content)}
                                                disabled={isInlineCommentSubmitting}
                                            >
                                                저장
                                            </Button2>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm whitespace-pre-line">{reply.content}</p>
                                )}

                                {/* 이 대댓글 기준으로 답글 달기 → 같은 루트 댓글 밑에 계속 붙음 */}
                                {reply.showReply && (
                                    <div className="mt-2 space-y-2">
                                        <Textarea2
                                            rows={2}
                                            placeholder="답글을 입력하세요"
                                            value={reply.replyContent ?? ""}
                                            onChange={(e) => changeReplyText(reply.id, e.target.value)}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button2
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setComments((prev) =>
                                                        prev.map((c) =>
                                                            c.id === reply.id
                                                                ? { ...c, showReply: false, replyContent: "" }
                                                                : c,
                                                        ),
                                                    )
                                                }
                                            >
                                                취소
                                            </Button2>
                                            <Button2
                                                size="sm"
                                                onClick={() => {
                                                    void handleSubmitReply(reply.id);
                                                }}
                                                disabled={isInlineCommentSubmitting}
                                            >
                                                답글 등록
                                            </Button2>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            );
        });
    };

    const historyCommentButton = (comment: CommentItem, parent?: CommentItem) => {
        const isSelected = historyViewCommentId === comment.id;
        const isDeleted = comment.status === "deleted";
        const timestamp = comment.deletedAt
            ? `${comment.deletedAt} (삭제됨)`
            : comment.updatedAt
                ? comment.updatedAt
                : comment.createdAt;
        return (
            <button
                key={comment.id}
                type="button"
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    isSelected ? "border-primary bg-primary/10" : "hover:bg-muted"
                } ${isDeleted ? "border-destructive/40 bg-destructive/5" : ""}`}
                onClick={() => setHistoryViewCommentId(comment.id)}
            >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        {parent && <CornerDownRight className="h-4 w-4 text-primary" />}
                        <span className={isDeleted ? "text-destructive" : "text-foreground"}>
                            {comment.author || "익명"}
                        </span>
                        {isDeleted && <Badge2 variant="outline">삭제됨</Badge2>}
                    </span>
                    <span className={isDeleted ? "text-destructive" : undefined}>{timestamp}</span>
                </div>
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-foreground">
                    {comment.content}
                </p>
            </button>
        );
    };

    const renderHistoryCommentList = () => {
        const topComments = comments.filter(
            (comment) => (comment.parentId ?? null) === null && comment.status !== "deleted",
        );
        if (topComments.length === 0) {
            return (
                <p className="text-sm text-muted-foreground">
                    아직 등록된 댓글이 없습니다.
                </p>
            );
        }

        return topComments.map((comment) => (
            <div key={`history-top-${comment.id}`} className="space-y-2">
                {historyCommentButton(comment)}
                {comments
                    .filter((reply) => reply.parentId === comment.id && reply.status !== "deleted")
                    .map((reply) => (
                        <div key={`history-reply-${reply.id}`} className="pl-5">
                            {historyCommentButton(reply, comment)}
                        </div>
                    ))}
            </div>
        ));
    };

    // ───────────── 메인 렌더 ─────────────

    const historyViewComment = historyViewCommentId
        ? comments.find((comment) => comment.id === historyViewCommentId) ?? null
        : null;
    const historyTimeline = historyViewCommentId
        ? commentHistoryCache[historyViewCommentId] ?? []
        : [];
    const historyNeedsScroll = historyTimeline.length >= 5;
    const currentCommentsNeedScroll = true;
    const isHistoryTimelineLoading =
        historyViewCommentId != null && commentHistoryLoadingTargetId === historyViewCommentId;
    const historyTimelineError =
        historyViewCommentId != null && commentHistoryError
            ? commentHistoryError
            : null;
    const historyParentComment = historyViewComment?.parentId
        ? comments.find((comment) => comment.id === historyViewComment.parentId) ?? null
        : null;
    const getHistoryActionLabel = (action?: CommentHistoryEntry["action"]) => {
        if (action === "deleted") return "삭제됨";
        if (action === "created") return "등록됨";
        if (action === "restored") return "복구됨";
        if (action === "moved") return "이동됨";
        if (action === "hidden") return "숨김됨";
        return "수정됨";
    };

    const triggerFileDownload = (url: string, filename?: string) => {
        if (typeof window === "undefined") return;
        const newWindow = window.open(url, "_blank", "noopener,noreferrer");
        if (!newWindow && filename) {
            // 팝업 차단 등으로 새 창이 열리지 않으면 현재 창에서 강제로 이동
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            anchor.rel = "noopener";
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
        }
    };

    const mapAdminActionToCommentHistoryAction = (actionType: AdminActionType): CommentHistoryEntry["action"] => {
        if (actionType === "DELETE") return "deleted";
        if (actionType === "UPDATE") return "edited";
        if (actionType === "MOVE") return "moved";
        if (actionType === "HIDE") return "hidden";
        return "created";
    };

    const mapAdminActionToPostRevisionAction = (actionType?: AdminActionType): PostRevision["actionType"] => {
        if (!actionType) return undefined;
        if (actionType === "DELETE") return "deleted";
        if (actionType === "UPDATE") return "updated";
        if (actionType === "MOVE") return "moved";
        if (actionType === "HIDE") return "hidden";
        return "created";
    };

    const handleAttachmentDownload = async (attachment: AttachmentDraft) => {
        if (attachment.fileKey) {
            try {
                const fileInfo = await fileApi.getDownloadUrl(attachment.fileKey, attachment.name);
                const targetUrl = fileInfo?.presignedUrl;
                if (!targetUrl) {
                    throw new Error("Presigned URL이 없습니다.");
                }
                // S3 URL에 Content-Disposition 헤더가 포함되어 있어 바로 다운로드됨
                window.location.href = targetUrl;
                return;
            } catch (error) {
                console.error("첨부 파일 다운로드 URL 조회 실패", error);
                toast.error("파일을 다운로드할 수 없습니다. 잠시 후 다시 시도해 주세요.");
                return;
            }
        }

        if (attachment.dataUrl) {
            triggerFileDownload(attachment.dataUrl, attachment.name);
            return;
        }

        toast.error("다운로드할 파일 정보를 찾을 수 없습니다.");
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-6 space-y-2">
            {/* 게시글 카드 */}
            <PostCard
                headerLabel="현재 버전"
                post={currentPostCardData}
                metaItems={postMetaItems}
                extraMenu={postActionMenu}
            />

            {(postAttachments.length > 0 || postLinks.length > 0) && (
                <Card2>
                    <CardContent className="space-y-4 p-4 text-sm">
                        {postAttachments.length > 0 && (
                            <div>
                                <p className="font-medium">첨부 파일</p>
                                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                                    {postAttachments.map((file) => (
                                        <li key={file.id}>
                                            {file.fileKey || file.dataUrl ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleAttachmentDownload(file)}
                                                    className="text-primary underline"
                                                >
                                                    {file.name}
                                                </button>
                                            ) : (
                                                file.name
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {postLinks.length > 0 && (
                            <div>
                                <p className="font-medium">링크</p>
                                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                                    {postLinks.map((link, index) => (
                                        <li key={`${link.url}-${index}`}>
                                            {link.description ? `${link.description} - ` : ""}
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-primary underline"
                                            >
                                                {link.url}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card2>
            )}

            {/* 선택된 답글 카드 */}
            {focusedReply && (
                <div className="space-y-4">
                    <PostCard
                        headerLabel="선택된 답글"
                        post={{
                            title: focusedReply.title,
                            content: focusedReply.content,
                            type: "답글",
                        }}
                        metaItems={[
                            focusedReply.author && `작성자: ${focusedReply.author}`,
                            focusedReply.createdAt &&
                            `작성일: ${formatReplyDisplayDate(focusedReply.createdAt)}`,
                            focusedReply.updatedAt &&
                            `수정일: ${getReplyUpdatedLabel(focusedReply)}`,
                        ].filter(Boolean) as string[]}
                        extraMenu={
                            <div className="relative">
                                <button
                                    type="button"
                                    className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                                    onClick={() => setFocusedReplyMenuOpen((prev) => !prev)}
                                    aria-label="답글 메뉴 열기"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                {focusedReplyMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-32 rounded-md border bg-background shadow-lg text-sm overflow-hidden z-20">
                                        <button
                                            type="button"
                                            className="flex w-full items-center px-4 py-2 hover:bg-muted"
                                            onClick={() => {
                                                setFocusedReplyMenuOpen(false);
                                                startEditingReply(focusedReply);
                                            }}
                                        >
                                            <Pencil className="w-4 h-4" />
                                            <span className="pl-2">수정하기</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="flex w-full items-center px-4 py-2 text-destructive hover:bg-muted"
                                            onClick={() => {
                                                setFocusedReplyMenuOpen(false);
                                                deleteFocusedReply();
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="pl-2">삭제하기</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        }
                    />
                    {(focusedReply.attachments.length > 0 || focusedReply.links.length > 0) && (
                        <Card2>
                            <CardContent className="space-y-2 p-4 text-sm">
                                {focusedReply.attachments.length > 0 && (
                                    <div>
                                        <p className="font-medium">첨부 파일</p>
                                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                                            {focusedReply.attachments.map((file, index) => (
                                                <li key={`${file.name}-${index}`}>
                                                    {file.fileKey || file.dataUrl ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAttachmentDownload(file)}
                                                            className="text-primary underline"
                                                        >
                                                            {file.name}
                                                        </button>
                                                    ) : (
                                                        file.name
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {focusedReply.links.length > 0 && (
                                    <div>
                                        <p className="font-medium">링크</p>
                                        <ul className="list-disc pl-5 text-muted-foreground">
                                            {focusedReply.links.map((link, index) => (
                                                <li key={`${link.url}-${index}`}>
                                                    {link.description ? `${link.description} - ` : ""}
                                                    <a
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-primary underline"
                                                    >
                                                        {link.url}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card2>
                    )}
                </div>
            )}

            {/* 댓글 카드 */}
            <Card2>
                <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold">댓글</h2>
                        <Button2
                            variant="ghost"
                            size="sm"
                            className="text-sm text-muted-foreground"
                            onClick={() => {
                                setHistoryViewCommentId(null);
                                setIsCommentHistoryOpen(true);
                            }}
                        >
                            댓글 이력 보기
                        </Button2>
                    </div>

                    <div className="space-y-2">
                        {renderCommentList(paginatedTopLevel)}
                        {topLevelComments.length === 0 && (
                            <p className="text-sm text-muted-foreground">아직 댓글이 없습니다.</p>
                        )}
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                        <Textarea2
                            rows={3}
                            placeholder="댓글을 입력해주세요"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button2
                                className="ml-auto"
                                onClick={() => {
                                    void handleAddComment();
                                }}
                                disabled={isInlineCommentSubmitting}
                            >
                                댓글 등록
                            </Button2>
                        </div>
                    </div>
                </CardContent>
            </Card2>

            {/* 댓글 페이지네이션 */}
            {topLevelComments.length > 0 && (
                <div className="pt-4">
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                        <Button2
                            variant="outline"
                            size="sm"
                            onClick={() => setCommentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={commentPage === 1}
                            aria-label="이전 페이지"
                            className="h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 border-0 bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                                aria-hidden="true"
                            >
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </Button2>
                        {Array.from({ length: totalCommentPages }, (_, index) => index + 1).map(
                            (page) => (
                                <Button2
                                    key={page}
                                    variant={page === commentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCommentPage(page)}
                                    aria-current={page === commentPage ? "page" : undefined}
                                    className={`h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 ${
                                        page === commentPage ? "" : "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50"
                                    }`}
                                >
                                    {page}
                                </Button2>
                            ),
                        )}
                        <Button2
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setCommentPage((prev) => Math.min(prev + 1, totalCommentPages))
                            }
                            disabled={commentPage === totalCommentPages}
                            aria-label="다음 페이지"
                            className="h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 border-0 bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                                aria-hidden="true"
                            >
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </Button2>
                    </div>
                </div>
            )}

            {/* 댓글 이력 모달 */}
            <ModalShell open={isCommentHistoryOpen} onClose={closeCommentHistory} maxWidth="64rem" className="h-full">
                <Card2
                    variant="modal"
                    className="flex h-full max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden min-h-0"
                >
                    <CardHeader className="relative border-b text-center">
                        <h3 className="text-lg font-semibold">댓글 이력</h3>
                        <Button2
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="댓글 이력 닫기"
                            className="absolute right-4 top-3 rounded-md p-1 hover:bg-muted"
                            onClick={closeCommentHistory}
                        >
                            <X className="h-4 w-4" />
                        </Button2>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-6 py-6">
                        <div className="grid flex-1 min-h-0 gap-4 overflow-hidden md:grid-cols-2">
                            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <p className="font-medium text-foreground">현재 댓글</p>
                                        <span>총 {activeComments.length}건</span>
                                    </div>
                                    <div className="space-y-2">{renderHistoryCommentList()}</div>
                                </div>
                            </div>
                            <div className="flex h-full min-h-0 flex-col space-y-2 overflow-hidden">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <p className="font-medium">선택한 댓글의 히스토리</p>
                                    {historyViewComment && !isHistoryTimelineLoading && (
                                        <span>총 {historyTimeline.length}건</span>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                                    <div className="space-y-3">
                                        {!historyViewComment && (
                                            <p className="text-sm text-muted-foreground">왼쪽 목록에서 댓글을 선택해 주세요.</p>
                                        )}
                                        {historyViewComment && (
                                            <>
                                                {historyParentComment && (
                                                    <div className="rounded-md border bg-background p-3 space-y-1">
                                                        <span className="text-xs text-muted-foreground">원 댓글</span>
                                                        <p className="text-xs text-muted-foreground">
                                                            {historyParentComment.author || "익명"}
                                                        </p>
                                                        <p className="text-sm whitespace-pre-wrap text-foreground">
                                                            {historyParentComment.content || "내용이 없습니다."}
                                                        </p>
                                                    </div>
                                                )}
                                                {isHistoryTimelineLoading && (
                                                    <p className="text-sm text-muted-foreground">이력을 불러오는 중입니다...</p>
                                                )}
                                                {!isHistoryTimelineLoading && historyTimelineError && (
                                                    <p className="text-sm text-destructive">{historyTimelineError}</p>
                                                )}
                                                {!isHistoryTimelineLoading &&
                                                    !historyTimelineError &&
                                                    (historyTimeline.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground">수정/삭제 이력이 없습니다.</p>
                                                    ) : (
                                                        historyTimeline.map((entry) => {
                                                            const actionLabel = getHistoryActionLabel(entry.action);
                                                            const isDeletedAction = entry.action === "deleted";
                                                            return (
                                                                <div
                                                                    key={entry.id}
                                                                    className="rounded-md border bg-background p-2 text-sm space-y-1"
                                                                >
                                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                        <span className={isDeletedAction ? "text-destructive" : undefined}>
                                                                            {actionLabel}
                                                                        </span>
                                                                        <span className={isDeletedAction ? "text-destructive" : undefined}>
                                                                            {entry.timestamp}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <p className="whitespace-pre-wrap flex-1">
                                                                            {entry.content || "내용이 없습니다."}
                                                                        </p>
                                                                        {entry.author && (
                                                                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                                                                {entry.author}
                                                                            </span>
                                                                        )}
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
                    <CardFooter className="border-t px-6">
                        <Button2 className="w-full" onClick={closeCommentHistory}>
                            닫기
                        </Button2>
                    </CardFooter>
                </Card2>
            </ModalShell>

            {/* 하단 버튼들 */}
            {showBackButton && (
                <div className="mt-2 flex w-full justify-between">
                    <Button2
                        variant="outline"
                        onClick={startReplying}
                        className="ml-auto w-auto"
                    >
                        답글쓰기
                    </Button2>
                    <Button2
                        variant="outline"
                        onClick={navigateBackToList}
                        className="ml-auto w-auto"
                    >
                        목록으로
                    </Button2>
                </div>
            )}

            {/* 수정 이력 모달 (게시글) */}
            <ModalShell open={isHistoryOpen} onClose={closeHistory} maxWidth="64rem" className="h-full">
                <Card2
                    variant="modal"
                    className="flex h-full max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden min-h-0"
                >
                    <CardHeader className="relative border-b text-center">
                        <h3 className="text-lg font-semibold">수정 이력</h3>
                        <Button2
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="수정 이력 닫기"
                            className="absolute right-4 top-3 rounded-md p-1 hover:bg-muted"
                            onClick={closeHistory}
                        >
                            <X className="h-4 w-4" />
                        </Button2>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-6 py-6">
                        {postHistoryLoading && !selectedRevision && (
                            <p className="py-8 text-center text-sm text-muted-foreground">게시글 이력을 불러오는 중입니다...</p>
                        )}

                        {!postHistoryLoading && postHistoryError && !selectedRevision && (
                            <p className="py-8 text-center text-sm text-destructive">{postHistoryError}</p>
                        )}

                        {!postHistoryLoading && !postHistoryError && selectedRevision ? (
                            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
                                <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                                    <Button2 variant="ghost" size="sm" onClick={() => setSelectedRevision(null)}>
                                        이력 목록으로 돌아가기
                                    </Button2>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <PostCard headerLabel="현재 게시물" post={currentPostCardData} metaItems={postMetaItems} />
                                    <PostCard
                                        headerLabel={`수정 전 ${selectedRevision.version}`}
                                        post={{
                                            title: selectedRevision.title,
                                            content: selectedRevision.content,
                                            type: post.type,
                                        }}
                                        metaItems={[
                                            selectedRevision.author && `작성자: ${selectedRevision.author}`,
                                            (selectedRevision.updatedAt || selectedRevision.editedAt || selectedRevision.createdAt) &&
                                                `수정일: ${
                                                    selectedRevision.updatedAt ??
                                                    selectedRevision.editedAt ??
                                                    selectedRevision.createdAt
                                                }`,
                                        ].filter(Boolean) as string[]}
                                    />
                                </div>
                            </div>
                        ) : !postHistoryLoading && !postHistoryError && sortedRevisions.length ? (
                            <div className="flex-1 space-y-6 overflow-y-auto pr-1">
                                {sortedRevisions.map((revision) => {
                                    const revisionDate = getRevisionTimestamp(revision);
                                    const previewText = getRevisionPreview(revision.content);
                                    return (
                                        <button
                                            key={revision.id}
                                            type="button"
                                            className="flex w-full flex-col rounded-lg border bg-muted/30 px-6 py-6 text-left hover:bg-muted"
                                            onClick={() => setSelectedRevision(revision)}
                                        >
                                            <div className="mt-4 flex items-start justify-between gap-2 text-base font-semibold">
                                                <span className="text-foreground">{revision.title}</span>
                                                <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                                                    {revision.actionType && (
                                                        <span className="text-[11px] uppercase text-muted-foreground">
                                                            {revision.actionType}
                                                        </span>
                                                    )}
                                                    <span>{revisionDate || "날짜 미정"}</span>
                                                    {revision.author && (
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {revision.author}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {previewText && (
                                                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{previewText}</p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : !postHistoryLoading && !postHistoryError ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">아직 수정된 이력이 없습니다.</p>
                        ) : null}
                    </CardContent>
                    <CardFooter className="border-t px-6">
                        <Button2 type="button" className="w-full" onClick={closeHistory}>
                            닫기
                        </Button2>
                    </CardFooter>
                </Card2>
            </ModalShell>
        </div>
    );
}
