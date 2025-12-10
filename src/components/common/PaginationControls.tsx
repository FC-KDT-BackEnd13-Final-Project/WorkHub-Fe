import { cn } from "../ui/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const buttonBaseClass =
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-8 rounded-md gap-1.5 px-3";

const defaultButtonClass =
  "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 has-[>svg]:px-2.5";

const navButtonClass =
  "bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 has-[>svg]:px-2.5";

const activeButtonClass = "bg-primary text-primary-foreground hover:bg-primary/90 has-[>svg]:px-2.5";

export function PaginationControls({ currentPage, totalPages, onPageChange, className }: PaginationControlsProps) {
  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(page, 1), totalPages);
    if (clamped === currentPage) return;
    onPageChange(clamped);
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <button
        type="button"
        className={cn(buttonBaseClass, navButtonClass)}
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            className={cn(buttonBaseClass, isActive ? activeButtonClass : defaultButtonClass)}
            onClick={() => goToPage(page)}
            aria-current={isActive ? "page" : undefined}
          >
            {page}
          </button>
        );
      })}
      <button
        type="button"
        className={cn(buttonBaseClass, navButtonClass)}
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
