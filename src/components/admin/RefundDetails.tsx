import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  RotateCcw,
  WalletCards,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatNaira } from "@/libs/format";

export type RefundDetailsStatus =
  | "requested"
  | "approved"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "reversed";

export interface RefundDetailsData {
  id: string;
  refundReference: string;
  orderReference?: string;
  orderId?: string;
  paymentReference?: string;
  paymentId?: string;

  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  businessName?: string;
  businessId?: string;

  amount: number;
  paymentAmount?: number;
  previouslyRefundedAmount?: number;
  remainingRefundableAmount?: number;

  currency?: string;
  status: RefundDetailsStatus;
  destination?: "wallet";

  reason?: string;
  notes?: string;

  requestedBy?: string;
  approvedBy?: string;
  processedBy?: string;

  requestedAt?: string | Date;
  approvedAt?: string | Date;
  processingAt?: string | Date;
  completedAt?: string | Date;
  failedAt?: string | Date;
  cancelledAt?: string | Date;
  reversedAt?: string | Date;

  walletTransactionReference?: string;
  walletTransactionId?: string;

  metadata?: Record<string, unknown>;
}

export interface RefundDetailsProps {
  refund: RefundDetailsData;

  onApprove?: (refund: RefundDetailsData) => void;
  onProcess?: (refund: RefundDetailsData) => void;
  onRetry?: (refund: RefundDetailsData) => void;
  onCancel?: (refund: RefundDetailsData) => void;
  onReverse?: (refund: RefundDetailsData) => void;

  loading?: boolean;
  showActions?: boolean;
  className?: string;
}

const statusConfig: Record<
  RefundDetailsStatus,
  {
    label: string;
    variant:
      | "default"
      | "success"
      | "warning"
      | "danger"
      | "info"
      | "neutral";
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

function displayValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  return String(value);
}

function displayDate(value?: string | Date) {
  if (!value) {
    return "—";
  }

  return formatDateTime(value);
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={[
          "mt-1 break-words text-sm text-slate-800",
          mono ? "font-mono text-xs" : "font-medium",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {displayValue(value)}
      </p>
    </div>
  );
}

function TimelineItem({
  label,
  date,
  active = false,
  completed = false,
}: {
  label: string;
  date?: string | Date;
  active?: boolean;
  completed?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
            completed
              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
              : active
                ? "border-blue-200 bg-blue-50 text-blue-600"
                : "border-slate-200 bg-white text-slate-400",
          ].join(" ")}
        >
          {completed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Clock3 className="h-4 w-4" />
          )}
        </span>
      </div>

      <div className="min-w-0 pb-5">
        <p
          className={[
            "text-sm font-medium",
            completed || active
              ? "text-slate-800"
              : "text-slate-500",
          ].join(" ")}
        >
          {label}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {displayDate(date)}
        </p>
      </div>
    </div>
  );
}

