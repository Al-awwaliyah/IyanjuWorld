import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Button from "../ui/Button";

export interface CartSummaryProps {
  subtotal: number;
  itemCount?: number;
  currency?: string;
  checkoutHref?: string;
  checkoutLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  note?: string;
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

export default function CartSummary({
  subtotal,
  itemCount,
  currency = "NGN",
  checkoutHref = "/customer/checkout",
  checkoutLabel = "Proceed to Checkout",
  disabled = false,
  loading = false,
  note = "Delivery fee will be calculated during checkout based on your delivery location.",
  className = "",
}: CartSummaryProps) {
  return (
    <aside
      className={[
        "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h2 className="text-lg font-bold text-slate-900">
        Cart Summary
      </h2>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-slate-500">
            {itemCount !== undefined
              ? `${itemCount} ${
                  itemCount === 1 ? "item" : "items"
                }`
              : "Items"}
          </span>

          <span className="font-medium text-slate-900">
            {formatCurrency(subtotal, currency)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-slate-500">
            Delivery
          </span>

          <span className="font-medium text-slate-500">
            Calculated at checkout
          </span>
        </div>
      </div>

      <div className="my-5 border-t border-slate-200" />

      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-semibold text-slate-900">
          Subtotal
        </span>

        <span className="text-xl font-bold text-slate-900">
          {formatCurrency(subtotal, currency)}
        </span>
      </div>

      {note && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-xs leading-5 text-slate-500">
            {note}
          </p>
        </div>
      )}

      <div className="mt-5">
        {checkoutHref ? (
          <Link
            to={checkoutHref}
            className="block"
          >
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={disabled}
              loading={loading}
            >
              {checkoutLabel}
              {!loading && (
                <ArrowRight
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              )}
            </Button>
          </Link>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            disabled={disabled}
            loading={loading}
          >
            {checkoutLabel}
            {!loading && (
              <ArrowRight
                className="h-5 w-5"
                aria-hidden="true"
              />
            )}
          </Button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck
          className="h-4 w-4 text-emerald-600"
          aria-hidden="true"
        />
        Secure checkout
      </div>
    </aside>
  );
}
