import { apiClient } from "./api";
import type { Notification, NotificationEventType } from "../components/notifications/NotificationItem";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export type NotificationDto = Partial<Notification> & {
  id: string | number;
  createdAt?: string;
  relatedUrl?: string;
  content?: string;
  body?: string;
  type?: NotificationEventType | Notification["type"];
  projectNodeId?: string | number;
  commentId?: string | number;
  csQnaId?: string | number;
  csPostId?: string | number;
  readAt?: string | null;
};

const NOTIFICATION_BASE_PATH = "/api/v1/notifications";
const NOTIFICATION_STREAM_PATH = `${NOTIFICATION_BASE_PATH}/stream`;

export async function fetchUnreadAndRecent(): Promise<NotificationDto[]> {
  const response = await apiClient.get<ApiResponse<NotificationDto[]> | NotificationDto[]>(NOTIFICATION_BASE_PATH);
  const payload = response.data;

  if (Array.isArray(payload)) {
    return payload as NotificationDto[];
  }

  const list = Array.isArray(payload?.data) ? (payload.data as NotificationDto[]) : [];

  if (payload && !Array.isArray(payload) && payload.success === false) {
    throw new Error(payload.message || "알림을 불러오지 못했습니다.");
  }

  return list ?? [];
}

export async function fetchUnreadCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<number>>(`${NOTIFICATION_BASE_PATH}/unread-count`);
  const payload = response.data;
  if (payload.success === false) {
    throw new Error(payload.message || "읽지 않은 알림 수를 불러오지 못했습니다.");
  }
  return typeof payload.data === "number" ? payload.data : 0;
}

export async function markNotificationAsRead(id: string) {
  await apiClient.patch(`${NOTIFICATION_BASE_PATH}/${id}/read`);
}

export async function markNotificationsAsRead(ids: string[]) {
  if (!ids.length) return;
  await Promise.all(ids.map((id) => markNotificationAsRead(id)));
}

export function openNotificationEventSource(onMessage: (data: unknown) => void, onError?: (error: any) => void) {
  const streamUrl = `${apiClient.defaults.baseURL ?? ""}${NOTIFICATION_STREAM_PATH}`;
  const eventSource = new EventSource(streamUrl, { withCredentials: true });
  eventSource.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch (error) {
      console.error("Failed to parse notification SSE payload", error);
    }
  };
  if (onError) {
    eventSource.onerror = onError;
  }
  return eventSource;
}

export function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "방금 전";
  }
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}주 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}달 전`;
  const years = Math.floor(days / 365);
  return `${years}년 전`;
}

export function normalizeNotification(dto: NotificationDto): Notification {
  const createdAt = dto.createdAt ? new Date(dto.createdAt).toISOString() : new Date().toISOString();
  const eventType = (dto.eventType ?? dto.type ?? "STATUS_CHANGED") as NotificationEventType;
  const projectNodeId = dto.projectNodeId ?? dto.nodeId;
  const postId = dto.postId ?? dto.csPostId;
  const csPostId = dto.csPostId ? String(dto.csPostId) : undefined;
  const csQnaId = dto.csQnaId ? String(dto.csQnaId) : undefined;
  const commentId = dto.commentId ? String(dto.commentId) : undefined;

  return {
    id: String(dto.id),
    type: dto.type && ["task", "team", "project"].includes(String(dto.type)) ? (dto.type as Notification["type"]) : "project",
    title: dto.title ?? "새 알림",
    description: dto.description ?? dto.body ?? dto.content ?? "새로운 알림이 도착했습니다.",
    eventType,
    read: dto.read ?? Boolean(dto.readAt),
    userId: dto.userId ? String(dto.userId) : "",
    createdAt,
    timeAgo: dto.timeAgo ?? formatRelativeTime(createdAt),
    initials: dto.initials,
    avatarUrl: dto.avatarUrl,
    actorName: dto.actorName,
    actorType: dto.actorType,
    link: dto.link ?? dto.relatedUrl ?? dto.externalUrl,
    projectId: dto.projectId ? String(dto.projectId) : undefined,
    nodeId: projectNodeId ? String(projectNodeId) : undefined,
    projectNodeId: projectNodeId ? String(projectNodeId) : undefined,
    postId: postId ? String(postId) : undefined,
    csPostId,
    csQnaId,
    commentId,
    ticketId: dto.ticketId ?? csQnaId ?? csPostId,
    externalUrl: dto.externalUrl,
  } as Notification;
}
