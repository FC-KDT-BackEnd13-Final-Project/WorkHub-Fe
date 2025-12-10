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
import { useLocalStorageValue } from "../../hooks/useLocalStorageValue";
import { PageHeader } from "../../components/common/PageHeader";
import { FilterToolbar } from "../../components/common/FilterToolbar";
import { filterNotifications, type NotificationEventFilter } from "../../utils/notificationFilters";

// 알림 목록/필터/읽음 처리를 제공하는 알림 페이지
export function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState<NotificationTab>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState<NotificationEventFilter>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all"); // idx_notification_user_unread 스타일 필터

  // Sidebar와 동일한 키를 사용해 읽지 않은 알림 개수를 공유한다.
  const [, setStoredUnreadCount] = useLocalStorageValue<number>("workhubUnreadNotificationCount", {
    defaultValue: initialNotifications.filter((notification) => !notification.read).length,
    parser: (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    },
    serializer: (value) => String(value),
    listen: false,
  });

  useEffect(() => {
    const unreadCount = notifications.filter((notification) => !notification.read).length;
    setStoredUnreadCount(unreadCount);
  }, [notifications, setStoredUnreadCount]);

  // 탭/필터 조건을 묶어서 별도 util로 위임하면 테스트하기 쉬워진다.
  const filteredNotifications = useMemo(
    () =>
      filterNotifications(notifications, {
        tab: activeTab,
        eventFilter,
        readFilter,
        searchTerm,
      }),
    [activeTab, eventFilter, notifications, readFilter, searchTerm],
  );

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
    <div className="space-y-6 pb-12 min-h-0">
      <PageHeader
        title="Notifications"
        description="업데이트, 멘션, 알림을 확인하고 필요한 조치를 진행하세요."
      />

      <FilterToolbar align="between">
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
      </FilterToolbar>

      <NotificationList
        notifications={filteredNotifications}
        onMarkRead={handleMarkRead}
        onRemove={handleRemove}
      />
    </div>
  );
}
