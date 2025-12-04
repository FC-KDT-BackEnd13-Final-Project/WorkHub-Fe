import { useMemo, useState } from "react";
import { Notification, NotificationItem } from "./NotificationItem";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";

interface NotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
}

const PAGE_SIZE = 10;

export function NotificationList({ notifications, onMarkRead, onRemove }: NotificationListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE));
  const paginatedNotifications = useMemo(() => {
    return notifications.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [notifications, currentPage]);

  return (
    <>
      <div className="min-h-0 rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="max-h-[700px] overflow-y-auto pr-1 min-h-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">알림</TableHead>
                <TableHead className="w-1/6 text-center">중요도</TableHead>
                <TableHead className="w-1/6 text-center">상태</TableHead>
                <TableHead className="w-1/6 text-center">수신 시각</TableHead>
                <TableHead className="w-1/6 text-center">확인</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={onMarkRead}
                  onRemove={onRemove}
                />
              ))}
            </TableBody>
          </Table>
          {paginatedNotifications.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              선택된 조건에 해당하는 알림이 없습니다.
            </p>
          )}
        </div>
      </div>
      {notifications.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            {"<"}
          </Button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            {">"}
          </Button>
        </div>
      )}
    </>
  );
}
