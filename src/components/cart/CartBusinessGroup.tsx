import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import CartItem, { type CartItemProps } from "./CartItem";

export interface CartBusinessGroupProps {
  businessName: string;
  businessSlug?: string | null;
  items: CartItemProps[];
  subtotal?: number;
  currency?: string;
  headerAction?: ReactNode;
  className?: string;
}

function formatCurrency(
  amount: number,
  currency = "NGN",
) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CartBusinessGroup({
  businessName,
  businessSlug,
  items,
  subtotal,
  currency = "NGN",
  headerAction,
  className = "",
}: CartBusinessGroupProps) {
  const calculatedSubtotal = items.reduce(
    (total, item) =>
      total + item.unitPrice * item.quantity,
    0,
  );

  const resolvedSubtotal =
    subtotal !== undefined
      ? subtotal
      : calculatedSubtotal;

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border border-slate-200 bg-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Store
              className="h-5 w-5"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            {businessSlug ? (
              <Link
                to={`/businesses/${businessSlug}`}
                className="block truncate text-sm font-semibold text-slate-900 hover:text-slate-600"
              >
                {businessName}
              </Link>
            ) : (
              <h2 className="truncate text-sm font-semibold text-slate-900">
                {businessName}
              </h2>
            )}

            <p className="mt-0.5 text-xs text-slate-500">
              {items.length}{" "}
              {items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {headerAction && (
          <div className="shrink-0">
            {headerAction}
          </div>
        )}
      </header>

      <div className="px-4 sm:px-6">
        {items.map((item) => (
          <CartItem
            key={item.id}
            {...item}
          />
        ))}
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6">
        <span className="text-sm font-medium text-slate-600">
          Business subtotal
        </span>

        <span className="text-sm font-bold text-slate-900">
          {formatCurrency(
            resolvedSubtotal,
            currency,
          )}
        </span>
      </footer>
    </section>
  );
}
