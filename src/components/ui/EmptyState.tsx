import type { ReactNode } from "react";
import Button from "./Button";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = "primary",
  className = "",
}: EmptyStateProps) {
  const showAction = Boolean(actionLabel && onAction);

  return (
    <div
      className={[
        "flex min-h-60 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </div>
      )}

      <h3 className="text-base font-semibold text-slate-900">{title}</h3>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}

      {showAction && (
        <div className="mt-5">
          <Button
            type="button"
            variant={actionVariant}
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
