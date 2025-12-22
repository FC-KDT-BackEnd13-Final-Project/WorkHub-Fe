import { Bell } from "lucide-react";
import { NotificationBadge } from "./NotificationBadge";
import { TableCell, TableRow } from "../ui/table";
import { cn } from "../ui/utils";

export type NotificationEventType =
  | "REVIEW_REQUEST"
  | "REVIEW_COMPLETED"
  | "REVIEW_REJECTED"
  | "STATUS_CHANGED"
  | "PROJECT_CREATED"
  | "PROJECT_MEMBER_ADDED"
  | "PROJECT_MEMBER_REMOVED"
  | "PROJECT_INFO_UPDATED"
  | "PROJECT_NODE_CREATED"
  | "PROJECT_NODE_UPDATED"
  | "POST_CREATED"
  | "POST_UPDATED"
  | "POST_COMMENT_CREATED"
  | "CS_QNA_CREATED"
  | "CS_QNA_ANSWERED"
  | "CS_POST_CREATED"
  | "CS_POST_UPDATED";

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
  link?: string;
  projectId?: string;
  nodeId?: string;
  postId?: string;
  commentId?: string;
  ticketId?: string;
  csQnaId?: string;
  csPostId?: string;
  projectNodeId?: string;
  externalUrl?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onOpen?: (notification: Notification) => void;
  variant?: "table" | "card";
}

export function NotificationItem({ notification, onMarkRead, onOpen, variant = "table" }: NotificationItemProps) {
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
  const avatarElement = (
    <>
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
    </>
  );

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-white/70 bg-white/95 p-4 shadow-sm transition-colors",
          isNew ? "border-transparent bg-primary/5" : undefined,
          onOpen && "cursor-pointer hover:border-primary/50",
        )}
        onClick={() => onOpen?.(notification)}
      >
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{timeAgo}</span>
            <div className="flex items-center gap-2">
              <NotificationBadge eventType={eventType} className="px-2 py-0.5 text-[10px] font-semibold" />
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
                  read ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
                )}
              >
                {statusLabel}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            {avatarElement}
            <div className="flex-1 space-y-1">
              {actorName && (
                <p className="text-xs text-muted-foreground">
                  보낸 사람 · {actorName}
                  {userId ? ` · ${userId}` : null}
                </p>
              )}
              <p className="text-base font-semibold leading-tight text-foreground">{title}</p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{description}</p>
              
            </div>
          </div>
          {!read && (
            <div className="mt-auto flex items-center justify-end text-[10px]">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onMarkRead(id);
                }}
                className="ml-auto inline-flex min-w-[80px] items-center justify-center gap-0.5 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                확인하기
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <TableRow
      className={cn("transition-colors", isNew ? "bg-primary/5" : undefined, onOpen && "cursor-pointer")}
      onClick={() => onOpen?.(notification)}
    >
      <TableCell className="p-2 align-middle whitespace-normal break-words">
        <div className="flex items-center gap-3 min-w-0">
          {avatarElement}
          <div className="min-w-0 space-y-1">
            <p className="font-semibold truncate w-full" title={title}>
              {title}
            </p>
            <p className="text-xs text-muted-foreground truncate w-full" title={description}>
              {description}
            </p>
            {actorName && (
              <p className="mt-1 text-[11px] text-muted-foreground truncate w-full" title={actorName}>
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
        <div className="flex items-center justify-center">
          {!read && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMarkRead(id);
              }}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              aria-label="읽음으로 표시"
            >
              확인하기
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
