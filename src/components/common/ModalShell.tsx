import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../ui/utils";

interface ModalShellProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  maxWidth?: string | number;
  className?: string;
}

export function ModalShell({
  open,
  onClose,
  children,
  maxWidth = "var(--login-card-max-width, 42rem)",
  className,
}: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={() => onClose?.()}
      />
      <div className="relative z-10 flex h-full items-center justify-center p-4">
        <div
          className={cn("w-full", className)}
          style={{ maxWidth }}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
    ,
    document.body,
  );
}
