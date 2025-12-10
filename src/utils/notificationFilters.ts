import type { Notification } from "../components/notifications/NotificationItem";
import type { NotificationTab } from "../components/notifications/NotificationTabs";

export type NotificationEventFilter =
  | "all"
  | "REVIEW_REQUEST"
  | "REVIEW_COMPLETED"
  | "REVIEW_REJECTED"
  | "STATUS_CHANGED"
  | "POST_CREATED"
  | "POST_COMMENT_CREATED"
  | "CS_QNA_CREATED"
  | "CS_QNA_ANSWERED";

export interface NotificationFilterOptions {
  tab: NotificationTab;
  eventFilter: NotificationEventFilter;
  readFilter: "all" | "unread";
  searchTerm: string;
}

/**
 * 알림 목록을 탭/이벤트/읽음/검색 조건에 맞게 필터링하고 최신순으로 정렬한다.
 */
export function filterNotifications(
  notifications: Notification[],
  { tab, eventFilter, readFilter, searchTerm }: NotificationFilterOptions,
) {
  let result = [...notifications];

  switch (tab) {
    case "Unread":
      result = result.filter((notification) => !notification.read);
      break;
    case "Tasks":
      result = result.filter((notification) => notification.type === "task");
      break;
    case "Projects":
      result = result.filter((notification) => notification.type === "project");
      break;
    case "Team":
      result = result.filter((notification) => notification.type === "team");
      break;
    default:
      break;
  }

  if (eventFilter !== "all") {
    result = result.filter((notification) => notification.eventType === eventFilter);
  }

  if (readFilter === "unread") {
    result = result.filter((notification) => !notification.read);
  }

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    result = result.filter(
      (notification) =>
        notification.title.toLowerCase().includes(term) ||
        notification.description.toLowerCase().includes(term) ||
        notification.actorName?.toLowerCase().includes(term) ||
        notification.userId.toLowerCase().includes(term) ||
        notification.id.toLowerCase().includes(term),
    );
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
