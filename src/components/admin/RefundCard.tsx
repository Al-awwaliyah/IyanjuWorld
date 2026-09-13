import {
  CheckCircle2,
  Clock3,
  Eye,
  RotateCcw,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatNaira } from "@/libs/format";

export type RefundStatus =
  | "requested"
  | "approved"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "reversed";

export interface RefundCardData {
  id: string;
  refundReference?: string;
  orderReference?: string;
  orderId?: string;
  paymentReference?: string;
  customerName?: string;
  customerEmail?: string;
  businessName?: string;
  amount: number;
  currency?: string;
  status: RefundStatus;
  reason?: string;
  destination?: "wallet";
  requestedAt?: string | Date;
  approvedAt?: string | Date;
  completedAt?: string | Date;
  failedAt?: string | Date;
  createdAt?: string | Date;
}

export interface RefundCardProps {
  refund: RefundCardData;
  onView?: (refund: RefundCardData) => void;
  onProcess?: (refund: RefundCardData) => void;
  onRetry?: (refund: RefundCardData) => void;
  onCancel?: (refund: RefundCardData) => void;
  loading?: boolean;
  compact?: boolean;
  showCustomer?: boolean;
  showBusiness?: boolean;
  showActions?: boolean;
  className?: string;
}

const statusConfig: Record<
  RefundStatus,
  {
    label: string;
    variant: BadgeProps["variant"];
    icon: typeof Clock3;
  }
> = {
  requested: {
    label: "Requested",
    variant: "warning",
    icon: Clock3,
  },
  approved: {
    label: "Approved",
    variant: "info",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    variant: "info",
    icon: Clock3,
  },
  completed: {
    label: "Completed",
    variant: "success",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    variant: "danger",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    variant: "neutral",
    icon: XCircle,
  },
  reversed: {
    label: "Reversed",
    variant: "danger",
    icon: RotateCcw,
  },
};

function formatDate(value?: string | Date) {
  if (!value) {
    return "—";
  }

  return formatDateTime(value);
}

function getPrimaryAction(
  refund: RefundCardData,
  onProcess?: (refund: RefundCardData) => void,
  onRetry?: (refund: RefundCardData) => void,
) {
  if (
    (refund.status === "requested" || refund.status === "approved") &&
    onProcess
  ) {
    return {
      label: refund.status === "requested" ? "Process refund" : "Complete refund",
      action: () => onProcess(refund),
      icon: CheckCircle2,
    };
  }

  if (refund.status === "failed" && onRetry) {
    return {
      label: "Retry refund",
      action: () => onRetry(refund),
      icon: RotateCcw,
    };
  }

  return null;
}

export function RefundCard({
  refund,
  onView,
  onProcess,
  onRetry,
  onCancel,
  loading = false,
  compact = false,
  showCustomer = true,
  showBusiness = true,
  showActions = true,
  className = "",
}: RefundCardProps) {
  const config = statusConfig[refund.status];
  const StatusIcon = config.icon;
  const primaryAction = getPrimaryAction(
    refund,
    onProcess,
    onRetry,
  );

  const canCancel =
    (refund.status === "requested" || refund.status === "approved") &&
    Boolean(onCancel);

  return (
    <article
      className={[
        "w-full rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={compact ? "p-3" : "p-4"}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {refund.refundReference ?? "Refund"}
              </h3>

              <Badge variant={config.variant} size="sm">
                <StatusIcon className="h-3.5 w-3.5" />
                {config.label}
              </Badge>

              <Badge variant="neutral" size="sm">
                Wallet
              </Badge>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {refund.orderReference && (
                <span>
                  Order:{" "}
                  <span className="font-medium text-slate-700">
                    {refund.orderReference}
                  </span>
                </span>
              )}

              {refund.paymentReference && (
                <span>
                  Payment:{" "}
                  <span className="font-medium text-slate-700">
                    {refund.paymentReference}
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <p className="text-lg font-bold text-slate-900">
              {formatNaira(refund.amount)}
            </p>

            <p className="text-right text-xs text-slate-500">
              {refund.currency ?? "NGN"}
            </p>
          </div>
        </div>

        <div
          className={[
            "mt-4 grid gap-3 border-t border-slate-100 pt-4",
            compact
              ? "sm:grid-cols-2"
              : "sm:grid-cols-2 lg:grid-cols-4",
          ].join(" ")}
        >
          {showCustomer && (
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Customer
              </p>

              <p className="mt-1 truncate text-sm font-medium text-slate-800">
                {refund.customerName ?? "—"}
              </p>

              {refund.customerEmail && (
                <p className="truncate text-xs text-slate-500">
                  {refund.customerEmail}
                </p>
              )}
            </div>
          )}

          {showBusiness && (
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Business
              </p>

              <p className="mt-1 truncate text-sm font-medium text-slate-800">
                {refund.businessName ?? "—"}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Requested
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {formatDate(
                refund.requestedAt ?? refund.createdAt,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Completed
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {formatDate(refund.completedAt)}
            </p>
          </div>
        </div>

        {refund.reason && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">
                  Refund reason
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-700">
                  {refund.reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {showActions && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
            {onView && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onView(refund)}
                disabled={loading}
              >
                <Eye className="h-4 w-4" />
                View details
              </Button>
            )}

            {canCancel && onCancel && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => onCancel(refund)}
                disabled={loading}
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            )}

            {primaryAction && (
              <Button
                type="button"
                size="sm"
                onClick={primaryAction.action}
                loading={loading}
                disabled={loading}
              >
                <primaryAction.icon className="h-4 w-4" />
                {primaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default RefundCard;
