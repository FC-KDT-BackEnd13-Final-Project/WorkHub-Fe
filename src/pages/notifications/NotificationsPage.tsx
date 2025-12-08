import { useEffect, useMemo, useState } from "react";
import { CheckSquare } from "lucide-react";
import { NotificationTabs, NotificationTab } from "../../components/notifications/NotificationTabs";
import { NotificationList } from "../../components/notifications/NotificationList";
import type { Notification } from "../../components/notifications/NotificationItem";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { initialNotifications } from "../../data/notifications";

// 알림 목록/필터/읽음 처리를 제공하는 알림 페이지
export function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState<NotificationTab>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState<
    | "all"
    | "REVIEW_REQUEST"
    | "REVIEW_COMPLETED"
    | "REVIEW_REJECTED"
    | "STATUS_CHANGED"
    | "POST_CREATED"
    | "POST_COMMENT_CREATED"
    | "CS_QNA_CREATED"
    | "CS_QNA_ANSWERED"
  >("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all"); // idx_notification_user_unread 스타일 필터

  useEffect(() => {
    if (typeof window === "undefined") return;
    const unreadCount = notifications.filter((notification) => !notification.read).length;
    window.localStorage.setItem("workhubUnreadNotificationCount", unreadCount.toString());
    window.dispatchEvent(new CustomEvent("workhub:notifications", { detail: unreadCount }));
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    let result = notifications;

    switch (activeTab) {
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

    return [...result].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [activeTab, notifications, readFilter, searchTerm, eventFilter]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  const handleRemove = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <div className="space-y-6 pb-12 pt-6 min-h-0">
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-2 text-muted-foreground">
          업데이트, 멘션, 알림을 확인하고 필요한 조치를 진행하세요.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center">
        <Input
          placeholder="보고 싶은 알림을 키워드로 찾아보세요"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="md:flex-1"
        />
        <Select value={eventFilter} onValueChange={(value) => setEventFilter(value as typeof eventFilter)}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="전체 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="REVIEW_REQUEST">검토 요청</SelectItem>
            <SelectItem value="REVIEW_COMPLETED">검토 완료</SelectItem>
            <SelectItem value="REVIEW_REJECTED">검토 반려</SelectItem>
            <SelectItem value="STATUS_CHANGED">상태 변경 안내</SelectItem>
            <SelectItem value="POST_CREATED">게시글 등록</SelectItem>
            <SelectItem value="POST_COMMENT_CREATED">게시글 댓글 등록</SelectItem>
            <SelectItem value="CS_QNA_CREATED">CS 질문 등록</SelectItem>
            <SelectItem value="CS_QNA_ANSWERED">CS 답변 완료</SelectItem>
          </SelectContent>
        </Select>
        <Select value={readFilter} onValueChange={(value) => setReadFilter(value as typeof readFilter)}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="읽지 않은 알림 조회" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 알림 보기</SelectItem>
            <SelectItem value="unread">읽지 않은 알림 조회</SelectItem>
          </SelectContent>
        </Select>
        <Button className="md:w-auto flex items-center gap-2" variant="default" onClick={markAllRead}>
          <CheckSquare className="h-4 w-4" />
          전체 읽음 처리
        </Button>
      </div>

      <NotificationList
        notifications={filteredNotifications}
        onMarkRead={handleMarkRead}
        onRemove={handleRemove}
      />
    </div>
  );
}
