import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  Package,
  Phone,
  UserRound,
} from "lucide-react";

import Badge, {
  type BadgeProps,
} from "../ui/Badge";
import Button from "../ui/Button";
import ProductImage from "../marketplace/ProductImage";
import OrderStatus, {
  type OrderStatusValue,
} from "../orders/OrderStatus";
import {
  formatDateTime,
  formatNaira,
} from "../../libs/format";

export type ActiveDeliveryStage =
  | "rider_assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered";

export interface ActiveDeliveryItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string | null;
}

export interface ActiveDeliveryProps {
  orderId: string;
  orderReference: string;

  stage: ActiveDeliveryStage;

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

  items?: ActiveDeliveryItem[];

  assignedAt?: string | null;
  pickedUpAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;

  currency?: string;

  loading?: boolean;
  error?: string | null;

  onConfirmPickup?: () => void;
  onStartDelivery?: () => void;
  onConfirmDelivery?: () => void;
  onCallCustomer?: () => void;
  onCallBusiness?: () => void;
  onNavigateToPickup?: () => void;
  onNavigateToCustomer?: () => void;
  onViewOrder?: () => void;

  showEarnings?: boolean;
  showItems?: boolean;
  showCustomerContact?: boolean;
  showBusinessContact?: boolean;

  className?: string;
}

interface StageConfig {
  label: string;
  description: string;
  variant: BadgeProps["variant"];
}

const STAGE_CONFIG: Record<
  ActiveDeliveryStage,
  StageConfig
> = {
  rider_assigned: {
    label: "Assigned",
    description:
      "Proceed to the business for pickup.",
    variant: "info",
  },

  picked_up: {
    label: "Picked Up",
    description:
      "The order has been collected from the business.",
    variant: "warning",
  },

  out_for_delivery: {
    label: "Out for Delivery",
    description:
      "The order is on the way to the customer.",
    variant: "warning",
  },

  delivered: {
    label: "Delivered",
    description:
      "The order has been delivered to the customer.",
    variant: "success",
  },
};

function getOrderStatus(
  stage: ActiveDeliveryStage,
): OrderStatusValue {
  switch (stage) {
    case "rider_assigned":
      return "rider_assigned";

    case "picked_up":
      return "picked_up";

    case "out_for_delivery":
      return "out_for_delivery";

    case "delivered":
      return "delivered";
  }
}

function normalizePhone(
  phone?: string | null,
) {
  if (!phone) {
    return null;
  }

  const cleaned = phone.replace(
    /[^\d+]/g,
    "",
  );

  if (cleaned.startsWith("0")) {
    return `+234${cleaned.slice(1)}`;
  }

  if (
    cleaned.startsWith("234") &&
    !cleaned.startsWith("+234")
  ) {
    return `+${cleaned}`;
  }

  return cleaned;
}

function getPrimaryAction(
  stage: ActiveDeliveryStage,
  onConfirmPickup?: () => void,
  onStartDelivery?: () => void,
  onConfirmDelivery?: () => void,
) {
  if (stage === "rider_assigned") {
    return {
      label: "Confirm Pickup",
      action: onConfirmPickup,
    };
  }

  if (stage === "picked_up") {
    return {
      label: "Start Delivery",
      action: onStartDelivery,
    };
  }

  if (stage === "out_for_delivery") {
    return {
      label: "Confirm Delivery",
      action: onConfirmDelivery,
    };
  }

  return null;
}

