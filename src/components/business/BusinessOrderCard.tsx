import {
  ChevronRight,
  Clock3,
  MapPin,
  Package,
  UserRound,
  Wallet,
} from "lucide-react";
import Badge, {
  type BadgeProps,
} from "../ui/Badge";
import Button from "../ui/Button";
import ProductImage from "../marketplace/ProductImage";
import ProductPrice from "../marketplace/ProductPrice";
import { formatDateTime, formatNaira } from "../../libs/format";

export type BusinessOrderStatus =
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

export type BusinessPaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "partially_refunded"
  | "refunded";

export interface BusinessOrderItem {
  id: string;
  productId?: string | null;
  productName: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BusinessOrderCardProps {
  id: string;
  orderReference: string;
  customerName: string;
  customerAvatarUrl?: string | null;
  customerPhone?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  items: BusinessOrderItem[];
  status: BusinessOrderStatus;
  paymentStatus: BusinessPaymentStatus;
  subtotal: number;
  deliveryFee: number;
  customerTotal: number;
  businessEarnings?: number | null;
  currency?: string;
  createdAt: string;
  updatedAt?: string | null;
  riderName?: string | null;
  deliveryDistanceKm?: number | null;
  href?: string;
  loading?: boolean;
  actionLabel?: string;
  showCustomerPhone?: boolean;
  showDeliveryDetails?: boolean;
  onView?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onMarkReady?: () => void;
  onMarkPickedUp?: () => void;
  className?: string;
}

const statusLabels: Record<
  BusinessOrderStatus,
  string
> = {
  pending_payment: "Payment pending",
  paid: "Paid",
  business_confirmed: "Confirmed",
  delivery_requested: "Delivery requested",
  rider_assigned: "Rider assigned",
  picked_up: "Picked up",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refund_pending: "Refund pending",
  refunded: "Refunded",
  disputed: "Disputed",
};

const statusVariants: Record<
  BusinessOrderStatus,
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
  refunded: "neutral",
  disputed: "danger",
};

const paymentLabels: Record<
  BusinessPaymentStatus,
  string
> = {
  unpaid: "Unpaid",
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
};

const paymentVariants: Record<
  BusinessPaymentStatus,
  BadgeProps["variant"]
> = {
  unpaid: "warning",
  pending: "warning",
  paid: "success",
  failed: "danger",
  partially_refunded: "warning",
  refunded: "neutral",
};

function getPrimaryAction(
  status: BusinessOrderStatus,
) {
  if (status === "paid") {
    return "Confirm order";
  }

  if (
    status ===
    "business_confirmed"
  ) {
    return "Mark ready";
  }

  return null;
}

function getInitials(
  name: string,
) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "C";
  }

  return parts
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase() ||
        "",
    )
    .join("");
}

function CustomerAvatar({
  name,
  src,
}: {
  name: string;
  src?: string | null;
}) {
  const [imageFailed, setImageFailed] =
    React.useState(false);

  if (!src || imageFailed) {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600"
        aria-hidden="true"
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="h-10 w-10 shrink-0 rounded-full object-cover"
      onError={() =>
        setImageFailed(true)
      }
    />
  );
}

