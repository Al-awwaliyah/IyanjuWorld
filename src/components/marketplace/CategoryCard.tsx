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
      to={`/explore/${slug}`}
      className={[
        "group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            {icon ?? (
              <span className="text-3xl font-semibold">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </div>

      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-slate-900">
          {name}
        </h3>

        {productCount !== undefined && (
          <p className="mt-1 text-xs text-slate-500">
            {productCount.toLocaleString()}{" "}
            {productCount === 1 ? "product" : "products"}
          </p>
        )}
      </div>
    </Link>
  );
}
