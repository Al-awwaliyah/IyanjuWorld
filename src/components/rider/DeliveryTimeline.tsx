import {
  CheckCircle2,
  Circle,
  Clock3,
  MapPin,
  Package,
  Truck,
  UserRound,
} from "lucide-react";

import Badge, {
  type BadgeProps,
} from "../ui/Badge";
import {
  formatDateTime,
} from "../../libs/format";

export type DeliveryTimelineStatus =
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

export interface DeliveryTimelineItem {
  id: string;
  status: DeliveryTimelineStatus;
  label?: string;
  description?: string;
  createdAt: string;
  completed?: boolean;
  current?: boolean;
}

export interface DeliveryTimelineProps {
  items: DeliveryTimelineItem[];

  currentStatus?: DeliveryTimelineStatus;

  compact?: boolean;
  showDescriptions?: boolean;
  showDates?: boolean;

  className?: string;
}

interface StatusConfig {
  label: string;
  description: string;
  icon: typeof Circle;
  variant: BadgeProps["variant"];
}

const STATUS_CONFIG: Record<
  DeliveryTimelineStatus,
  StatusConfig
> = {
  pending_payment: {
    label: "Payment Pending",
    description:
      "Waiting for the customer's payment.",
    icon: Clock3,
    variant: "warning",
  },

  paid: {
    label: "Payment Confirmed",
    description:
      "Payment has been successfully confirmed.",
    icon: CheckCircle2,
    variant: "success",
  },

  business_confirmed: {
    label: "Business Confirmed",
    description:
      "The business has confirmed the order.",
    icon: Package,
    variant: "info",
  },

  delivery_requested: {
    label: "Delivery Requested",
    description:
      "A delivery request is available for eligible riders.",
    icon: Truck,
    variant: "info",
  },

  rider_assigned: {
    label: "Rider Assigned",
    description:
      "A rider has accepted the delivery request.",
    icon: UserRound,
    variant: "info",
  },

  picked_up: {
    label: "Picked Up",
    description:
      "The rider has collected the order from the business.",
    icon: Package,
    variant: "warning",
  },

  out_for_delivery: {
    label: "Out for Delivery",
    description:
      "The order is currently on the way to the customer.",
    icon: Truck,
    variant: "warning",
  },

  delivered: {
    label: "Delivered",
    description:
      "The order has reached the customer.",
    icon: MapPin,
    variant: "success",
  },

  completed: {
    label: "Completed",
    description:
      "The order and delivery have been completed.",
    icon: CheckCircle2,
    variant: "success",
  },

  cancelled: {
    label: "Cancelled",
    description:
      "The order or delivery was cancelled.",
    icon: Circle,
    variant: "danger",
  },

  refund_pending: {
    label: "Refund Pending",
    description:
      "The refund is being processed.",
    icon: Clock3,
    variant: "warning",
  },

  refunded: {
    label: "Refunded",
    description:
      "The customer refund has been completed.",
    icon: CheckCircle2,
    variant: "success",
  },

  disputed: {
    label: "Disputed",
    description:
      "This order currently has an active dispute.",
    icon: Circle,
    variant: "danger",
  },
};

const DEFAULT_DELIVERY_FLOW:
  DeliveryTimelineStatus[] = [
    "paid",
    "business_confirmed",
    "delivery_requested",
    "rider_assigned",
    "picked_up",
    "out_for_delivery",
    "delivered",
    "completed",
  ];

function getTimelineItems(
  items: DeliveryTimelineItem[],
  currentStatus?: DeliveryTimelineStatus,
): DeliveryTimelineItem[] {
  if (items.length > 0) {
    return items;
  }

  if (!currentStatus) {
    return [];
  }

  const currentIndex =
    DEFAULT_DELIVERY_FLOW.indexOf(
      currentStatus,
    );

  return DEFAULT_DELIVERY_FLOW.map(
    (status, index) => ({
      id: status,
      status,
      createdAt: "",
      completed:
        currentIndex >= 0 &&
        index < currentIndex,
      current:
        status === currentStatus,
    }),
  ).filter((item) => {
    if (
      currentStatus === "cancelled" ||
      currentStatus === "disputed"
    ) {
      return false;
    }

    return true;
  });
}

export default function DeliveryTimeline({
  items,
  currentStatus,
  compact = false,
  showDescriptions = true,
  showDates = true,
  className = "",
}: DeliveryTimelineProps) {
  const timelineItems =
    getTimelineItems(
      items,
      currentStatus,
    );

  if (timelineItems.length === 0) {
    return null;
  }

  return (
    <section
      className={[
        compact
          ? "rounded-xl border border-slate-200 bg-white p-4"
          : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Delivery timeline"
    >
      <div className="mb-5">
        <h2
          className={
            compact
              ? "text-sm font-semibold text-slate-900"
              : "text-base font-semibold text-slate-900"
          }
        >
          Delivery Timeline
        </h2>

        {!compact && (
          <p className="mt-1 text-sm text-slate-500">
            Track the delivery progress from
            payment confirmation to completion.
          </p>
        )}
      </div>

      <div className="relative">
        {timelineItems.map(
          (item, index) => {
            const config =
              STATUS_CONFIG[item.status];

            const Icon = config.icon;

            const isLast =
              index ===
              timelineItems.length - 1;

            const isCurrent =
              item.current ||
              currentStatus ===
                item.status;

            const isCompleted =
              item.completed ||
              (currentStatus
                ? DEFAULT_DELIVERY_FLOW.indexOf(
                    item.status,
                  ) <
                  DEFAULT_DELIVERY_FLOW.indexOf(
                    currentStatus,
                  )
                : false);

            const displayLabel =
              item.label ||
              config.label;

            const displayDescription =
              item.description ||
              config.description;

            return (
              <div
                key={item.id}
                className="relative flex gap-4"
              >
                <div className="relative flex w-8 shrink-0 justify-center">
                  {!isLast && (
                    <span
                      className={[
                        "absolute top-8 h-full w-px",
                        isCompleted ||
                        isCurrent
                          ? "bg-slate-300"
                          : "bg-slate-200",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  )}

                  <div
                    className={[
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border",
                      isCurrent
                        ? "border-brand-200 bg-brand-50 text-brand-600 ring-4 ring-brand-50"
                        : isCompleted
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                          : "border-slate-200 bg-white text-slate-400",
                    ].join(" ")}
                  >
                    <Icon
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div
                  className={[
                    "min-w-0 flex-1",
                    isLast
                      ? "pb-0"
                      : compact
                        ? "pb-4"
                        : "pb-6",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={[
                        "font-medium",
                        compact
                          ? "text-sm"
                          : "text-sm",
                        isCurrent
                          ? "text-slate-900"
                          : "text-slate-700",
                      ].join(" ")}
                    >
                      {displayLabel}
                    </h3>

                    {isCurrent && (
                      <Badge
                        variant={config.variant}
                        size="sm"
                        dot
                      >
                        Current
                      </Badge>
                    )}

                    {isCompleted &&
                      !isCurrent && (
                        <CheckCircle2
                          className="h-4 w-4 text-emerald-500"
                          aria-label="Completed"
                        />
                      )}
                  </div>

                  {showDescriptions && (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {displayDescription}
                    </p>
                  )}

                  {showDates &&
                    item.createdAt && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock3
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        {formatDateTime(
                          item.createdAt,
                        )}
                      </p>
                    )}
                </div>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}
