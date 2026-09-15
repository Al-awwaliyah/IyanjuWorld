import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

export interface BackButtonProps {
  label?: string;
  className?: string;
}

export default function BackButton({
  label = "Back",
  className = "",
}: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <div className={["mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8", className].filter(Boolean).join(" ")}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="text-ink-900 hover:bg-brand-50 hover:text-brand-700"
        aria-label={label}
      >
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Button>
    </div>
  );
}
