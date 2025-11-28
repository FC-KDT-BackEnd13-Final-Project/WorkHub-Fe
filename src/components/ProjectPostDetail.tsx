import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Card2, CardContent } from "./ui/card2";
import { Badge2 } from "./ui/badge2";
import { Button2 } from "./ui/button2";
import { Textarea2 } from "./ui/textarea2";

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
}

export function ProjectPostDetail() {
    const navigate = useNavigate();
    const { postId } = useParams();
    const location = useLocation();
    const post = (location.state as { post?: PostPayload })?.post || {
        isOwner: true,
    };
    const [postContent, setPostContent] = useState(post.content);
    const [isPostEditing, setIsPostEditing] = useState(false);

    const [comments, setComments] = useState<CommentItem[]>([
        {
            id: "c1",
            author: "운영팀",
            content: "요청 사항 확인했습니다. 추가 자료 부탁드립니다.",
            createdAt: "2025-11-22 10:32",
            isOwner: false,
        },
    ]);
    const [newComment, setNewComment] = useState("");

    if (!post) {
        return (
            <div className="w-full max-w-5xl mx-auto p-6 space-y-4">
                <Card2>
                    <CardContent className="py-12 text-center space-y-4">
                        <p className="text-lg font-medium">게시글 정보를 불러올 수 없습니다.</p>
                        <Button2 onClick={() => navigate(-1)}>목록으로 돌아가기</Button2>
                    </CardContent>
                </Card2>
            </div>
        );
    }

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        setComments((prev) => [
            ...prev,
            {
                id: `c-${Date.now()}`,
                author: "나",
                content: newComment.trim(),
                createdAt: new Date().toLocaleString("ko-KR"),
                isOwner: true,
            },
        ]);
        setNewComment("");
    };

    const handleDeleteComment = (id: string) => {
        setComments((prev) => prev.filter((comment) => comment.id !== id));
    };

    const handleToggleEdit = (id: string, editing: boolean) => {
        setComments((prev) =>
            prev.map((comment) =>
                comment.id === id ? { ...comment, isEditing: editing } : comment,
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
                        updatedAt: new Date().toLocaleString("ko-KR"),
                        isEditing: false,
                    }
                    : comment,
            ),
        );
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
            <Card2>
                <CardContent className="space-y-4 p-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Badge2 variant="outline">{post.type}</Badge2>
                                <Badge2>{post.hashtag}</Badge2>
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
                                        onClick={() => navigate(-1)}
                                    >
                                        삭제
                                    </button>
                                </div>
                            )}
                        </div>
                        <h1 className="text-2xl font-semibold">{post.title}</h1>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                            <span>작성자: {post.customerName}</span>
                            <span>작성일: {post.createdDate}</span>
                            <span>수정일: {post.updatedDate}</span>
                        </div>
                    </div>

                    {isPostEditing ? (
                        <div className="space-y-3">
                            <Textarea2
                                rows={6}
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                                <Button2 variant="outline" onClick={() => {
                                    setPostContent(post.content);
                                    setIsPostEditing(false);
                                }}>취소</Button2>
                                <Button2 onClick={() => setIsPostEditing(false)}>저장</Button2>
                            </div>
                        </div>
                    ) : (
                        <div className="prose max-w-none text-sm leading-relaxed whitespace-pre-line">
                            {postContent}
                        </div>
                    )}
                </CardContent>
            </Card2>

            <Card2>
                <CardContent className="space-y-4 p-6">
                    <div>
                        <h2 className="text-lg font-semibold">댓글</h2>
                    </div>

                    <div className="space-y-2">
                        {comments.map((comment) => (
                            <div key={comment.id} className="rounded-md border border-border bg-background px-4 py-2 space-y-2">
                                <div className="flex items-center justify-between text-sm text-muted-foreground gap-3">
                                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                        <span className="font-medium text-foreground text-sm">{comment.author}</span>
                                        <span>{comment.createdAt}</span>
                                        {comment.updatedAt && <span>수정: {comment.updatedAt}</span>}
                                    </div>
                                    {comment.isOwner && (
                                        <div className="flex items-center gap-2 text-xs text-primary">
                                            {!comment.isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleEdit(comment.id, true)}
                                                    className="hover:underline"
                                                >
                                                    수정
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="hover:underline"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {comment.isEditing ? (
                                    <div className="space-y-2">
                                        <Textarea2
                                            rows={3}
                                            value={comment.content}
                                            onChange={(e) =>
                                                setComments((prev) =>
                                                    prev.map((c) =>
                                                        c.id === comment.id
                                                            ? { ...c, content: e.target.value }
                                                            : c,
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
                                    <p className="mt-2 text-sm whitespace-pre-line">{comment.content}</p>
                                )}
                            </div>
                        ))}
                        {comments.length === 0 && (
                            <p className="text-sm text-muted-foreground">아직 댓글이 없습니다.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Textarea2
                            rows={3}
                            placeholder="댓글을 입력해주세요"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button2 className="ml-auto" onClick={handleAddComment}>댓글 등록</Button2>
                        </div>
                    </div>
                </CardContent>
            </Card2>
            <div className="mt-4 flex w-full">
                <Button2
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="ml-auto w-auto"
                >
                    목록으로
                </Button2>
            </div>
        </div>
    );
}
