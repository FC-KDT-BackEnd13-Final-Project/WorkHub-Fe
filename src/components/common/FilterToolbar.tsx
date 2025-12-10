import type { ReactNode } from "react";
import { cn } from "../ui/utils";

type Alignment = "start" | "end" | "between";

interface FilterToolbarProps {
  leading?: ReactNode;
  children?: ReactNode;
  className?: string;
  align?: Alignment;
}

const alignmentClass: Record<Alignment, string> = {
  start: "md:justify-start",
  end: "md:justify-end",
  between: "md:justify-between",
};

export function FilterToolbar({ leading, children, className, align = "end" }: FilterToolbarProps) {
  return (
    <div className={cn("rounded-2xl bg-white p-6 shadow-sm space-y-4", className)}>
      {leading ? <div className="flex flex-wrap items-center gap-2">{leading}</div> : null}
      {children ? (
        <div
          className={cn(
            "flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center",
            alignmentClass[align],
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
