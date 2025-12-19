import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Notification } from "../components/notifications/NotificationItem";
import {
  fetchUnreadAndRecent,
  fetchUnreadCount,
  formatRelativeTime,
  markNotificationAsRead,
  markNotificationsAsRead,
  normalizeNotification,
  openNotificationEventSource,
} from "../lib/notifications";
import { useLocalStorageValue } from "../hooks/useLocalStorageValue";

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeNotification: (id: string) => void;
  resolveLink: (notification: Notification) => string;
  refresh: () => Promise<void>;
  disconnect: (options?: { resetCursor?: boolean }) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function sortNotifications(list: Notification[]) {
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function mergeNotifications(current: Notification[], incoming: Notification[]) {
  const map = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => {
    const existing = map.get(item.id);
    map.set(item.id, existing ? { ...existing, ...item } : item);
  });
  return sortNotifications(Array.from(map.values()));
}

function extractNotificationsFromStream(payload: unknown): Notification[] {
  const raw = payload as any;
  const candidateList =
    Array.isArray(raw) ? raw : Array.isArray(raw?.notifications) ? raw.notifications : raw?.notification ? [raw.notification] : [raw];
  return candidateList
    .map((item) => {
      try {
        return normalizeNotification(item);
      } catch (error) {
        console.error("Failed to normalize notification SSE item", error);
        return null;
      }
    })
    .filter(Boolean) as Notification[];
}

function getLastEventId(payload: unknown): string | null {
  const raw = payload as any;
  if (Array.isArray(raw) && raw.length && raw[0]?.id != null) {
    return String(raw[0].id);
  }
  if (raw?.notification?.id != null) {
    return String(raw.notification.id);
  }
  if (raw?.id != null) {
    return String(raw.id);
  }
  return null;
}

