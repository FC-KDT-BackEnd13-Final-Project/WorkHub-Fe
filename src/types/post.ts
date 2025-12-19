export type PostType = "NOTICE" | "QUESTION" | "GENERAL";

export interface PostThreadResponse {
  postId: number;
  parentPostId?: number | null;
  postType: PostType;
  title: string;
  contentPreview: string;
  createdAt: string;
  replies: PostThreadResponse[];
  userId?: number;
  userName?: string;
}

export interface PostPageResponse {
  posts: PostThreadResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface PostFileResponse {
  postFileId: number;
  fileName: string;
  originalFileName?: string;
  fileOrder: number;
}

export interface PostLinkResponse {
  linkId: number;
  referenceLink: string;
  linkDescription: string;
}

export interface PostResponse {
  postId: number;
  postType: PostType;
  title: string;
  content: string;
  postIp: string;
  parentPostId?: number | null;
  files: PostFileResponse[];
  links: PostLinkResponse[];
  userId?: number;
  userName?: string;
}

export interface CommentResponse {
  commentId: number;
  postId: number;
  userId: number;
  parentCommentId?: number | null;
  commentContent: string;
  createAt: string;
  updateAt: string;
  children: CommentResponse[];
}

export interface CommentRequest {
  content: string;
  parentCommentId?: number | null;
}

export interface CommentUpdateRequest {
  commentContext: string;
}
