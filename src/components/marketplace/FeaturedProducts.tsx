import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import ProductGrid from "./ProductGrid";
import type { ProductCardProps } from "./ProductCard";

export interface FeaturedProductsProps {
  products: ProductCardProps[];
  title?: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  loading?: boolean;
  loadingCount?: number;
  emptyState?: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export default function FeaturedProducts({
  products,
  title = "Featured Products",
  description = "Discover popular products from businesses on IyanjuWorld.",
  viewAllHref = "/explore",
  viewAllLabel = "View all",
  loading = false,
  loadingCount = 8,
  emptyState,
  columns = 4,
  className = "",
}: FeaturedProductsProps) {
  return (
    <section
      className={[
        "space-y-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h2>

          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>

        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="shrink-0 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            {viewAllLabel}
            <span aria-hidden="true"> →</span>
          </Link>
        )}
      </div>

      <ProductGrid
        products={products}
        columns={columns}
        loading={loading}
        loadingCount={loadingCount}
        emptyState={emptyState}
      />
    </section>
  );
}
