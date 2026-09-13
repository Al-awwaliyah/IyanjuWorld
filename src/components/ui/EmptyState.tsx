import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Button, { type ButtonProps } from "./Button";

export interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  action?: ReactNode;
  actionVariant?: ButtonProps["variant"];
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  action: customAction,
  actionVariant = "primary",
  className = "",
}: EmptyStateProps) {
  const action = actionLabel && (
    <Button
      type="button"
      variant={actionVariant}
      size="md"
      onClick={onAction}
    >
      {actionLabel}
    </Button>
  );

  return (
    <div
      className={[
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {typeof Icon === "function" ? (
            <Icon className="h-6 w-6" aria-hidden="true" />
          ) : (
            Icon
          )}
        </div>
      )}

      <h2 className="text-base font-semibold text-slate-900">
        {title}
      </h2>

      {description && (
        <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}

      {(actionLabel || customAction) && (
        <div className="mt-5">
          {customAction ?? (
            actionHref ? (
              <a href={actionHref}>{action}</a>
            ) : (
              action
            )
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
