import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

type BackDestination = number | string;

interface BackButtonProps {
  to?: BackDestination;
  label?: string;
  className?: string;
  onBeforeNavigate?: () => void;
}

export function BackButton({
  to = -1,
  label = "뒤로가기",
  className,
  onBeforeNavigate,
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    onBeforeNavigate?.();
    if (typeof to === "number") {
      navigate(to);
    } else {
      navigate(to);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:-translate-x-0.5 hover:bg-white focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none hover:text-primary",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="transition-colors hover:text-primary">{label}</span>
    </Button>
  );
}
