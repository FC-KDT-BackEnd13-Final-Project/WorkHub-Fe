import { Bell, Check, X } from "lucide-react";
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
  onRemove: (id: string) => void;
  onOpen?: (notification: Notification) => void;
  variant?: "table" | "card";
}

export function NotificationItem({ notification, onMarkRead, onRemove, onOpen, variant = "table" }: NotificationItemProps) {
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
          isNew ? "ring-1 ring-primary/30" : undefined,
          onOpen && "cursor-pointer hover:border-primary/50",
        )}
        onClick={() => onOpen?.(notification)}
      >
        <div className="flex items-start gap-3">
          {avatarElement}
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="flex-1 text-sm font-semibold text-foreground">{title}</p>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
            {actorName && (
              <p className="text-[11px] text-muted-foreground">
                {actorName}
                {userId ? ` · ${userId}` : null}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <NotificationBadge eventType={eventType} className="px-2.5 py-0.5 text-[11px] font-semibold" />
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  read ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
                )}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          {!read && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMarkRead(id);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Check className="h-3.5 w-3.5" />
              읽음 처리
            </button>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(id);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
            삭제
          </button>
        </div>
      </div>
    );
  }

  return (
    <TableRow
      className={cn("transition-colors", isNew ? "bg-primary/5" : undefined, onOpen && "cursor-pointer")}
      onClick={() => onOpen?.(notification)}
    >
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
              onClick={(event) => {
                event.stopPropagation();
                onMarkRead(id);
              }}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              aria-label="읽음으로 표시"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(id);
            }}
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
