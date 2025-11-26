import { cn } from "../ui/utils";

interface NotificationBadgeProps {
  priority: "high" | "medium" | "low";
  className?: string;
}

const priorityStyles: Record<NotificationBadgeProps["priority"], string> = {
  high: "bg-red-100 text-red-600",
  medium: "bg-yellow-100 text-yellow-600",
  low: "bg-gray-100 text-gray-600",
};

export function NotificationBadge({ priority, className }: NotificationBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        priorityStyles[priority],
        className,
      )}
    >
      {priority === "high" ? "High" : priority === "medium" ? "Medium" : "Low"}
    </span>
  );
}
