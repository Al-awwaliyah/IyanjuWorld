import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import Badge from "../ui/Badge";

export type OrderStatusValue =
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

export interface OrderStatusProps {
  status: OrderStatusValue;
  label?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

const statusConfig: Record<
  OrderStatusValue,
  {
    label: string;
    description: string;
    icon: typeof Package;
    variant:
      | "default"
      | "success"
      | "warning"
      | "danger"
      | "info"
      | "neutral";
  }
> = {
  pending_payment: {
    label: "Payment Pending",
    description:
      "Complete payment to confirm your order.",
    icon: Clock3,
    variant: "warning",
  },
  paid: {
    label: "Payment Confirmed",
    description:
      "Your payment has been verified.",
    icon: CheckCircle2,
    variant: "success",
  },
  business_confirmed: {
    label: "Order Confirmed",
    description:
      "The business has confirmed your order.",
    icon: CheckCircle2,
    variant: "info",
  },
  delivery_requested: {
    label: "Finding Rider",
    description:
      "We are looking for an available rider.",
    icon: Truck,
    variant: "warning",
  },
  rider_assigned: {
    label: "Rider Assigned",
    description:
      "A rider has been assigned to your order.",
    icon: Truck,
    variant: "info",
  },
  picked_up: {
    label: "Order Picked Up",
    description:
      "The rider has picked up your order.",
    icon: Package,
    variant: "info",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    description:
      "Your order is on its way to you.",
    icon: Truck,
    variant: "info",
  },
  delivered: {
    label: "Delivered",
    description:
      "Your order has been delivered.",
    icon: CheckCircle2,
    variant: "success",
  },
  completed: {
    label: "Completed",
    description:
      "Your order has been completed successfully.",
    icon: CheckCircle2,
    variant: "success",
  },
  cancelled: {
    label: "Cancelled",
    description:
      "This order has been cancelled.",
    icon: XCircle,
    variant: "danger",
  },
  refund_pending: {
    label: "Refund Pending",
    description:
      "Your refund is being processed.",
    icon: Clock3,
    variant: "warning",
  },
  refunded: {
    label: "Refunded",
    description:
      "Your refund has been credited to your IyanjuWorld wallet.",
    icon: CheckCircle2,
    variant: "success",
  },
  disputed: {
    label: "Under Dispute",
    description:
      "This order is currently under review.",
    icon: AlertCircle,
    variant: "danger",
  },
};

export default function OrderStatus({
  status,
  label,
  description,
  compact = false,
  className = "",
}: OrderStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={[
          "inline-flex items-center gap-2",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Icon
          className="h-4 w-4 shrink-0 text-slate-500"
          aria-hidden="true"
        />

        <Badge
          variant={config.variant}
          size="sm"
        >
          {label || config.label}
        </Badge>
      </div>
    );
  }

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {label || config.label}
            </h2>

            <Badge
              variant={config.variant}
              size="sm"
            >
              {config.label}
            </Badge>
          </div>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {description || config.description}
          </p>
        </div>
      </div>
    </section>
  );
}
