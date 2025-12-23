import type { CsQnaApiItem, CsQnaResponse } from "../types/csPost";
import type { PostReplyItem } from "./postRepliesStorage";

const resolveQnaAuthorName = (qna: CsQnaApiItem | CsQnaResponse): string => {
  const candidate =
    (qna as any).authorName ||
    (qna as any).writerName ||
    qna.userName ||
    (qna as any).loginId ||
    (qna as any).userNickname;

  if (candidate && typeof candidate === "string") {
    const trimmed = candidate.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  const userId = (qna as any).userId;
  return userId != null ? `사용자${userId}` : "익명";
};

export const convertQnaToReply = (qna: CsQnaApiItem): PostReplyItem[] => {
  const authorName = resolveQnaAuthorName(qna);

  const mainReply: PostReplyItem = {
    id: String(qna.csQnaId),
    title: "",
    content: qna.qnaContent || "",
    createdAt: qna.createdAt,
    updatedAt: qna.updatedAt,
    author: authorName,
    attachments: [],
    links: [],
    parentId: qna.parentQnaId ? String(qna.parentQnaId) : null,
    isComment: true,
  };

  const childReplies: PostReplyItem[] = qna.children
    ? qna.children.flatMap(convertQnaToReply)
    : [];

  return [mainReply, ...childReplies];
};

export const convertQnaResponseToReply = (qna: CsQnaResponse): PostReplyItem => ({
  id: String(qna.csQnaId),
  title: "",
  content: qna.qnaContent || "",
  createdAt: qna.createdAt,
  updatedAt: qna.updatedAt,
  author: resolveQnaAuthorName(qna),
  attachments: [],
  links: [],
  parentId: qna.parentQnaId ? String(qna.parentQnaId) : null,
  isComment: true,
});
