import {
  ArrowRight,
  Clock3,
  MapPin,
  Navigation,
  Package,
  Phone,
  UserRound,
  Wallet,
} from "lucide-react";

import Badge, {
  type BadgeProps,
} from "../ui/Badge";
import Button from "../ui/Button";
import ProductImage from "../marketplace/ProductImage";
import {
  formatDateTime,
  formatNaira,
} from "../../libs/format";

export type DeliveryRequestStatus =
  | "pending"
  | "accepted"
  | "expired"
  | "cancelled";

export interface DeliveryRequestItem {
  id: string;
  productName: string;
  quantity: number;
  imageUrl?: string | null;
}

export interface DeliveryRequestCardProps {
  id: string;
  orderId: string;
  orderReference: string;
  status?: DeliveryRequestStatus;
  businessName: string;
  businessPhone?: string | null;
  pickupAddress: string;
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress: string;
  deliveryFee: number;
  riderEarnings: number;
  distanceKm?: number | null;
  estimatedMinutes?: number | null;
  items?: DeliveryRequestItem[];
  requestedAt: string;
  expiresAt?: string | null;
  currency?: string;
  accepting?: boolean;
  disabled?: boolean;
  onAccept?: () => void;
  onViewOrder?: () => void;
  onNavigateToPickup?: () => void;
  className?: string;
}

const statusConfig: Record<
  DeliveryRequestStatus,
  {
    label: string;
    variant: BadgeProps["variant"];
  }
> = {
  pending: {
    label: "New request",
    variant: "warning",
  },
  accepted: {
    label: "Accepted",
    variant: "success",
  },
  expired: {
    label: "Expired",
    variant: "neutral",
  },
  cancelled: {
    label: "Cancelled",
    variant: "danger",
  },
};

function formatDistance(
  distanceKm?: number | null,
) {
  if (
    distanceKm === null ||
    distanceKm === undefined
  ) {
    return null;
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

export default function DeliveryRequestCard({
  orderId,
  orderReference,
  status = "pending",
  businessName,
  businessPhone,
  pickupAddress,
  customerName,
  customerPhone,
  deliveryAddress,
  deliveryFee,
  riderEarnings,
  distanceKm,
  estimatedMinutes,
  items = [],
  requestedAt,
  expiresAt,
  currency = "NGN",
  accepting = false,
  disabled = false,
  onAccept,
  onViewOrder,
  onNavigateToPickup,
  className = "",
}: DeliveryRequestCardProps) {
  const statusInfo = statusConfig[status];
  const distanceLabel =
    formatDistance(distanceKm);

  const canAccept =
    status === "pending" &&
    Boolean(onAccept) &&
    !disabled &&
    !accepting;

  return (
    <article
      className={[
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {orderReference}
              </h3>

              <Badge
                variant={statusInfo.variant}
                size="sm"
              >
                {statusInfo.label}
              </Badge>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Delivery request received{" "}
              {formatDateTime(requestedAt)}
            </p>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Your earnings
              </p>

              <p className="mt-0.5 text-base font-bold text-slate-900">
                {formatNaira(
                  riderEarnings,
                  currency,
                )}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Package
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">
                  Pickup from
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {businessName}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {pickupAddress}
                </p>

                {businessPhone && (
                  <a
                    href={`tel:${businessPhone}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900"
                  >
                    <Phone
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Call business
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
              <ArrowRight
                className="h-4 w-4 rotate-90"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <MapPin
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">
                  Deliver to
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {customerName}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {deliveryAddress}
                </p>

                {customerPhone && (
                  <a
                    href={`tel:${customerPhone}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900"
                  >
                    <Phone
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Call customer
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Delivery details
              </h4>

              {distanceLabel && (
                <Badge
                  variant="neutral"
                  size="sm"
                >
                  {distanceLabel}
                </Badge>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-slate-500">
                  Delivery fee
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {formatNaira(
                    deliveryFee,
                    currency,
                  )}
                </p>
              </div>

              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-slate-500">
                  Your earnings
                </p>

                <p className="mt-1 text-sm font-bold text-emerald-700">
                  {formatNaira(
                    riderEarnings,
                    currency,
                  )}
                </p>
              </div>
            </div>

            {(estimatedMinutes !==
              null &&
              estimatedMinutes !==
                undefined) && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Clock3
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Estimated delivery time:{" "}
                <span className="font-medium text-slate-700">
                  {estimatedMinutes} min
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Package
                className="h-4 w-4 text-slate-500"
                aria-hidden="true"
              />

              <h4 className="text-sm font-semibold text-slate-900">
                Order items
              </h4>
            </div>

            {items.length > 0 ? (
              <div className="mt-3 space-y-3">
                {items
                  .slice(0, 4)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3"
                    >
                      <ProductImage
                        src={item.imageUrl}
                        alt={item.productName}
                        aspectRatio="square"
                        className="h-10 w-10 shrink-0"
                        imageClassName="rounded-lg"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-900">
                          {item.productName}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}

                {items.length > 4 && (
                  <p className="pt-1 text-xs text-slate-500">
                    +{items.length - 4} more item
                    {items.length - 4 === 1
                      ? ""
                      : "s"}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                Order item details are available when
                you open the order.
              </p>
            )}
          </div>
        </div>
      </div>

      {expiresAt &&
        status === "pending" && (
          <div className="border-t border-amber-100 bg-amber-50 px-4 py-3 sm:px-5">
            <div className="flex items-start gap-2">
              <Clock3
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                aria-hidden="true"
              />

              <p className="text-xs leading-5 text-amber-800">
                This request may become unavailable
                after{" "}
                <span className="font-semibold">
                  {formatDateTime(expiresAt)}
                </span>
                .
              </p>
            </div>
          </div>
        )}

      <div className="flex flex-col gap-2 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex flex-wrap gap-2">
          {onNavigateToPickup && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={onNavigateToPickup}
            >
              <Navigation
                className="h-4 w-4"
                aria-hidden="true"
              />
              Navigate
            </Button>
          )}

          {onViewOrder && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={onViewOrder}
            >
              View order
            </Button>
          )}
        </div>

        {status === "pending" &&
          onAccept && (
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={accepting}
              disabled={!canAccept}
              onClick={onAccept}
            >
              Accept delivery
              <ArrowRight
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Button>
          )}

        {status === "accepted" && (
          <Badge
            variant="success"
            size="md"
          >
            Delivery accepted
          </Badge>
        )}
      </div>

      {status === "pending" && (
        <div className="hidden">
          <UserRound aria-hidden="true" />
        </div>
      )}
    </article>
  );
}
