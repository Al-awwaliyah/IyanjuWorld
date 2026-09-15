import type { ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  primary: "bg-ink-900 text-white",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-brand-50 text-brand-700",
  neutral: "bg-slate-50 text-slate-600",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-500",
  primary: "bg-ink-900",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-brand-500",
  neutral: "bg-slate-400",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "min-h-6 px-2 text-xs",
  md: "min-h-7 px-2.5 text-xs",
  lg: "min-h-8 px-3 text-sm",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotStyles[variant]}`}
        />
      )}

      {children}
    </span>
  );
}

export default Badge;
