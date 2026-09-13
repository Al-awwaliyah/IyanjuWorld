import {
  ArrowRight,
  Clock3,
  Package,
  Store,
} from "lucide-react";
import { Link } from "react-router-dom";
import Badge, {
  type BadgeProps,
} from "../ui/Badge";
import ProductImage from "../marketplace/ProductImage";
import { formatNaira, formatDate } from "../../libs/format";

export type OrderCardStatus =
  | "pending_payment"
  | "paid"
  | "business_confirmed"
  | "delivery_requested"
  | "rider_assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refund_pending"
  | "refunded"
  | "disputed";

export interface OrderCardItem {
  id: string;
  productName: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

export interface OrderCardProps {
  id: string;
  orderReference: string;
  businessName?: string | null;
  businessSlug?: string | null;
  status: OrderCardStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  items?: OrderCardItem[];
  currency?: string;
  href?: string;
  showBusiness?: boolean;
  className?: string;
}

const statusLabels: Record<
  OrderCardStatus,
  string
> = {
  pending_payment: "Payment Pending",
  paid: "Paid",
  business_confirmed: "Confirmed",
  delivery_requested: "Delivery Requested",
  rider_assigned: "Rider Assigned",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refund_pending: "Refund Pending",
  refunded: "Refunded",
  disputed: "Disputed",
};

const statusVariants: Record<
  OrderCardStatus,
  BadgeProps["variant"]
> = {
  pending_payment: "warning",
  paid: "info",
  business_confirmed: "info",
  delivery_requested: "warning",
  rider_assigned: "info",
  picked_up: "info",
  out_for_delivery: "info",
  delivered: "success",
  completed: "success",
  cancelled: "danger",
  refund_pending: "warning",
  refunded: "success",
  disputed: "danger",
};

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

export default function OrderCard({
  id,
  orderReference,
  businessName,
  businessSlug,
  status,
  subtotal,
  deliveryFee,
  total,
  createdAt,
  items = [],
  currency = "NGN",
  href,
  showBusiness = true,
  className = "",
}: OrderCardProps) {
  const orderHref =
    href || `/customer/orders/${id}`;

  const previewItems = items.slice(0, 3);
  const remainingCount = Math.max(
    items.length - previewItems.length,
    0,
  );

  return (
    <article
      className={[
        "rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm sm:p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Package
              className="h-4 w-4 shrink-0 text-slate-500"
              aria-hidden="true"
            />

            <span className="text-sm font-semibold text-slate-900">
              {orderReference}
            </span>

            <Badge
              variant={statusVariants[status]}
              size="sm"
            >
              {statusLabels[status]}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock3
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
              {formatDate(createdAt)}
            </span>

            {showBusiness &&
              businessName && (
                <span className="inline-flex items-center gap-1">
                  <Store
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />

                  {businessSlug ? (
                    <Link
                      to={`/businesses/${businessSlug}`}
                      className="truncate hover:text-slate-900"
                    >
                      {businessName}
                    </Link>
                  ) : (
                    <span className="truncate">
                      {businessName}
                    </span>
                  )}
                </span>
              )}
          </div>
        </div>

        <Link
          to={orderHref}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950"
        >
          View Order
          <ArrowRight
            className="h-4 w-4"
            aria-hidden="true"
          />
        </Link>
      </div>

      {previewItems.length > 0 && (
        <div className="mt-4 space-y-3">
          {previewItems.map((item) => {
            const lineTotal =
              item.lineTotal ??
              item.unitPrice * item.quantity;

            return (
              <div
                key={item.id}
                className="flex items-center gap-3"
              >
                <ProductImage
                  src={item.imageUrl}
                  alt={item.productName}
                  aspectRatio="square"
                  className="h-12 w-12 shrink-0 rounded-lg"
                  imageClassName="rounded-lg"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {item.productName}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Qty {item.quantity} ×{" "}
                    {formatAmount(
                      item.unitPrice,
                      currency,
                    )}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold text-slate-900">
                  {formatAmount(
                    lineTotal,
                    currency,
                  )}
                </p>
              </div>
            );
          })}

          {remainingCount > 0 && (
            <p className="text-xs font-medium text-slate-500">
              +{remainingCount} more{" "}
              {remainingCount === 1
                ? "item"
                : "items"}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-slate-500">
            Subtotal
          </span>

          <span className="text-slate-700">
            {formatAmount(
              subtotal,
              currency,
            )}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-4 text-sm">
          <span className="text-slate-500">
            Delivery
          </span>

          <span className="text-slate-700">
            {formatAmount(
              deliveryFee,
              currency,
            )}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
          <span className="font-semibold text-slate-900">
            Total
          </span>

          <span className="text-base font-bold text-slate-900">
            {formatAmount(total, currency)}
          </span>
        </div>
      </div>
    </article>
  );
}
