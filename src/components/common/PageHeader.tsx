import type { ReactNode } from "react";
import { cn } from "../ui/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {action ? <div className="md:text-right">{action}</div> : null}
    </div>
  );
}
