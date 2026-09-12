export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  xs: "h-3 w-3 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-2",
  xl: "h-10 w-10 border-3",
};

export default function Spinner({
  size = "md",
  label = "Loading",
  className = "",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={[
        "inline-flex shrink-0 animate-spin rounded-full border-slate-300 border-t-slate-900",
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
