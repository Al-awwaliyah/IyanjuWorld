import {
  MapPin,
  Package,
  Store,
  Truck,
} from "lucide-react";
import { formatNaira } from "../../libs/format";
import Badge from "../ui/Badge";

export interface OrderSummaryProps {
  orderReference: string;
  businessName?: string | null;
  status?: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress?: string | null;
  itemCount?: number;
  currency?: string;
  showStatus?: boolean;
  className?: string;
}

function formatAmount(
  amount: number,
  currency = "NGN",
) {
  if (currency === "NGN") {
    return formatNaira(amount);
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusVariant(
  status: string,
): "default" | "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case "completed":
    case "delivered":
      return "success";

    case "cancelled":
    case "disputed":
      return "danger";

    case "pending_payment":
    case "delivery_requested":
    case "refund_pending":
      return "warning";

    case "paid":
    case "business_confirmed":
    case "rider_assigned":
    case "picked_up":
    case "out_for_delivery":
      return "info";

    case "refunded":
      return "success";

    default:
      return "neutral";
  }
}

function formatStatus(
  status?: string | null,
) {
  if (!status) {
    return "";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export default function OrderSummary({
  orderReference,
  businessName,
  status,
  subtotal,
  deliveryFee,
  total,
  deliveryAddress,
  itemCount,
  currency = "NGN",
  showStatus = true,
  className = "",
}: OrderSummaryProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package
              className="h-5 w-5 text-slate-600"
              aria-hidden="true"
            />

            <h2 className="text-lg font-bold text-slate-900">
              Order Summary
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {orderReference}
          </p>
        </div>

        {showStatus && status && (
          <Badge
            variant={getStatusVariant(status)}
            size="md"
          >
            {formatStatus(status)}
          </Badge>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {businessName && (
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-start gap-3">
              <Store
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="text-xs text-slate-500">
                  Business
                </p>

                <p className="mt-0.5 truncate text-sm font-medium text-slate-900">
                  {businessName}
                </p>
              </div>
            </div>
          </div>
        )}

        {itemCount !== undefined && (
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-start gap-3">
              <Package
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-slate-500">
                  Items
                </p>

                <p className="mt-0.5 text-sm font-medium text-slate-900">
                  {itemCount}{" "}
                  {itemCount === 1
                    ? "item"
                    : "items"}
                </p>
              </div>
            </div>
          </div>
        )}

        {deliveryAddress && (
          <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
            <div className="flex items-start gap-3">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="text-xs text-slate-500">
                  Delivery Address
                </p>

                <p className="mt-0.5 text-sm font-medium leading-5 text-slate-900">
                  {deliveryAddress}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-500">
              Subtotal
            </span>

            <span className="font-medium text-slate-900">
              {formatAmount(
                subtotal,
                currency,
              )}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <Truck
                className="h-4 w-4"
                aria-hidden="true"
              />
              Delivery
            </span>

            <span className="font-medium text-slate-900">
              {formatAmount(
                deliveryFee,
                currency,
              )}
            </span>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-900">
                Total
              </span>

              <span className="text-xl font-bold text-slate-900">
                {formatAmount(
                  total,
                  currency,
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
