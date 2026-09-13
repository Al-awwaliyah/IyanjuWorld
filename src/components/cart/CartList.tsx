import type { ReactNode } from "react";
import CartItem, { type CartItemProps } from "./CartItem";
import EmptyState from "../ui/EmptyState";
import Skeleton from "../ui/Skeleton";
import { ShoppingCart } from "lucide-react";

export interface CartListProps {
  items: CartItemProps[];
  loading?: boolean;
  loadingCount?: number;
  emptyState?: ReactNode;
  className?: string;
}

function CartItemSkeleton() {
  return (
    <div className="flex gap-4 border-b border-slate-200 py-4 last:border-b-0">
      <Skeleton
        variant="rect"
        width="112px"
        height="112px"
        className="shrink-0 rounded-xl"
      />

      <div className="min-w-0 flex-1 space-y-3">
        <Skeleton
          variant="text"
          width="75%"
          height="18px"
        />

        <Skeleton
          variant="text"
          width="40%"
          height="14px"
        />

        <Skeleton
          variant="text"
          width="100px"
          height="18px"
        />

        <div className="flex items-center justify-between gap-3">
          <Skeleton
            variant="rect"
            width="112px"
            height="36px"
            className="rounded-lg"
          />

          <Skeleton
            variant="text"
            width="80px"
            height="18px"
          />
        </div>
      </div>
    </div>
  );
}

export default function CartList({
  items,
  loading = false,
  loadingCount = 3,
  emptyState,
  className = "",
}: CartListProps) {
  if (loading) {
    return (
      <div
        className={[
          "rounded-2xl border border-slate-200 bg-white px-4 sm:px-6",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {Array.from({ length: loadingCount }).map(
          (_, index) => (
            <CartItemSkeleton key={index} />
          ),
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        {emptyState ?? (
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Browse the marketplace and add products you want to purchase."
            actionLabel="Explore Products"
            actionHref="/explore"
          />
        )}
      </>
    );
  }

  return (
    <div
      className={[
        "rounded-2xl border border-slate-200 bg-white px-4 sm:px-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => (
        <CartItem
          key={item.id}
          {...item}
        />
      ))}
    </div>
  );
}
