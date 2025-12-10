import { describe, expect, it } from "vitest";
import type { Notification } from "../../components/notifications/NotificationItem";
import { filterNotifications } from "../notificationFilters";

const baseNotification: Notification = {
  id: "1",
  type: "task",
  title: "검토 요청",
  description: "문서를 확인해주세요",
  eventType: "REVIEW_REQUEST",
  read: false,
  userId: "alex",
  createdAt: "2024-01-01T09:00:00Z",
  timeAgo: "방금 전",
};

const sampleNotifications: Notification[] = [
  baseNotification,
  {
    ...baseNotification,
    id: "2",
    type: "project",
    title: "프로젝트 변경",
    description: "프로젝트 상태가 변경되었습니다",
    eventType: "STATUS_CHANGED",
    read: true,
    createdAt: "2024-01-02T12:00:00Z",
    userId: "luna",
  },
  {
    ...baseNotification,
    id: "3",
    type: "team",
    title: "댓글 등록",
    description: "새 댓글이 등록되었습니다",
    eventType: "POST_COMMENT_CREATED",
    read: false,
    actorName: "Evan",
    createdAt: "2024-01-03T12:00:00Z",
    userId: "evan",
  },
];

describe("filterNotifications", () => {
  it("filters by tab categories", () => {
    const tasks = filterNotifications(sampleNotifications, {
      tab: "Tasks",
      eventFilter: "all",
      readFilter: "all",
      searchTerm: "",
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("1");
  });

  it("filters unread events and event type", () => {
    const unreadStatus = filterNotifications(sampleNotifications, {
      tab: "All",
      eventFilter: "STATUS_CHANGED",
      readFilter: "unread",
      searchTerm: "",
    });
    expect(unreadStatus).toHaveLength(0);

    const unreadComments = filterNotifications(sampleNotifications, {
      tab: "All",
      eventFilter: "POST_COMMENT_CREATED",
      readFilter: "unread",
      searchTerm: "",
    });
    expect(unreadComments).toHaveLength(1);
    expect(unreadComments[0].id).toBe("3");
  });

  it("applies search term across multiple fields", () => {
    const results = filterNotifications(sampleNotifications, {
      tab: "All",
      eventFilter: "all",
      readFilter: "all",
      searchTerm: "luna",
    });
    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe("luna");
  });
});
