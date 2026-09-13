import type { ReactNode } from "react";
import Button from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't complete this request. Please try again.",
  icon,
  actionLabel = "Try again",
  onAction,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={[
        "flex min-h-60 w-full flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-6 py-10 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        {icon ?? (
          <span className="text-lg font-bold" aria-hidden="true">
            !
          </span>
        )}
      </div>

      <h3 className="text-base font-semibold text-slate-900">{title}</h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {message}
      </p>

      {onAction && (
        <div className="mt-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
