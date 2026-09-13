import type { ReactNode } from "react";
import ProductCard, { type ProductCardProps } from "./ProductCard";
import Skeleton from "../ui/Skeleton";

export interface ProductGridProps {
  products: ProductCardProps[];
  columns?: 2 | 3 | 4 | 5 | 6;
  loading?: boolean;
  loadingCount?: number;
  emptyState?: ReactNode;
  className?: string;
}

const columnStyles: Record<
  NonNullable<ProductGridProps["columns"]>,
  string
> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
};

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Skeleton className="aspect-square w-full rounded-none" />

      <div className="space-y-3 p-4">
        <Skeleton variant="text" width="35%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="65%" />
        <div className="flex items-end justify-between gap-3 pt-1">
          <div className="space-y-2">
            <Skeleton variant="text" width="90px" height="20px" />
            <Skeleton variant="text" width="70px" height="14px" />
          </div>

          <Skeleton
            variant="rect"
            width="64px"
            height="36px"
          />
        </div>
      </div>
    </div>
  );
}

export default function ProductGrid({
  products,
  columns = 4,
  loading = false,
  loadingCount = 8,
  emptyState,
  className = "",
}: ProductGridProps) {
  if (loading) {
    return (
      <div
        className={[
          "grid gap-4 sm:gap-5",
          columnStyles[columns],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {Array.from({ length: loadingCount }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <>
        {emptyState ?? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No products found.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={[
        "grid gap-4 sm:gap-5",
        columnStyles[columns],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id ?? `${product.slug}-${product.businessName}`}
          {...product}
        />
      ))}
    </div>
  );
}
