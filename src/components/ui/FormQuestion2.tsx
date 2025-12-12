import { useState, useEffect } from "react";
import { Card2, CardContent } from "./card2";
import { Label2 } from "./label2";
import { CheckboxQuestion2 } from "./CheckboxQuestion2";
import { Textarea2 } from "./textarea2";
import { Button2 } from "./button2";
import { CornerDownRight, MessagesSquare, MoreVertical } from "lucide-react";

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
}

interface ChecklistGroup {
    id: number;
    title: string;
    rules: string[];
    selectedIndexes: number[];
    evidences: Record<string, EvidenceItem>;
    comments: ChecklistComment[];
    commentDraft: string;
    isCommentOpen: boolean;
    status: "pending" | "approved" | "hold";
    locked: boolean;
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
    rules: Array(6).fill(""), // check list 1 ~ 6 기본
    selectedIndexes: [],
    evidences: {},
    comments: [],
    commentDraft: "",
    isCommentOpen: false,
    status: "pending",
    locked: false,
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
                if (!draft) return g;

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
                };

                return {
                    ...g,
                    comments: [...g.comments, newComment],
                    commentDraft: "",
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
        }));
    };

    const cancelCommentEdit = (groupIndex: number, commentId: number) => {
        updateCommentState(groupIndex, commentId, (comment) => ({
            ...comment,
            isEditing: false,
            editDraft: "",
        }));
    };

    const saveCommentEdit = (groupIndex: number, commentId: number) => {
        if (!canComment) return;
        updateCommentState(groupIndex, commentId, (comment) => {
            const newText = comment.editDraft.trim();
            if (!newText) return comment;

            return {
                ...comment,
                text: newText,
                updatedAt: new Date().toISOString(),
                isEditing: false,
                editDraft: "",
            };
        });
    };

    const deleteComment = (groupIndex: number, commentId: number) => {
        if (!canComment) return;
        setCommentsForGroup(groupIndex, (comments) =>
            comments.filter((comment) => comment.id !== commentId),
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
            };

            if (isSameTarget) {
                return {
                    ...baseState,
                    showReplyBox: false,
                    replyDraft: "",
                    replyingToReplyId: null,
                    replyingToAuthor: null,
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
        updateCommentState(groupIndex, commentId, (comment) => {
            const draft = (comment.replyDraft ?? "").trim();
            if (!draft) return comment;

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
            };

            return {
                ...comment,
                replies: [...comment.replies, newReply],
                showReplyBox: false,
                replyDraft: "",
                replyingToReplyId: null,
                replyingToAuthor: null,
            };
        });
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
        }));
    };

    const saveReplyEdit = (
        groupIndex: number,
        commentId: number,
        replyId: number,
    ) => {
        if (!canComment) return;
        updateReplyState(groupIndex, commentId, replyId, (reply) => {
            const newText = reply.editDraft.trim();
            if (!newText) return reply;

            return {
                ...reply,
                text: newText,
                updatedAt: new Date().toISOString(),
                isEditing: false,
                editDraft: "",
            };
        });
    };

    const deleteReply = (
        groupIndex: number,
        commentId: number,
        replyId: number,
    ) => {
        if (!canComment) return;
        updateCommentState(groupIndex, commentId, (comment) => ({
            ...comment,
            replies: comment.replies.filter((reply) => reply.id !== replyId),
        }));
    };

    return (
        <div>
            {/* 상단: 체크리스트 전체 + / - */}
            <div className="flex items-center justify-between mb-2">
                <Label2 className="flex items-center gap-1 text-sm font-medium">
                    체크리스트
                </Label2>

                {!disabled && (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleAddGroup}
                            className="h-6 w-6 rounded-md border text-xs flex items-center justify-center hover:bg-muted/80"
                        >
                            +
                        </button>
                        <button
                            type="button"
                            onClick={handleRemoveGroup}
                            className="h-6 w-6 rounded-md border text-xs flex items-center justify-center hover:bg-muted/80"
                        >
                            -
                        </button>
                    </div>
                )}
            </div>

            {/* 체크리스트 카드들 */}
            <div className="space-y-6">
                {groups.map((group, groupIndex) => (
                    <Card2
                        key={group.id}
                        className="border border-border/60 shadow-none bg-muted/40"
                    >
                        <CardContent className="pt-4">
                            <CheckboxQuestion2
                                titleValue={group.title}
                                onTitleChange={(value) => {
                                    if (disabled) return;
                                    setGroups((prev) =>
                                        prev.map((g, i) =>
                                            i === groupIndex ? { ...g, title: value } : g,
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
                                            if (i !== groupIndex || g.locked) return g;
                                            const selected = checked
                                                ? [...g.selectedIndexes, itemIndex]
                                                : g.selectedIndexes.filter((v) => v !== itemIndex);
                                            return { ...g, selectedIndexes: selected };
                                        }),
                                    );
                                }}
                                evidences={group.evidences}
                                onEvidenceUpload={(evidenceId, files) => {
                                    if (disabled) return;
                                    setGroups((prev) =>
                                        prev.map((g, i) => {
                                            if (i !== groupIndex || g.locked) return g;
                                            return {
                                                ...g,
                                                evidences: {
                                                    ...g.evidences,
                                                    [evidenceId]: {
                                                        files,
                                                        links: g.evidences[evidenceId]?.links ?? [],
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
                                            if (i !== groupIndex || g.locked) return g;
                                            return {
                                                ...g,
                                                evidences: {
                                                    ...g.evidences,
                                                    [evidenceId]: {
                                                        files: g.evidences[evidenceId]?.files ?? [],
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
                                            if (i !== groupIndex || g.locked) return g;
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
                                                ? { ...g, rules: [...g.rules, ""] } // 새 항목 하나 추가
                                                : g,
                                        ),
                                    );
                                }}
                                onRemoveOption={(removeIndex) => {
                                    if (disabled) return;
                                    setGroups((prev) =>
                                        prev.map((g, i) => {
                                            if (i !== groupIndex || g.locked) return g;
                                            if (g.rules.length <= 1) return g; // 최소 한 개는 남기기

                                            // 1) rules에서 해당 인덱스 제거
                                            const newRules = g.rules.filter(
                                                (_, idx) => idx !== removeIndex,
                                            );

                                            // 2) 체크된 인덱스 재정렬
                                            const newSelected = g.selectedIndexes
                                                .filter((idx) => idx !== removeIndex)
                                                .map((idx) => (idx > removeIndex ? idx - 1 : idx));

                                            // 3) evidences 키 재정렬
                                            const prefix = `preCheck-${g.id}-`;
                                            const newEvidences: Record<string, EvidenceItem> = {};

                                            for (const [key, evidenceItem] of Object.entries(
                                                g.evidences,
                                            )) {
                                                // prefix랑 상관 없는 건 그대로 복사
                                                if (!key.startsWith(prefix)) {
                                                    newEvidences[key] = evidenceItem;
                                                    continue;
                                                }

                                                const indexStr = key.slice(prefix.length);
                                                const oldIndex = Number(indexStr);

                                                // 숫자로 파싱이 안 되면 그냥 놔둠
                                                if (Number.isNaN(oldIndex)) {
                                                    newEvidences[key] = evidenceItem;
                                                    continue;
                                                }

                                                // 지워진 인덱스면 건너뛰기 (=> 증거도 같이 삭제)
                                                if (oldIndex === removeIndex) {
                                                    continue;
                                                }

                                                // 그 뒤에 있던 인덱스는 -1 해줌
                                                const newIndex =
                                                    oldIndex > removeIndex ? oldIndex - 1 : oldIndex;
                                                const newKey = `${prefix}${newIndex}`;
                                                newEvidences[newKey] = evidenceItem;
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

                            {/* 하단: 코멘트 / 버튼 영역 */}
                            <div className="mt-2 mb-2 flex items-center justify-between w-full gap-4">
                                {/* 말풍선 + 이력 버튼 */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={!canComment}
                                        onClick={() => toggleComment(groupIndex)}
                                        className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted transition-colors disabled:cursor-not-allowed"
                                    >
                                        <MessagesSquare className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!canComment}
                                        onClick={() => toggleComment(groupIndex)}
                                        className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline disabled:cursor-not-allowed"
                                    >
                                        코멘트 이력 보기
                                    </button>
                                </div>

                                {/* 동의 / 보류 버튼 */}
                                <div className="flex items-center gap-1 ml-auto">
                                    {/* 동의 */}
                                    <button
                                        type="button"
                                        disabled={group.locked || !canDecide}
                                        className={`h-9 px-4 text-sm rounded-md border ${
                                            group.status === "approved"
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background border-border hover:bg-muted"
                                        }`}
                                        onClick={() => {
                                            if (group.locked || !canDecide) return;
                                            if (
                                                !confirm(
                                                    "‘동의’로 확정하시겠습니까? \n 동의를 선택하면 이후에는 내용을 수정할 수 없습니다.",
                                                )
                                            )
                                                return;
                                            setGroups((prev) =>
                                                prev.map((g, i) =>
                                                    i === groupIndex
                                                        ? { ...g, status: "approved", locked: true }
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
                                        className={`h-9 px-4 text-sm rounded-md border ${
                                            group.status === "hold"
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background border-border hover:bg-muted"
                                        }`}
                                        onClick={() => {
                                            if (group.locked || !canDecide) return;
                                            if (
                                                !confirm(
                                                    "‘보류’로 확정하시겠습니까? \n 보류를 선택하면 이후에는 내용을 수정할 수 없습니다.",
                                                )
                                            )
                                                return;
                                            setGroups((prev) =>
                                                prev.map((g, i) =>
                                                    i === groupIndex
                                                        ? { ...g, status: "hold", locked: true }
                                                        : g,
                                                ),
                                            );
                                        }}
                                    >
                                        보류
                                    </button>
                                </div>
                            </div>

                            {group.isCommentOpen && (
                                <div className="mt-3 pb-6 space-y-4">
                                    <div className="space-y-2">
                                        {group.comments.map((comment) => {
                                                const isEditing = comment.isEditing;
                                                const isMenuOpen = comment.menuOpen;
                                                const isOwner = comment.author === commentAuthor;

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
                                <span className="opacity-70 text-[11px] flex flex-wrap gap-1 items-center">
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
                                                                {canComment && !group.locked && (
                                                                    <button
                                                                        type="button"
                                                                        className="p-1 rounded-md hover:bg-muted transition"
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
                                                                                        className="block w-full px-3 py-1 text-xs text-left hover:bg-muted"
                                                                    onClick={() =>
                                                                        openReplyBox(groupIndex, comment.id, {
                                                                            author: comment.author,
                                                                        })
                                                                    }
                                                                >
                                                                    답글
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="block w-full px-3 py-1 text-sm text-left hover:bg-muted"
                                                                    onClick={() =>
                                                                        startCommentEdit(groupIndex, comment.id)
                                                                    }
                                                                >
                                                                    수정
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="block w-full px-3 py-1 text-sm text-left text-destructive hover:bg-muted"
                                                                    onClick={() =>
                                                                        deleteComment(groupIndex, comment.id)
                                                                    }
                                                                >
                                                                    삭제
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* 부모 댓글 본문 / 수정모드 */}
                                                        {isEditing ? (
                                                            <div className="mt-2 space-y-2">
                                                                <Textarea2
                                                                    value={comment.editDraft}
                                                                    onChange={(e) =>
                                                                        updateCommentState(
                                                                            groupIndex,
                                                                            comment.id,
                                                                            (current) => ({
                                                                                ...current,
                                                                                editDraft: e.target.value,
                                                                            }),
                                                                        )
                                                                    }
                                                                    rows={3}
                                                                        className="text-xs"
                                                                />
                                                                <div className="flex justify-end gap-2">
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
                                                                            saveCommentEdit(groupIndex, comment.id)
                                                                        }
                                                                        disabled={!comment.editDraft.trim()}
                                                                    >
                                                                        저장
                                                                    </Button2>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="mt-1 text-xs leading-5 whitespace-pre-line break-words">
                                                                {comment.text}
                                                            </p>
                                                        )}

                                                        {/* 대댓글 목록 */}
                                                        {comment.replies && comment.replies.length > 0 && (
                                                            <div className="mt-3 space-y-2 border-l pl-4">
                                                                {comment.replies.map((reply) => {
                                                                    const isReplyEditing = reply.isEditing;
                                                                    const isReplyMenuOpen = reply.menuOpen;

                                                                    return (
                                                                        <div
                                                                            key={reply.id}
                                                                            className="relative rounded-md bg-muted/40 px-2 py-2 text-sm"
                                                                        >
                                                                            {/* 대댓글 헤더 (작성자 / 날짜) */}
                                                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1 font-medium text-xs text-muted-foreground">
                                          <CornerDownRight className="h-4 w-4" />
                                            {reply.author}
                                        </span>
                                                                                <div className="flex items-center gap-2">
                                          <span className="opacity-70 text-[11px] flex flex-wrap gap-1 items-center">
                                            <span>
                                              {new Date(
                                                  reply.createdAt,
                                              ).toLocaleString()}
                                            </span>
                                              {reply.updatedAt && (
                                                  <span className="flex items-center gap-1 text-[10px]">
                                                <span>·</span>
                                                <span>
                                                  수정:{" "}
                                                    {new Date(
                                                        reply.updatedAt,
                                                    ).toLocaleString()}
                                                </span>
                                              </span>
                                              )}
                                          </span>
                                                                                    {canComment && !group.locked && (
                                                                                        <button
                                                                                            type="button"
                                                                                            className="p-1 rounded-md hover:bg-muted transition"
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
                                                                                        className="block w-full px-3 py-1 text-xs text-left hover:bg-muted"
                                                                                        onClick={() =>
                                                                                            openReplyBox(groupIndex, comment.id, {
                                                                                                replyId: reply.id,
                                                                                                author: reply.author,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        답글
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="block w-full px-3 py-1 text-xs text-left hover:bg-muted"
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
                                                                                        className="block w-full px-3 py-1 text-xs text-left text-destructive hover:bg-muted"
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

                                                                            {/* 대댓글 본문 / 수정모드 */}
                                                                            {isReplyEditing ? (
                                                                                <div className="mt-2 space-y-2">
                                                                                    <Textarea2
                                                                                        value={reply.editDraft}
                                                                                        onChange={(e) =>
                                                                                            updateReplyState(
                                                                                                groupIndex,
                                                                                                comment.id,
                                                                                                reply.id,
                                                                                                (current) => ({
                                                                                                    ...current,
                                                                                                    editDraft: e.target.value,
                                                                                                }),
                                                                                            )
                                                                                        }
                                                                                        rows={3}
                                                                        className="text-xs"
                                                                                    />
                                                                                    <div className="flex justify-end gap-2">
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
                                                                            ) : (
                                                        <div className="mt-1 space-y-1 text-[10px]">
                                                            <p className="text-xs leading-5 whitespace-pre-line break-words">
                                                                {reply.text}
                                                            </p>
                                                        </div>
                                                    )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* 대댓글 작성 폼 */}
                                                        {comment.showReplyBox && canComment && !group.locked && (
                                                            <div className="mt-3 space-y-2">
                                                                <Textarea2
                                                                    value={comment.replyDraft}
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
                                                                <div className="flex justify-end gap-2">
                                                                    <Button2
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            closeReplyBox(groupIndex, comment.id)
                                                                        }
                                                                    >
                                                                        취소
                                                                    </Button2>
                                                                    <Button2
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            submitReply(groupIndex, comment.id)
                                                                        }
                                                                        disabled={!comment.replyDraft.trim()}
                                                                    >
                                                                        등록
                                                                    </Button2>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>

                                    {/* 새 코멘트 작성 */}
                                    {canComment && !group.locked && (
                                        <div className="space-y-2">
                                            <Textarea2
                                                value={group.commentDraft}
                                                disabled={!canComment || group.locked}
                                                onChange={(e) =>
                                                    updateCommentDraft(groupIndex, e.target.value)
                                                }
                                                placeholder="코멘트를 입력 후 등록 버튼을 눌러주세요"
                                                rows={3}
                                                className="text-sm"
                                            />
                                            <div className="flex justify-end">
                                                <Button2
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => addComment(groupIndex)}
                                                    disabled={!group.commentDraft.trim()}
                                                >
                                                    등록
                                                </Button2>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card2>
                ))}
            </div>
        </div>
    );
}
