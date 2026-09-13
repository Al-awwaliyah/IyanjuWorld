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
        "group flex flex-col items-center gap-2 rounded-lg border border-slate-100 bg-white p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-50 sm:h-20 sm:w-20">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <span className="text-2xl font-semibold text-brand-600">
            {icon ?? name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <h3 className="line-clamp-2 text-xs font-medium text-slate-700 group-hover:text-brand-600 sm:text-sm">
        {name}
      </h3>

      {productCount !== undefined && (
        <p className="text-[11px] text-slate-400">
          {productCount.toLocaleString()}{" "}
          {productCount === 1 ? "product" : "products"}
        </p>
      )}
    </Link>
  );
}
