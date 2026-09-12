export type SkeletonVariant = "text" | "circle" | "rect";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  className?: string;
}

export default function Skeleton({
  variant = "rect",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const variantStyles: Record<SkeletonVariant, string> = {
    text: "h-4 rounded-md",
    circle: "rounded-full",
    rect: "rounded-xl",
  };

  const style = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <span
      aria-hidden="true"
      className={[
        "block animate-pulse bg-slate-200",
        variantStyles[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    />
  );
}
