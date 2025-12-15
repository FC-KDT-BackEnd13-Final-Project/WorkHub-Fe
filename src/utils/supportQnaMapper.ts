import type { CsQnaApiItem, CsQnaResponse } from "../types/csPost";
import type { PostReplyItem } from "./postRepliesStorage";

export const convertQnaToReply = (qna: CsQnaApiItem): PostReplyItem[] => {
  const mainReply: PostReplyItem = {
    id: String(qna.csQnaId),
    title: "",
    content: qna.qnaContent || "",
    createdAt: qna.createdAt,
    updatedAt: qna.updatedAt,
    author: `사용자${qna.userId}`,
    attachments: [],
    links: [],
    parentId: qna.parentQnaId ? String(qna.parentQnaId) : null,
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
  author: `사용자${qna.userId}`,
  attachments: [],
  links: [],
  parentId: qna.parentQnaId ? String(qna.parentQnaId) : null,
});
