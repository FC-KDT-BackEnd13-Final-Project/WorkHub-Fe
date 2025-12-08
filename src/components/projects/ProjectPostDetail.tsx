import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card2, CardContent } from "../ui/card2";
import { Badge2 } from "../ui/badge2";
import { Button2 } from "../ui/button2";
import { Textarea2 } from "../ui/textarea2";
import { MoreVertical, Pencil, Trash2, CornerDownRight, History, X } from "lucide-react";
import { PostCard } from "./PostCard";
import { postRevisionsByPostId, type PostRevision } from "../../data/postRevisions";

const COMMENTS_PER_PAGE = 5;

// 단일 CS 문의/포스트를 상세 뷰 및 편집 모드로 보여줌
interface PostPayload {
    id: string;
    customerName: string;
    type: "notice" | "question" | "general";
    title: string;
    content: string;
    createdDate: string;
    updatedDate: string;
    hashtag: string;
    isOwner?: boolean;
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
}

interface ProjectPostDetailProps {
    initialPost?: PostPayload;
    backPath?: string;
    showBackButton?: boolean;
    startInEditMode?: boolean;
}

export function ProjectPostDetail({
    initialPost,
    backPath,
    showBackButton = true,
    startInEditMode = false,
}: ProjectPostDetailProps = {}) {
    const navigate = useNavigate();
    const { projectId, nodeId, postId } = useParams<{ projectId?: string; nodeId?: string; postId?: string }>();
    const location = useLocation();
    const statePost = (location.state as { post?: PostPayload })?.post;
    const post: PostPayload = statePost || initialPost || {
        id: postId ?? "",
        customerName: "",
        type: "general",
        title: "",
        content: "",
        createdDate: "",
        updatedDate: "",
        hashtag: "",
        isOwner: true,
    };
    const [postContent, setPostContent] = useState(post.content);
    const [isPostEditing, setIsPostEditing] = useState(startInEditMode);
    const isPostOwner = post.isOwner ?? true; // 임시: 작성자로 가정
    const [postMenuOpen, setPostMenuOpen] = useState(false); //  게시글 메뉴 열림 여부
    const [commentPage, setCommentPage] = useState(1);
    // 게시글 수정 이력 모달 및 선택된 버전 상태
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedRevision, setSelectedRevision] = useState<PostRevision | null>(null);
    const revisions = postRevisionsByPostId[post.id] ?? postRevisionsByPostId.default;

    useEffect(() => {
        setPostContent(post.content);
    }, [post.content]);

    const [comments, setComments] = useState<CommentItem[]>([
        {
            id: "c1",
            author: "운영팀",
            content: "요청 사항 확인했습니다. 추가 자료 부탁드립니다.",
            createdAt: "2025-11-22 10:32",
            isOwner: false,
            parentId: null,
        },
    ]);
    const [newComment, setNewComment] = useState("");
    const topLevelComments = comments.filter((c) => (c.parentId ?? null) === null);
    const totalCommentPages = Math.max(1, Math.ceil(topLevelComments.length / COMMENTS_PER_PAGE));
    const paginatedTopLevel = topLevelComments.slice(
        (commentPage - 1) * COMMENTS_PER_PAGE,
        commentPage * COMMENTS_PER_PAGE,
    );

    useEffect(() => {
        setCommentPage((prev) => Math.min(prev, totalCommentPages));
    }, [totalCommentPages]);

    const listPath =
        backPath ??
        (projectId && nodeId
            ? `/projects/${projectId}/nodes/${nodeId}/posts`
            : undefined);

    const postMetaItems = [
        post.customerName ? `작성자: ${post.customerName}` : undefined,
        post.updatedDate
            ? `수정일: ${post.updatedDate}`
            : post.createdDate
                ? `수정일: ${post.createdDate}`
                : undefined,
    ].filter(Boolean) as string[];

    const currentPostCardData = {
        title: post.title,
        content: postContent || post.content,
        type: post.type,
    };

    const navigateBackToList = () => {
        if (listPath) {
            navigate(listPath, { replace: true });
        } else {
            navigate(-1);
        }
    };

    const handleHistoryOpen = () => {
        // 메뉴 상태를 초기화하고 누구나 이력 모달을 볼 수 있게 연다
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
        const aTime = getRevisionTimestamp(a) ? new Date(getRevisionTimestamp(a)).getTime() : 0;
        const bTime = getRevisionTimestamp(b) ? new Date(getRevisionTimestamp(b)).getTime() : 0;
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
                <div className="absolute right-0 mt-2 w-44 rounded-md border bg-background shadow-lg text-sm overflow-hidden z-20">
                    {isPostOwner && (
                        <button
                            type="button"
                            className="flex w-full items-center px-4 py-2 hover:bg-muted"
                            onClick={() => {
                                setIsPostEditing(true);
                                setPostMenuOpen(false);
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
                                navigate(-1);
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="whitespace-nowrap pl-2">삭제하기</span>
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

    // ───────────── 댓글 CRUD 핸들러 ─────────────

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const nextTopLevelCount = topLevelComments.length + 1;
        const nextPage = Math.max(1, Math.ceil(nextTopLevelCount / COMMENTS_PER_PAGE));

        setComments((prev) => [
            ...prev,
            {
                id: `c-${Date.now()}`,
                author: "나",
                content: newComment.trim(),
                createdAt: new Date().toLocaleString("ko-KR"),
                isOwner: true,
                parentId: null,
            },
        ]);
        setNewComment("");
        setCommentPage(nextPage);
    };

    const handleDeleteComment = (id: string) => {
        setComments((prev) => prev.filter((comment) => comment.id !== id));
    };

    const handleToggleEdit = (id: string, editing: boolean) => {
        setComments((prev) =>
            prev.map((comment) =>
                comment.id === id ? { ...comment, isEditing: editing, menuOpen: false } : comment,
            ),
        );
    };

    const handleUpdateComment = (id: string, content: string) => {
        setComments((prev) =>
            prev.map((comment) =>
                comment.id === id
                    ? {
                        ...comment,
                        content,
                        updatedAt: new Date().toLocaleString("ko-KR"), // 수정 시간 저장
                        isEditing: false,
                        menuOpen: false,
                    }
                    : comment,
            ),
        );
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
    const handleSubmitReply = (targetId: string) => {
        setComments((prev) => {
            const target = prev.find((c) => c.id === targetId);
            if (!target) return prev;

            const text = target.replyContent?.trim();
            if (!text) return prev;

            // 최상위 댓글이면 자기 id, 대댓글이면 parentId로 묶기
            const rootId =
                (target.parentId ?? null) === null ? target.id : (target.parentId as string);

            const updated = prev.map((c) =>
                c.id === targetId ? { ...c, showReply: false, replyContent: "" } : c,
            );

            return [
                ...updated,
                {
                    id: `${rootId}-reply-${Date.now()}`,
                    author: "나",
                    content: text,
                    createdAt: new Date().toLocaleString("ko-KR"),
                    isOwner: true,
                    parentId: rootId,
                } as CommentItem,
            ];
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
            const replies = comments.filter((c) => c.parentId === comment.id);

            return (
                <div key={comment.id} className="space-y-2">
                    {/* 최상위 댓글 */}
                    <div className="rounded-md bg-background px-6 py-4 border border-border">
                        {/* 상단: 작성자 / 시간 / ⋮ 메뉴 */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground text-sm">
                                    {comment.author}
                                </span>
                                <span>{comment.createdAt}</span>
                                {comment.updatedAt && (
                                    <span className="text-[11px] text-muted-foreground">
                                        · 수정: {comment.updatedAt}
                                    </span>
                                )}
                            </div>

                            {/* 누구나 ⋮ 메뉴는 보이고, 답글은 항상 / 수정·삭제는 작성자만 */}
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
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                >
                                                    삭제
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            {post.isOwner && !isPostEditing && (
                                <div className="flex items-center gap-2 text-sm text-primary">
                                    <button
                                        type="button"
                                        className="hover:underline"
                                        onClick={() => setIsPostEditing(true)}
                                    >
                                        수정
                                    </button>
                                    <button
                                        type="button"
                                        className="hover:underline"
                                        onClick={navigateBackToList}
                                    >
                                        삭제
                                    </button>
                                </div>
                            )}
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
                                    <Button2 size="sm" onClick={() => handleSubmitReply(comment.id)}>
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
                                                            onClick={() => handleDeleteComment(reply.id)}
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
                                                onClick={() => handleSubmitReply(reply.id)}
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

    // ───────────── 메인 렌더 ─────────────

    return (
        <div className="w-full max-w-5xl mx-auto p-6 space-y-2">
            {/* 게시글 카드 */}
            {isPostOwner && isPostEditing ? (
                <Card2>
                    <CardContent className="space-y-4 p-6">
                        <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                현재 버전 (편집 중)
                            </p>
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Badge2 variant="outline">{post.type}</Badge2>
                                </div>
                            </div>
                            <h2 className="text-2xl font-semibold">{post.title}</h2>
                            <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                                {postMetaItems.map((meta, index) => (
                                    <span key={`${meta}-${index}`} className="whitespace-nowrap">
                                        {meta}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Textarea2
                                rows={6}
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                                <Button2
                                    variant="outline"
                                    onClick={() => {
                                        setPostContent(post.content);
                                        setIsPostEditing(false);
                                    }}
                                >
                                    취소
                                </Button2>
                                <Button2
                                    onClick={() => {
                                        const now = new Date().toLocaleString("ko-KR");
                                        post.content = postContent;
                                        post.updatedDate = now;

                                        setIsPostEditing(false);
                                    }}
                                >
                                    저장
                                </Button2>
                            </div>
                        </div>
                    </CardContent>
                </Card2>
            ) : (
                <PostCard
                    headerLabel="현재 버전"
                    post={currentPostCardData}
                    metaItems={postMetaItems}
                    extraMenu={postActionMenu}
                />
            )}

            {/* 댓글 카드 */}
            <Card2>
                <CardContent className="space-y-4 p-6">
                    <h2 className="text-lg font-semibold mb-2">댓글</h2>

                    <div className="space-y-2">
                        {renderCommentList(paginatedTopLevel)}
                        {comments.length === 0 && (
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
                            <Button2 className="ml-auto" onClick={handleAddComment}>
                                댓글 등록
                            </Button2>
                    </div>
                </div>
            </CardContent>
        </Card2>

        {topLevelComments.length > 0 && (
            <div className="flex flex-col items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                    <Button2
                        variant="outline"
                        size="sm"
                        onClick={() => setCommentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={commentPage === 1}
                        aria-label="이전 댓글 페이지"
                    >
                        {"<"}
                    </Button2>
                    {Array.from({ length: totalCommentPages }, (_, index) => index + 1).map((page) => (
                        <Button2
                            key={page}
                            variant={page === commentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCommentPage(page)}
                        >
                            {page}
                        </Button2>
                    ))}
                    <Button2
                        variant="outline"
                        size="sm"
                        onClick={() => setCommentPage((prev) => Math.min(prev + 1, totalCommentPages))}
                        disabled={commentPage === totalCommentPages}
                        aria-label="다음 댓글 페이지"
                    >
                        {">"}
                    </Button2>
                </div>
            </div>
        )}
            {showBackButton && (
                <div className="mt-2 flex w-full justify-between">
                    <Button2
                        variant="outline"
                        onClick={() => navigateBackToList()}
                        className="ml-auto w-auto"
                    >
                        답글쓰기
                    </Button2>
                    <Button2
                        variant="outline"
                        onClick={() => navigateBackToList()}
                        className="ml-auto w-auto"
                    >
                        목록으로
                    </Button2>
                </div>
            )}

            {isHistoryOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
                    <div className="absolute inset-0" aria-hidden onClick={closeHistory} />
                    <div className="relative z-10 flex h-full items-center justify-center p-4">
                        <div className="login-theme bg-card text-card-foreground flex h-full max-h-[90vh] w-full max-w-4xl flex-col gap-6 overflow-hidden rounded-xl border border-border shadow-2xl">
                            <div className="flex flex-col gap-2 border-b px-6 pt-6 pb-6 text-center sm:flex-row sm:items-center sm:text-left">
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold">수정 이력</h2>
                                    <p className="text-sm text-muted-foreground">
                                        게시글의 과거 버전을 확인하거나 현재 글과 비교할 수 있습니다.
                                    </p>
                                </div>
                                <span className="text-sm font-semibold text-sky-600">
                                    총 {sortedRevisions.length}건
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col gap-6 px-6 pb-6">
                                {selectedRevision ? (
                                    <>
                                        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                                            <Button2 variant="ghost" size="sm" onClick={() => setSelectedRevision(null)}>
                                                이력 목록으로 돌아가기
                                            </Button2>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <PostCard
                                                headerLabel="현재 게시물"
                                                post={currentPostCardData}
                                                metaItems={postMetaItems}
                                            />
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
                                    </>
                        ) : sortedRevisions.length ? (
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
                                            <div className="flex items-center justify-between gap-2 text-base font-semibold mt-4">
                                                <span className="text-foreground">
                                                    {revision.title}
                                                </span>
                                                <span className="text-muted-foreground text-sm">
                                                    {revisionDate || "날짜 미정"}
                                                </span>
                                            </div>
                                            {previewText && (
                                                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                                    {previewText}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        아직 수정된 이력이 없습니다.
                                    </p>
                                )}
                            </div>
                            <div className="border-t px-6 py-4 mt-6">
                                <Button2 type="button" className="w-full" onClick={closeHistory}>
                                    닫기
                                </Button2>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