export default function ActiveDelivery({
  orderId,
  orderReference,
  stage,
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
  assignedAt = null,
  pickedUpAt = null,
  outForDeliveryAt = null,
  deliveredAt = null,
  currency = "NGN",
  loading = false,
  error = null,
  onConfirmPickup,
  onStartDelivery,
  onConfirmDelivery,
  onCallCustomer,
  onCallBusiness,
  onNavigateToPickup,
  onNavigateToCustomer,
  onViewOrder,
  showEarnings = true,
  showItems = true,
  showCustomerContact = true,
  showBusinessContact = true,
  className = "",
}: ActiveDeliveryProps) {
  const stageConfig = STAGE_CONFIG[stage];

  const primaryAction = getPrimaryAction(
    stage,
    onConfirmPickup,
    onStartDelivery,
    onConfirmDelivery,
  );

  const normalizedCustomerPhone =
    normalizePhone(customerPhone);

  const normalizedBusinessPhone =
    normalizePhone(businessPhone);

  const orderStatus =
    getOrderStatus(stage);

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Active delivery"
    >
      <div className="border-b border-slate-100 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                Active Delivery
              </h2>

              <Badge
                variant={stageConfig.variant}
                size="sm"
                dot
              >
                {stageConfig.label}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Order {orderReference}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {stageConfig.description}
            </p>
          </div>

          {onViewOrder && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onViewOrder}
            >
              View Order
              <ExternalLink
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Button>
          )}
        </div>

        {error && (
          <div
            className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                <MapPin
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pickup
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {businessName}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {pickupAddress}
                </p>

                {showBusinessContact &&
                  normalizedBusinessPhone && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {onCallBusiness ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={onCallBusiness}
                        >
                          <Phone
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          Call Business
                        </Button>
                      ) : (
                        <a
                          href={`tel:${normalizedBusinessPhone}`}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <Phone
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          Call Business
                        </a>
                      )}
                    </div>
                  )}

                {onNavigateToPickup && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={
                      onNavigateToPickup
                    }
                  >
                    <Navigation
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    Navigate to Pickup
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <ArrowRight
              className="h-5 w-5 text-slate-300"
              aria-hidden="true"
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                <UserRound
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Delivery
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {customerName}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {deliveryAddress}
                </p>

                {showCustomerContact &&
                  normalizedCustomerPhone && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {onCallCustomer ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={onCallCustomer}
                        >
                          <Phone
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          Call Customer
                        </Button>
                      ) : (
                        <a
                          href={`tel:${normalizedCustomerPhone}`}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <Phone
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          Call Customer
                        </a>
                      )}
                    </div>
                  )}

                {onNavigateToCustomer && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={
                      onNavigateToCustomer
                    }
                  >
                    <Navigation
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    Navigate to Customer
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Delivery Fee
            </p>

            <p className="mt-1 text-base font-semibold text-slate-900">
              {formatNaira(
                deliveryFee,
                currency,
              )}
            </p>
          </div>

          {showEarnings && (
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Rider Earnings
              </p>

              <p className="mt-1 text-base font-semibold text-slate-900">
                {formatNaira(
                  riderEarnings,
                  currency,
                )}
              </p>
            </div>
          )}

          {distanceKm != null && (
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Distance
              </p>

              <p className="mt-1 text-base font-semibold text-slate-900">
                {distanceKm.toFixed(1)} km
              </p>
            </div>
          )}

          {estimatedMinutes != null && (
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Estimated Time
              </p>

              <p className="mt-1 text-base font-semibold text-slate-900">
                {estimatedMinutes} min
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <OrderStatus
            status={orderStatus}
            compact={false}
          />
        </div>

        {showItems && items.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Order Items
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  {items.length}{" "}
                  {items.length === 1
                    ? "item"
                    : "items"}
                </p>
              </div>

              <Package
                className="h-5 w-5 text-slate-400"
                aria-hidden="true"
              />
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.productName}
                    aspectRatio="square"
                    className="h-12 w-12 shrink-0"
                    imageClassName="rounded-lg"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.productName}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Qty {item.quantity} ×{" "}
                      {formatNaira(
                        item.unitPrice,
                        currency,
                      )}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {formatNaira(
                      item.lineTotal,
                      currency,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {assignedAt && (
              <div className="flex items-center gap-3">
                <Clock3
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-xs text-slate-400">
                    Assigned
                  </p>

                  <p className="text-sm text-slate-700">
                    {formatDateTime(
                      assignedAt,
                    )}
                  </p>
                </div>
              </div>
            )}

            {pickedUpAt && (
              <div className="flex items-center gap-3">
                <Package
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-xs text-slate-400">
                    Picked Up
                  </p>

                  <p className="text-sm text-slate-700">
                    {formatDateTime(
                      pickedUpAt,
                    )}
                  </p>
                </div>
              </div>
            )}

            {outForDeliveryAt && (
              <div className="flex items-center gap-3">
                <Navigation
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-xs text-slate-400">
                    Out for Delivery
                  </p>

                  <p className="text-sm text-slate-700">
                    {formatDateTime(
                      outForDeliveryAt,
                    )}
                  </p>
                </div>
              </div>
            )}

            {deliveredAt && (
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className="h-4 w-4 text-emerald-500"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-xs text-slate-400">
                    Delivered
                  </p>

                  <p className="text-sm text-slate-700">
                    {formatDateTime(
                      deliveredAt,
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {primaryAction &&
          primaryAction.action && (
            <div className="mt-6">
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading}
                onClick={
                  primaryAction.action
                }
              >
                {primaryAction.label}
                <ArrowRight
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </Button>
            </div>
          )}

        {stage === "delivered" && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <CheckCircle2
              className="h-5 w-5 shrink-0 text-emerald-600"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Delivery completed
              </p>

              <p className="mt-0.5 text-xs text-emerald-700">
                This delivery is no longer
                active.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
