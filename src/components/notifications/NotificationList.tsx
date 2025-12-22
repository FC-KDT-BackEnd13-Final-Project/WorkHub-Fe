import { useMemo, useState } from "react";
import { Notification, NotificationItem } from "./NotificationItem";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "../ui/table";
import { PaginationControls } from "../common/PaginationControls";
import { calculateTotalPages, paginate } from "../../utils/pagination";

interface NotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onOpen?: (notification: Notification) => void;
}

const PAGE_SIZE = 10;

export function NotificationList({ notifications, onMarkRead, onOpen }: NotificationListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = calculateTotalPages(notifications.length, PAGE_SIZE);
  const paginatedNotifications = useMemo(
    () => paginate(notifications, currentPage, PAGE_SIZE),
    [notifications, currentPage],
  );

  return (
    <>
      <div className="min-h-0 rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="min-h-0 md:max-h-[700px] md:overflow-y-auto md:pr-1">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">알림</TableHead>
                  <TableHead className="w-1/6 text-center">유형</TableHead>
                  <TableHead className="w-1/6 text-center">상태</TableHead>
                  <TableHead className="w-1/6 text-center">수신 시각</TableHead>
                  <TableHead className="w-1/6 text-center">확인</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} onMarkRead={onMarkRead} onOpen={onOpen} />
                ))}
              </TableBody>
            </Table>
            {paginatedNotifications.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                선택된 조건에 해당하는 알림이 없습니다.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {paginatedNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onMarkRead={onMarkRead} onOpen={onOpen} variant="card" />
            ))}
            {paginatedNotifications.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                선택된 조건에 해당하는 알림이 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>
      {notifications.length > PAGE_SIZE && (
        <PaginationControls
          className="mt-4"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
}
