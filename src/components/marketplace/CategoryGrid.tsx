import type { ReactNode } from "react";
import CategoryCard, { type CategoryCardProps } from "./CategoryCard";

export interface CategoryGridProps {
  categories: CategoryCardProps[];
  columns?: 2 | 3 | 4 | 5 | 6;
  emptyState?: ReactNode;
  className?: string;
}

const columnStyles: Record<
  NonNullable<CategoryGridProps["columns"]>,
  string
> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
};

export default function CategoryGrid({
  categories,
  columns = 4,
  emptyState,
  className = "",
}: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <>
        {emptyState ?? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
            No categories available.
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
      {categories.map((category) => (
        <CategoryCard
          key={category.slug}
          {...category}
        />
      ))}
    </div>
  );
}