export default function BusinessOrderCard({
  id,
  orderReference,
  customerName,
  customerAvatarUrl,
  customerPhone,
  customerCity,
  customerState,
  items,
  status,
  paymentStatus,
  subtotal,
  deliveryFee,
  customerTotal,
  businessEarnings,
  currency = "NGN",
  createdAt,
  updatedAt,
  riderName,
  deliveryDistanceKm,
  href,
  loading = false,
  actionLabel,
  showCustomerPhone = false,
  showDeliveryDetails = true,
  onView,
  onConfirm,
  onCancel,
  onMarkReady,
  onMarkPickedUp,
  className = "",
}: BusinessOrderCardProps) {
  const primaryAction =
    getPrimaryAction(status);

  const itemCount = items.reduce(
    (total, item) =>
      total + item.quantity,
    0,
  );

  const visibleItems =
    items.slice(0, 3);

  const remainingItems =
    Math.max(
      items.length -
        visibleItems.length,
      0,
    );

  const viewAction = () => {
    if (onView) {
      onView();
      return;
    }

    if (href) {
      window.location.assign(href);
    }
  };

  const handlePrimaryAction = () => {
    if (
      status === "paid" &&
      onConfirm
    ) {
      onConfirm();
      return;
    }

    if (
      status ===
        "business_confirmed" &&
      onMarkReady
    ) {
      onMarkReady();
    }
  };

  const canCancel =
    Boolean(onCancel) &&
    ![
      "cancelled",
      "delivered",
      "completed",
      "refunded",
    ].includes(status);

  const canMarkPickedUp =
    status ===
      "rider_assigned" &&
    Boolean(onMarkPickedUp);

  return (
    <article
      className={[
        "rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-sm",
        loading
          ? "opacity-70"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-busy={loading}
    >
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <CustomerAvatar
              name={customerName}
              src={customerAvatarUrl}
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-slate-900">
                  {customerName}
                </h3>

                <Badge
                  variant={
                    statusVariants[
                      status
                    ]
                  }
                  size="sm"
                >
                  {
                    statusLabels[
                      status
                    ]
                  }
                </Badge>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>
                  {orderReference}
                </span>

                <span className="inline-flex items-center gap-1">
                  <Clock3
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  {formatDateTime(
                    createdAt,
                  )}
                </span>
              </div>
            </div>
          </div>

          <Badge
            variant={
              paymentVariants[
                paymentStatus
              ]
            }
            size="sm"
          >
            {
              paymentLabels[
                paymentStatus
              ]
            }
          </Badge>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="space-y-3">
          {visibleItems.map(
            (item) => (
              <div
                key={item.id}
                className="flex items-center gap-3"
              >
                <ProductImage
                  src={item.imageUrl}
                  alt={item.productName}
                  aspectRatio="square"
                  className="h-12 w-12 shrink-0"
                  imageClassName="rounded-xl"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {item.productName}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Qty: {item.quantity}
                  </p>
                </div>

                <ProductPrice
                  price={item.lineTotal}
                  currency={currency}
                  size="sm"
                  showDiscount={false}
                />
              </div>
            ),
          )}
        </div>

        {remainingItems > 0 && (
          <p className="mt-3 text-xs font-medium text-slate-500">
            + {remainingItems} more{" "}
            {remainingItems === 1
              ? "product"
              : "products"}
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <Package
                className="h-4 w-4 text-slate-400"
                aria-hidden="true"
              />

              <span className="text-xs text-slate-500">
                Items
              </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {itemCount}{" "}
              {itemCount === 1
                ? "item"
                : "items"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <Wallet
                className="h-4 w-4 text-slate-400"
                aria-hidden="true"
              />

              <span className="text-xs text-slate-500">
                Customer total
              </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatNaira(
                customerTotal,
                currency,
              )}
            </p>
          </div>
        </div>

        {showDeliveryDetails && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-white">
            <div className="flex flex-wrap items-start gap-3 p-3">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500">
                  Delivery
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {customerCity &&
                  customerState
                    ? `${customerCity}, ${customerState}`
                    : "Delivery address available in order details"}
                </p>

                {riderName && (
                  <p className="mt-1 text-xs text-slate-500">
                    Rider:{" "}
                    <span className="font-medium text-slate-700">
                      {riderName}
                    </span>
                  </p>
                )}

                {deliveryDistanceKm !==
                  null &&
                  deliveryDistanceKm !==
                    undefined && (
                    <p className="mt-1 text-xs text-slate-500">
                      Distance:{" "}
                      {deliveryDistanceKm.toFixed(
                        1,
                      )}{" "}
                      km
                    </p>
                  )}
              </div>
            </div>
          </div>
        )}

        {(showCustomerPhone &&
          customerPhone) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <UserRound
              className="h-4 w-4"
              aria-hidden="true"
            />
            <span>
              Customer phone:{" "}
              <span className="font-medium text-slate-700">
                {customerPhone}
              </span>
            </span>
          </div>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex gap-4">
                <span>
                  Subtotal
                </span>

                <span className="font-medium text-slate-700">
                  {formatNaira(
                    subtotal,
                    currency,
                  )}
                </span>
              </div>

              <div className="flex gap-4">
                <span>
                  Delivery
                </span>

                <span className="font-medium text-slate-700">
                  {formatNaira(
                    deliveryFee,
                    currency,
                  )}
                </span>
              </div>

              {businessEarnings !==
                null &&
                businessEarnings !==
                  undefined && (
                  <div className="flex gap-4 pt-1">
                    <span>
                      Your earnings
                    </span>

                    <span className="font-semibold text-slate-900">
                      {formatNaira(
                        businessEarnings,
                        currency,
                      )}
                    </span>
                  </div>
                )}
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-500">
                Order total
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatNaira(
                  customerTotal,
                  currency,
                )}
              </p>
            </div>
          </div>
        </div>

        {updatedAt &&
          updatedAt !==
            createdAt && (
            <p className="mt-3 text-right text-[11px] text-slate-400">
              Updated{" "}
              {formatDateTime(
                updatedAt,
              )}
            </p>
          )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {primaryAction &&
              (onConfirm ||
                onMarkReady) && (
                <Button
                  type="button"
                  size="sm"
                  onClick={
                    handlePrimaryAction
                  }
                  disabled={
                    loading
                  }
                >
                  {primaryAction}
                </Button>
              )}

            {canMarkPickedUp && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={
                  onMarkPickedUp
                }
                disabled={
                  loading
                }
              >
                Mark picked up
              </Button>
            )}

            {canCancel && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onCancel}
                disabled={
                  loading
                }
              >
                Cancel
              </Button>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={viewAction}
            disabled={
              loading ||
              (!onView && !href)
            }
          >
            {actionLabel ||
              "View order"}
            <ChevronRight
              className="h-4 w-4"
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>
    </article>
  );
}
