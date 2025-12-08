import { cn } from "../ui/utils";
import type { NotificationEventType } from "./NotificationItem";

interface NotificationBadgeProps {
  eventType: NotificationEventType;
  className?: string;
}

const typeStyles: Record<
  NotificationEventType,
  { label: string; bg: string; color: string; border: string }
> = {
  REVIEW_REQUEST: {
    label: "검토 요청",
    bg: "#FFFBEB",
    color: "#B45309",
    border: "#FCD34D",
  },
  REVIEW_COMPLETED: {
    label: "검토 완료",
    bg: "#ECFDF5",
    color: "#15803D",
    border: "#A7F3D0",
  },
  REVIEW_REJECTED: {
    label: "검토 반려",
    bg: "#FEF2F2",
    color: "#B91C1C",
    border: "#FECACA",
  },
  STATUS_CHANGED: {
    label: "상태 변경 안내",
    bg: "#EFF6FF",
    color: "#1D4ED8",
    border: "#BFDBFE",
  },
  POST_CREATED: {
    label: "게시글 등록",
    bg: "#F0FDFA",
    color: "#0F766E",
    border: "#99F6E4",
  },
  POST_COMMENT_CREATED: {
    label: "게시글 댓글 등록",
    bg: "#F0FDFA",
    color: "#0F766E",
    border: "#99F6E4",
  },
  CS_QNA_CREATED: {
    label: "CS 질문 등록",
    bg: "#FFFBEB",
    color: "#B45309",
    border: "#FCD34D",
  },
  CS_QNA_ANSWERED: {
    label: "CS 답변 완료",
    bg: "#ECFDF5",
    color: "#15803D",
    border: "#A7F3D0",
  },
};

export function NotificationBadge({ eventType, className }: NotificationBadgeProps) {
  const fallback = {
    label: "알림",
    bg: "#F9FAFB",
    color: "#374151",
    border: "#E5E7EB",
  };
  const { label, bg, color, border } = typeStyles[eventType] ?? fallback;
  const style = {
    backgroundColor: bg,
    color,
    border: `1px solid ${border}`,
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        className,
      )}
      style={style}
    >
      <span className="inline-flex h-2 w-2 rounded-full opacity-70" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
