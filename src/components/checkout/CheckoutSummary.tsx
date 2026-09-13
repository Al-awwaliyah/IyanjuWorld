import { Link } from "react-router-dom";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import Button from "../ui/Button";
import ProductImage from "../marketplace/ProductImage";
import { formatNaira } from "../../libs/format";

export interface CheckoutSummaryItem {
  id: string;
  productName: string;
  businessName?: string | null;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

export interface CheckoutSummaryProps {
  items: CheckoutSummaryItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency?: string;
  loading?: boolean;
  canPlaceOrder?: boolean;
  placingOrder?: boolean;
  placeOrderLabel?: string;
  onPlaceOrder?: () => void;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export default function CheckoutSummary({
  items,
  subtotal,
  deliveryFee,
  total,
  currency = "NGN",
  loading = false,
  canPlaceOrder = true,
  placingOrder = false,
  placeOrderLabel = "Place Order",
  onPlaceOrder,
  backHref = "/customer/cart",
  backLabel = "Back to Cart",
  className = "",
}: CheckoutSummaryProps) {
  const formatAmount = (amount: number) =>
    currency === "NGN"
      ? formatNaira(amount)
      : new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(amount);

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">
          Order Summary
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Review your order before placing it.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const lineTotal =
            item.lineTotal ??
            item.unitPrice * item.quantity;

          return (
            <div
              key={item.id}
              className="flex gap-3"
            >
              <ProductImage
                src={item.imageUrl}
                alt={item.productName}
                aspectRatio="square"
                className="h-16 w-16 shrink-0 rounded-xl"
                imageClassName="rounded-xl"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item.productName}
                </p>

                {item.businessName && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {item.businessName}
                  </p>
                )}

                <p className="mt-1 text-xs text-slate-500">
                  {item.quantity} ×{" "}
                  {formatAmount(item.unitPrice)}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {formatAmount(lineTotal)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="my-5 border-t border-slate-100" />

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">
            Subtotal
          </span>

          <span className="font-medium text-slate-900">
            {formatAmount(subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">
            Delivery fee
          </span>

          <span className="font-medium text-slate-900">
            {formatAmount(deliveryFee)}
          </span>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-900">
              Total
            </span>

            <span className="text-lg font-bold text-slate-900">
              {formatAmount(total)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-600"
            aria-hidden="true"
          />

          <p className="text-xs leading-5 text-slate-600">
            Your payment is processed securely. Your
            order is only confirmed after successful
            payment verification.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {onPlaceOrder ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            loading={placingOrder || loading}
            disabled={
              !canPlaceOrder ||
              loading ||
              placingOrder
            }
            onClick={onPlaceOrder}
          >
            <CheckCircle2
              className="h-4 w-4"
              aria-hidden="true"
            />
            {placeOrderLabel}
          </Button>
        ) : null}

        <Link
          to={backHref}
          className="block text-center text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
