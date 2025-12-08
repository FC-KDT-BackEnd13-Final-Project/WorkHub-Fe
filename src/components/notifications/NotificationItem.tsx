import { Bell, Check, X } from "lucide-react";
import { NotificationBadge } from "./NotificationBadge";
import { TableCell, TableRow } from "../ui/table";
import { cn } from "../ui/utils";

export type NotificationEventType =
  | "REVIEW_REQUEST"
  | "REVIEW_COMPLETED"
  | "REVIEW_REJECTED"
  | "STATUS_CHANGED"
  | "POST_CREATED"
  | "POST_COMMENT_CREATED"
  | "CS_QNA_CREATED"
  | "CS_QNA_ANSWERED";

export interface Notification {
  id: string;
  type: "task" | "project" | "team";
  title: string;
  description: string;
  eventType: NotificationEventType;
  read: boolean;
  userId: string;
  createdAt: string;
  timeAgo: string;
  initials?: string;
  avatarUrl?: string;
  actorName?: string;
  actorType?: "user" | "system";
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead, onRemove }: NotificationItemProps) {
  const {
    id,
    title,
    description,
    eventType,
    read,
    userId,
    timeAgo,
    initials,
    avatarUrl,
    actorName,
    actorType = "user",
  } = notification;
  const isNew = !read;

  const statusLabel = read ? "읽음" : "새 알림";

  return (
    <TableRow className={cn("transition-colors", isNew ? "bg-primary/5" : undefined)}>
      <TableCell className="p-2 align-middle">
        <div className="flex items-center gap-3">
          {actorType === "system" ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Bell className="h-5 w-5" />
            </div>
          ) : avatarUrl ? (
            <img
              src={avatarUrl}
              alt={actorName ?? initials ?? "Notification"}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-sm font-semibold text-muted-foreground">
              {initials ?? "NH"}
            </div>
          )}
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            {actorName && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {actorName}
                {userId ? ` · ${userId}` : null}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="p-2 align-middle text-center">
        <NotificationBadge eventType={eventType} />
      </TableCell>
      <TableCell className="p-2 align-middle text-center">
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
            read ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          {statusLabel}
        </span>
      </TableCell>
      <TableCell className="p-2 align-middle text-center text-sm text-muted-foreground">{timeAgo}</TableCell>
      <TableCell className="p-2 align-middle">
        <div className="flex items-center justify-center gap-2">
          {!read && (
            <button
              type="button"
              onClick={() => onMarkRead(id)}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              aria-label="읽음으로 표시"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(id)}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label="알림 삭제"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