export function NotificationProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const serverUnreadCountRef = useRef<number | null>(null);

  const [, setStoredUnreadCount] = useLocalStorageValue<number>("workhubUnreadNotificationCount", {
    defaultValue: 0,
    parser: (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    },
    serializer: (value) => String(value),
  });

  const unreadCountFromList = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const unreadCount = useMemo(() => {
    const serverUnread = serverUnreadCountRef.current;
    return serverUnread != null ? Math.max(unreadCountFromList, serverUnread) : unreadCountFromList;
  }, [unreadCountFromList]);

  const resolveLink = useCallback((notification: Notification) => {
    const { link, externalUrl, projectId, csPostId, csQnaId, ticketId, postId, projectNodeId, nodeId } = notification;
    if (link) {
      if (link.endsWith("/comments")) {
        return link.replace(/\/comments$/, "");
      }
      if (projectId && link === `/projects/${projectId}`) {
        return `/projects/${projectId}/nodes`;
      }
      // CS 게시글/댓글 알림: /projects/{id}/csPosts... -> 지원 페이지 경로로 매핑
      if (link.startsWith("/projects/") && link.includes("/csPosts")) {
        const match = link.match(/\/projects\/([^/]+)/);
        const pid = match?.[1] ?? projectId;
        if (pid && csPostId) {
          return `/projects/${pid}/nodes/support/${csPostId}`;
        }
        if (pid) {
          return `/projects/${pid}/nodes/support`;
        }
        return "/notifications";
      }
      return link;
    }
    if (externalUrl) return externalUrl;

    const supportTicketId = ticketId ?? csPostId ?? csQnaId;
    if (projectId && supportTicketId) {
      return `/projects/${projectId}/nodes/support/${supportTicketId}`;
    }
    if (projectId && (notification.eventType === "CS_QNA_CREATED" || notification.eventType === "CS_QNA_ANSWERED")) {
      return `/projects/${projectId}/nodes/support`;
    }
    if (postId && projectId) {
      const targetNodeId = projectNodeId ?? nodeId;
      return targetNodeId
        ? `/projects/${projectId}/nodes/${targetNodeId}/posts/${postId}`
        : `/projectpost/${postId}`;
    }
    if (projectId && (projectNodeId || nodeId)) {
      return `/projects/${projectId}/nodes/${projectNodeId ?? nodeId}`;
    }
    if (projectId) {
      return `/projects/${projectId}`;
    }
    return "/notifications";
  }, []);

  const disconnect = useCallback((options?: { resetCursor?: boolean }) => {
    const resetCursor = options?.resetCursor ?? false;
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (resetCursor) {
      lastEventIdRef.current = null;
    }
  }, []);

  const handleStreamMessage = useCallback((payload: unknown, event?: MessageEvent) => {
    const incoming = extractNotificationsFromStream(payload);
    if (!incoming.length) return;
    const lastId = event?.lastEventId ?? getLastEventId(payload);
    if (lastId) {
      lastEventIdRef.current = lastId;
    }
    setNotifications((prev) => mergeNotifications(prev, incoming));
  }, []);

  const connectStream = useCallback(() => {
    if (!enabled || eventSourceRef.current) return;
    try {
      eventSourceRef.current = openNotificationEventSource({
        onMessage: handleStreamMessage,
        onError: () => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED && !reconnectTimerRef.current) {
            reconnectTimerRef.current = window.setTimeout(() => {
              reconnectTimerRef.current = null;
              disconnect();
              connectStream();
            }, 5000);
          }
        },
        lastEventId: lastEventIdRef.current,
      });
    } catch (err) {
      console.error("Failed to open notification stream", err);
    }
  }, [disconnect, enabled, handleStreamMessage]);

  const syncUnreadCount = useCallback(
    (count: number) => {
      setStoredUnreadCount(count);
    },
    [setStoredUnreadCount],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, unreadFromServer] = await Promise.all([
        fetchUnreadAndRecent(),
        fetchUnreadCount().catch(() => null),
      ]);
      serverUnreadCountRef.current = typeof unreadFromServer === "number" ? unreadFromServer : null;
      const normalized = sortNotifications(list.map((item) => normalizeNotification(item)));
      setNotifications(normalized);
      const localUnread = normalized.filter((notification) => !notification.read).length;
      const mergedUnread =
        serverUnreadCountRef.current != null ? Math.max(localUnread, serverUnreadCountRef.current) : localUnread;
      syncUnreadCount(mergedUnread);
      setError(null);
    } catch (err) {
      serverUnreadCountRef.current = null;
      console.error(err);
      const message = err instanceof Error ? err.message : "알림을 불러오는 중 문제가 발생했습니다.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [syncUnreadCount]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      return prev.map((item) => (item.id === id ? { ...item, read: true } : item));
    });
    serverUnreadCountRef.current = null;
    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error(err);
      toast.error("알림 읽음 처리에 실패했습니다.");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    serverUnreadCountRef.current = null;
    try {
      const unreadIds = notifications.filter((notification) => !notification.read).map((notification) => notification.id);
      if (!unreadIds.length) return;
      await markNotificationsAsRead(unreadIds);
    } catch (err) {
      console.error(err);
      toast.error("전체 읽음 처리에 실패했습니다.");
    }
  }, [notifications]);

  const removeNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        return prev.filter((item) => item.id !== id);
      });
      serverUnreadCountRef.current = null;
    },
    [],
  );

  useEffect(() => {
    const serverUnread = serverUnreadCountRef.current;
    const merged = serverUnread != null ? Math.max(unreadCountFromList, serverUnread) : unreadCountFromList;
    syncUnreadCount(merged);
  }, [syncUnreadCount, unreadCountFromList]);

  useEffect(() => {
    if (!enabled) {
      disconnect({ resetCursor: true });
      setNotifications([]);
      serverUnreadCountRef.current = null;
      lastEventIdRef.current = null;
      syncUnreadCount(0);
      return;
    }
    refresh();
    connectStream();
    return () => {
      disconnect();
    };
  }, [connectStream, disconnect, enabled, refresh, syncUnreadCount]);

  useEffect(() => {
    if (!enabled) return;
    const handleBeforeUnload = () => disconnect();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [disconnect, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const intervalId = window.setInterval(() => {
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          timeAgo: formatRelativeTime(notification.createdAt),
        })),
      );
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, [enabled]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      markRead,
      markAllRead,
      removeNotification,
      resolveLink,
      refresh,
      disconnect,
    }),
    [notifications, unreadCount, loading, error, markRead, markAllRead, removeNotification, resolveLink, refresh, disconnect],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationCenter() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationCenter must be used within NotificationProvider");
  }
  return context;
}
