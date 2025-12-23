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
  senderUserId?: string | number | null;
  senderName?: string | null;
  senderProfileImg?: string | null;
  projectNodeId?: string | number;
  commentId?: string | number;
  csQnaId?: string | number;
  csPostId?: string | number;
  readAt?: string | null;
};

const NOTIFICATION_BASE_PATH = "/api/v1/notifications";
const NOTIFICATION_STREAM_PATH = `${NOTIFICATION_BASE_PATH}/stream`;
const NOTIFICATION_EVENT_TYPES: NotificationEventType[] = [
  "REVIEW_REQUEST",
  "REVIEW_COMPLETED",
  "REVIEW_REJECTED",
  "STATUS_CHANGED",
  "PROJECT_CREATED",
  "PROJECT_MEMBER_ADDED",
  "PROJECT_MEMBER_REMOVED",
  "PROJECT_INFO_UPDATED",
  "PROJECT_NODE_CREATED",
  "PROJECT_NODE_UPDATED",
  "POST_CREATED",
  "POST_UPDATED",
  "POST_COMMENT_CREATED",
  "CS_QNA_CREATED",
  "CS_QNA_ANSWERED",
  "CS_POST_CREATED",
  "CS_POST_UPDATED",
  "CHECKLIST_CREATED",
  "CHECKLIST_UPDATED",
  "CHECKLIST_ITEM_STATUS_CHANGED",
  "CHECKLIST_COMMENT_CREATED",
];

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

function parseNotificationDate(dateLike?: string): string {
  if (!dateLike) {
    return new Date().toISOString();
  }
  // 백엔드(LocalDateTime 직렬화)가 타임존을 포함하지 않는 경우, 로컬 타임으로 해석한다.
  let normalized = dateLike.trim();
  if (!normalized.includes("T") && normalized.includes(" ")) {
    normalized = normalized.replace(" ", "T");
  }
  normalized = normalized.replace(/(\.\d{3})\d+/, "$1");
  const hasTimezone = /[zZ]|([+-]\d{2}:?\d{2})$/.test(normalized);
  if (hasTimezone) {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(\.\d{1,3})?)?$/,
  );
  if (!match) {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  const [, year, month, day, hour, minute, second = "0", fraction = ""] = match;
  const ms = fraction ? Number(`${fraction}000`.slice(1, 4)) : 0;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    ms,
  );
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function openNotificationEventSource(options: {
  onMessage: (data: unknown, event: MessageEvent) => void;
  onError?: (error: any) => void;
  lastEventId?: string | null;
}) {
  const { onMessage, onError, lastEventId } = options;
  const baseUrl = `${apiClient.defaults.baseURL ?? ""}${NOTIFICATION_STREAM_PATH}`;
  // Some browsers do not allow setting Last-Event-ID manually, so append as a query param for a best-effort replay.
  const streamUrl = lastEventId ? `${baseUrl}?lastEventId=${encodeURIComponent(lastEventId)}` : baseUrl;
  const eventSource = new EventSource(streamUrl, { withCredentials: true });

  const handleEvent = (event: MessageEvent) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed, event);
    } catch (error) {
      console.error("Failed to parse notification SSE payload", error);
    }
  };

  eventSource.onmessage = handleEvent;
  NOTIFICATION_EVENT_TYPES.forEach((eventType) => {
    eventSource.addEventListener(eventType, handleEvent as EventListener);
  });
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
  const createdAt = parseNotificationDate(dto.createdAt);
  const eventType = (dto.eventType ?? dto.type ?? "STATUS_CHANGED") as NotificationEventType;
  const projectNodeId = dto.projectNodeId ?? dto.nodeId;
  const postId = dto.postId ?? dto.csPostId;
  const senderId = dto.senderUserId ?? dto.userId;
  const userId = senderId != null ? String(senderId) : dto.userId ? String(dto.userId) : "";
  const csPostId = dto.csPostId ? String(dto.csPostId) : undefined;
  const csQnaId = dto.csQnaId ? String(dto.csQnaId) : undefined;
  const commentId = dto.commentId ? String(dto.commentId) : undefined;
  const actorName = dto.actorName ?? dto.senderName ?? undefined;
  const avatarUrl = dto.avatarUrl ?? dto.senderProfileImg ?? undefined;
  let linkCandidate = dto.link ?? dto.relatedUrl ?? dto.externalUrl;
  if (linkCandidate && linkCandidate.startsWith("/api/")) {
    const checklistMatch = linkCandidate.match(/\/api\/v1\/projects\/([^/]+)\/nodes\/([^/]+)\/checkLists/i);
    const nodeMatch = linkCandidate.match(/\/api\/v1\/projects\/([^/]+)\/nodes\/([^/]+)/i);
    if (checklistMatch) {
      const [, pid, nid] = checklistMatch;
      linkCandidate = `/projects/${pid}/nodes/${nid}`;
    } else if (nodeMatch) {
      const [, pid, nid] = nodeMatch;
      linkCandidate = `/projects/${pid}/nodes/${nid}`;
    } else {
      linkCandidate = undefined;
    }
  }
  const link =
    linkCandidate && /\/checklists$/i.test(linkCandidate)
      ? linkCandidate.replace(/\/checklists$/i, "")
      : linkCandidate;

  return {
    id: String(dto.id),
    type: dto.type && ["task", "team", "project"].includes(String(dto.type)) ? (dto.type as Notification["type"]) : "project",
    title: dto.title ?? "새 알림",
    description: dto.description ?? dto.body ?? dto.content ?? "새로운 알림이 도착했습니다.",
    eventType,
    read: dto.read ?? Boolean(dto.readAt),
    userId,
    senderUserId: senderId != null ? String(senderId) : undefined,
    createdAt,
    timeAgo: dto.timeAgo ?? formatRelativeTime(createdAt),
    initials: dto.initials ?? (actorName ? actorName.slice(0, 2).toUpperCase() : undefined),
    avatarUrl,
    actorName,
    actorType: dto.actorType,
    link,
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
