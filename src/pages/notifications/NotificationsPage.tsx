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
  const [typeFilter, setTypeFilter] = useState<"all" | "task" | "project" | "team">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");

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

    if (typeFilter !== "all") {
      result = result.filter((notification) => notification.type === typeFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter((notification) => notification.priority === priorityFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (notification) =>
          notification.title.toLowerCase().includes(term) ||
          notification.description.toLowerCase().includes(term),
      );
    }

    return [...result].sort((a, b) => Number(a.read) - Number(b.read));
  }, [activeTab, notifications, priorityFilter, searchTerm, typeFilter]);

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
          placeholder="알림을 검색하세요"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="md:flex-1"
        />
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="전체 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            <SelectItem value="task">작업</SelectItem>
            <SelectItem value="project">프로젝트</SelectItem>
            <SelectItem value="team">팀</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(value) => setPriorityFilter(value as typeof priorityFilter)}
        >
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="전체 중요도" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 중요도</SelectItem>
            <SelectItem value="high">높음</SelectItem>
            <SelectItem value="medium">중간</SelectItem>
            <SelectItem value="low">낮음</SelectItem>
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