export function RefundDetails({
  refund,
  onApprove,
  onProcess,
  onRetry,
  onCancel,
  onReverse,
  loading = false,
  showActions = true,
  className = "",
}: RefundDetailsProps) {
  const config = statusConfig[refund.status];
  const StatusIcon = config.icon;

  const canApprove =
    refund.status === "requested" && Boolean(onApprove);

  const canProcess =
    (refund.status === "approved" ||
      refund.status === "requested") &&
    Boolean(onProcess);

  const canRetry =
    refund.status === "failed" && Boolean(onRetry);

  const canCancel =
    (refund.status === "requested" ||
      refund.status === "approved") &&
    Boolean(onCancel);

  const canReverse =
    refund.status === "completed" && Boolean(onReverse);

  return (
    <section
      className={[
        "w-full space-y-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Refund details
              </h2>

              <Badge variant={config.variant}>
                <StatusIcon className="h-4 w-4" />
                {config.label}
              </Badge>

              <Badge variant="neutral">
                <WalletCards className="h-4 w-4" />
                Wallet refund
              </Badge>
            </div>

            <p className="mt-2 break-all font-mono text-xs text-slate-500">
              {refund.refundReference}
            </p>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-2xl font-bold text-slate-900">
              {formatNaira(refund.amount)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {refund.currency ?? "NGN"}
            </p>
          </div>
        </div>

        {showActions &&
          (canApprove ||
            canProcess ||
            canRetry ||
            canCancel ||
            canReverse) && (
            <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/70 p-4">
              {canApprove && onApprove && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onApprove(refund)}
                  loading={loading}
                  disabled={loading}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve refund
                </Button>
              )}

              {canProcess && onProcess && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onProcess(refund)}
                  loading={loading}
                  disabled={loading}
                >
                  <WalletCards className="h-4 w-4" />
                  Process refund
                </Button>
              )}

              {canRetry && onRetry && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onRetry(refund)}
                  loading={loading}
                  disabled={loading}
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry refund
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
                  Cancel refund
                </Button>
              )}

              {canReverse && onReverse && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => onReverse(refund)}
                  disabled={loading}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reverse refund
                </Button>
              )}
            </div>
          )}

        <div className="grid gap-6 p-5 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />

              <h3 className="text-sm font-semibold text-slate-900">
                Transaction references
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Refund reference"
                value={refund.refundReference}
                mono
              />

              <DetailItem
                label="Order reference"
                value={refund.orderReference}
                mono
              />

              <DetailItem
                label="Payment reference"
                value={refund.paymentReference}
                mono
              />

              <DetailItem
                label="Refund ID"
                value={refund.id}
                mono
              />

              <DetailItem
                label="Order ID"
                value={refund.orderId}
                mono
              />

              <DetailItem
                label="Payment ID"
                value={refund.paymentId}
                mono
              />
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-slate-500" />

              <h3 className="text-sm font-semibold text-slate-900">
                Refund destination
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Destination"
                value="Customer wallet"
              />

              <DetailItem
                label="Currency"
                value={refund.currency ?? "NGN"}
              />

              <DetailItem
                label="Wallet transaction"
                value={refund.walletTransactionReference}
                mono
              />

              <DetailItem
                label="Wallet transaction ID"
                value={refund.walletTransactionId}
                mono
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            Customer
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailItem
              label="Name"
              value={refund.customerName}
            />

            <DetailItem
              label="Email"
              value={refund.customerEmail}
            />

            <DetailItem
              label="Phone"
              value={refund.customerPhone}
            />

            <DetailItem
              label="Business"
              value={refund.businessName}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            Financial breakdown
          </h3>

          <div className="mt-4 space-y-3">
            {refund.paymentAmount !== undefined && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-500">
                  Original payment
                </span>

                <span className="font-semibold text-slate-800">
                  {formatNaira(refund.paymentAmount)}
                </span>
              </div>
            )}

            {refund.previouslyRefundedAmount !== undefined && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-500">
                  Previously refunded
                </span>

                <span className="font-semibold text-slate-800">
                  {formatNaira(
                    refund.previouslyRefundedAmount,
                  )}
                </span>
              </div>
            )}

            {refund.remainingRefundableAmount !== undefined && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-500">
                  Remaining refundable
                </span>

                <span className="font-semibold text-slate-800">
                  {formatNaira(
                    refund.remainingRefundableAmount,
                  )}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
              <span className="font-medium text-slate-700">
                Current refund
              </span>

              <span className="text-base font-bold text-slate-900">
                {formatNaira(refund.amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {(refund.reason || refund.notes) && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

            <div className="min-w-0">
              {refund.reason && (
                <>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Refund reason
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {refund.reason}
                  </p>
                </>
              )}

              {refund.notes && (
                <div className={refund.reason ? "mt-4" : ""}>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Notes
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {refund.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-5 text-sm font-semibold text-slate-900">
          Refund lifecycle
        </h3>

        <div className="grid gap-x-8 sm:grid-cols-2">
          <div>
            <TimelineItem
              label="Refund requested"
              date={refund.requestedAt}
              completed={Boolean(refund.requestedAt)}
              active={
                refund.status === "requested"
              }
            />

            <TimelineItem
              label="Refund approved"
              date={refund.approvedAt}
              completed={Boolean(refund.approvedAt)}
              active={
                refund.status === "approved"
              }
            />

            <TimelineItem
              label="Refund processing"
              date={refund.processingAt}
              completed={Boolean(refund.processingAt)}
              active={
                refund.status === "processing"
              }
            />
          </div>

          <div>
            <TimelineItem
              label="Refund completed"
              date={refund.completedAt}
              completed={Boolean(refund.completedAt)}
              active={
                refund.status === "completed"
              }
            />

            <TimelineItem
              label="Refund failed"
              date={refund.failedAt}
              completed={Boolean(refund.failedAt)}
              active={
                refund.status === "failed"
              }
            />

            <TimelineItem
              label="Refund cancelled or reversed"
              date={
                refund.cancelledAt ??
                refund.reversedAt
              }
              completed={Boolean(
                refund.cancelledAt ||
                  refund.reversedAt,
              )}
              active={
                refund.status === "cancelled" ||
                refund.status === "reversed"
              }
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          Audit information
        </h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem
            label="Requested by"
            value={refund.requestedBy}
            mono
          />

          <DetailItem
            label="Approved by"
            value={refund.approvedBy}
            mono
          />

          <DetailItem
            label="Processed by"
            value={refund.processedBy}
            mono
          />

          <DetailItem
            label="Created"
            value={displayDate(
              refund.requestedAt,
            )}
          />
        </div>
      </div>

      {refund.metadata &&
        Object.keys(refund.metadata).length > 0 && (
          <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-900">
              Technical metadata
            </summary>

            <div className="border-t border-slate-100 p-5">
              <pre className="max-h-80 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-200">
                {JSON.stringify(
                  refund.metadata,
                  null,
                  2,
                )}
              </pre>
            </div>
          </details>
        )}
    </section>
  );
}

export default RefundDetails;
