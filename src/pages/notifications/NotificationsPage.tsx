import { useMemo, useState, useCallback } from "react";
import { CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { NotificationTab } from "../../components/notifications/NotificationTabs";
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
import { PageHeader } from "../../components/common/PageHeader";
import { FilterToolbar } from "../../components/common/FilterToolbar";
import { filterNotifications, type NotificationEventFilter } from "../../utils/notificationFilters";
import { useNotificationCenter } from "../../contexts/NotificationContext";

// 알림 목록/필터/읽음 처리를 제공하는 알림 페이지
export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, markRead, markAllRead, removeNotification, resolveLink, loading, error, refresh } =
    useNotificationCenter();
  const [activeTab, setActiveTab] = useState<NotificationTab>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState<NotificationEventFilter>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all"); // idx_notification_user_unread 스타일 필터

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

  const handleMarkRead = useCallback(
    (id: string) => {
      markRead(id);
    },
    [markRead],
  );

  const handleRemove = useCallback(
    (id: string) => {
      removeNotification(id);
    },
    [removeNotification],
  );

  const handleOpen = useCallback(
    (notification: Notification) => {
      handleMarkRead(notification.id);
      const target = resolveLink(notification);
      navigate(target);
    },
    [handleMarkRead, navigate, resolveLink],
  );

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

      {loading && (
        <p className="text-sm text-muted-foreground">알림을 불러오는 중입니다...</p>
      )}
      {error && (
        <div className="text-sm text-red-600 flex items-center justify-between bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={refresh}>
            다시 시도
          </Button>
        </div>
      )}

      <NotificationList
        notifications={filteredNotifications}
        onMarkRead={handleMarkRead}
        onRemove={handleRemove}
        onOpen={handleOpen}
      />
    </div>
  );
}
