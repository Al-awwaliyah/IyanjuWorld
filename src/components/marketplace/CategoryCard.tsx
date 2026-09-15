import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export interface CategoryCardProps {
  name: string;
  slug: string;
  imageUrl?: string | null;
  icon?: ReactNode;
  productCount?: number;
  className?: string;
}

export default function CategoryCard({
  name,
  slug,
  imageUrl,
  icon,
  productCount,
  className = "",
}: CategoryCardProps) {
  return (
    <Link
      to={`/category/${slug}`}
      className={[
        "group flex min-h-24 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-brand-600 sm:h-16 sm:w-16">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-lg font-bold">
            {icon ?? name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink-950 group-hover:text-brand-600 sm:text-base">
          {name}
        </h3>
        {productCount !== undefined && (
          <p className="mt-1 text-xs text-slate-500">
            {productCount.toLocaleString()} {productCount === 1 ? "product" : "products"}
          </p>
        )}
      </div>
    </Link>
  );
}
