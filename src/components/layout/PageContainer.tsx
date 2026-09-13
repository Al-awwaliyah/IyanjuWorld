import type { ReactNode } from "react";

export interface PageContainerProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  title?: string;
  description?: string;
}

const sizeStyles: Record<
  NonNullable<PageContainerProps["size"]>,
  string
> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

export default function PageContainer({
  children,
  size = "xl",
  className = "",
  title,
  description,
}: PageContainerProps) {
  return (
    <div
      className={[
        "mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {(title || description) && (
        <header className="mb-6">
          {title && (
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}

export { PageContainer };
