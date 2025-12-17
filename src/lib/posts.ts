import { apiClient } from "./api";
import type {
  CommentRequest,
  CommentResponse,
  CommentUpdateRequest,
  PostPageResponse,
  PostResponse,
  PostThreadResponse,
  PostType,
} from "../types/post";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export type PostTypeLabel = "공지" | "질문" | "일반";

const POST_TYPE_LABEL_MAP: Record<PostType, PostTypeLabel> = {
  NOTICE: "공지",
  QUESTION: "질문",
  GENERAL: "일반",
};

const LABEL_TO_POST_TYPE: Record<PostTypeLabel, PostType> = {
  공지: "NOTICE",
  질문: "QUESTION",
  일반: "GENERAL",
};

const POST_BASE_PATH = "/api/v1/projects";

function unwrapApiResponse<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === "object" && "success" in payload) {
    if (payload.success === false) {
      throw new Error(payload.message || "요청 처리 중 오류가 발생했습니다.");
    }
    return (payload as ApiResponse<T>).data as T;
  }
  return payload as T;
}

export function mapPostTypeToLabel(type: PostType): PostTypeLabel {
  return POST_TYPE_LABEL_MAP[type] ?? "일반";
}

export function mapLabelToPostType(label: PostTypeLabel): PostType {
  return LABEL_TO_POST_TYPE[label] ?? "GENERAL";
}

export async function fetchPostThreads(params: {
  projectId: string;
  nodeId: string;
  keyword?: string;
  postType?: PostType;
  page?: number;
  size?: number;
}) {
  const { projectId, nodeId, ...rest } = params;
  const response = await apiClient.get<ApiResponse<PostPageResponse>>(
    `${POST_BASE_PATH}/${projectId}/nodes/${nodeId}/posts`,
    { params: rest },
  );
  return unwrapApiResponse(response.data);
}

export async function fetchPost(params: { projectId: string; nodeId: string; postId: string }) {
  const { projectId, nodeId, postId } = params;
  const response = await apiClient.get<ApiResponse<PostResponse>>(
    `${POST_BASE_PATH}/${projectId}/nodes/${nodeId}/posts/${postId}`,
  );
  return unwrapApiResponse(response.data);
}

export async function createPost(params: {
  projectId: string;
  nodeId: string;
  payload: {
    title: string;
    content: string;
    postType: PostType;
    postIp: string;
    parentPostId?: number | null;
    links?: { url: string; description?: string }[];
  };
  files?: File[];
}) {
  const { projectId, nodeId, payload, files } = params;
  const formData = new FormData();
  const normalizedLinks =
    payload.links?.map((link) => ({
      referenceLink: link.url,
      linkDescription: link.description?.trim() || link.url,
    })) ?? [];

  formData.append(
    "data",
    new Blob(
      [
        JSON.stringify({
          title: payload.title,
          postType: payload.postType,
          content: payload.content,
          postIp: payload.postIp,
          parentPostId: payload.parentPostId ?? null,
          links: normalizedLinks.length ? normalizedLinks : null,
        }),
      ],
      { type: "application/json" },
    ),
  );

  (files ?? []).forEach((file) => {
    formData.append("files", file);
  });

  const response = await apiClient.post<ApiResponse<PostResponse>>(
    `${POST_BASE_PATH}/${projectId}/nodes/${nodeId}/posts`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return unwrapApiResponse(response.data);
}

export async function updatePost(params: {
  projectId: string;
  nodeId: string;
  postId: string;
  payload: {
    title: string;
    content: string;
    postType: PostType;
    postIp: string;
    links?: { url: string; description?: string; linkId?: number | null }[];
  };
}) {
  const { projectId, nodeId, postId, payload } = params;
  const normalizedLinks =
    payload.links?.map((link) => ({
      linkId: link.linkId ?? null,
      referenceLink: link.url,
      linkDescription: link.description?.trim() || link.url,
      deleted: false,
    })) ?? [];

  const response = await apiClient.patch<ApiResponse<PostResponse>>(
    `${POST_BASE_PATH}/${projectId}/nodes/${nodeId}/posts/${postId}`,
    {
      title: payload.title,
      postType: payload.postType,
      content: payload.content,
      postIp: payload.postIp,
      links: normalizedLinks.length ? normalizedLinks : null,
      files: null,
    },
  );
  return unwrapApiResponse(response.data);
}

export async function deletePost(params: { projectId: string; nodeId: string; postId: string }) {
  const { projectId, nodeId, postId } = params;
  const response = await apiClient.delete<ApiResponse<unknown>>(
    `${POST_BASE_PATH}/${projectId}/nodes/${nodeId}/posts/${postId}`,
  );
  unwrapApiResponse(response.data);
}

export async function fetchComments(params: {
  projectId: string;
  nodeId: string;
  postId: string;
  page?: number;
  size?: number;
}) {
  const { projectId, nodeId, postId, ...rest } = params;
  const response = await apiClient.get<ApiResponse<{ content: CommentResponse[]; totalPages: number; totalElements: number }>>(
    `${POST_BASE_PATH}/${projectId}/nodes/${nodeId}/posts/${postId}/comments`,
    { params: rest },
  );
  return unwrapApiResponse(response.data);
}

export async function createComment(params: {
  projectId: string;
  nodeId: string;
  postId: string;
  payload: CommentRequest;
}) {
  const { projectId, nodeId, postId, payload } = params;
  const response = await apiClient.post<ApiResponse<CommentResponse>>(
    `${POST_BASE_PATH}/${projectId}/nodes/${nodeId}/posts/${postId}/comments`,
    payload,
  );
  return unwrapApiResponse(response.data);
}

export async function updateComment(params: {
  projectId: string;
  nodeId: string;
  postId: string;
  commentId: string;
  payload: CommentUpdateRequest;
}) {
  const { projectId, nodeId, postId, commentId, payload } = params;
  const response = await apiClient.patch<ApiResponse<CommentResponse>>(
    `${POST_BASE_PATH}/${projectId}/nodes/${nodeId}/posts/${postId}/comments/${commentId}`,
    payload,
  );
  return unwrapApiResponse(response.data);
}

export async function deleteComment(params: {
  projectId: string;
  nodeId: string;
  postId: string;
  commentId: string;
}) {
  const { projectId, nodeId, postId, commentId } = params;
  const response = await apiClient.delete<ApiResponse<unknown>>(
    `${POST_BASE_PATH}/${projectId}/nodes/${nodeId}/posts/${postId}/comments/${commentId}`,
  );
  unwrapApiResponse(response.data);
}

export function flattenPostReplies(replies: PostThreadResponse[]): PostThreadResponse[] {
  const result: PostThreadResponse[] = [];
  const visit = (items: PostThreadResponse[]) => {
    items.forEach((item) => {
      result.push(item);
      if (item.replies?.length) {
        visit(item.replies);
      }
    });
  };
  visit(replies ?? []);
  return result;
}
