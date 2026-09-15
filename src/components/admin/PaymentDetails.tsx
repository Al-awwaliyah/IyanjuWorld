import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatNaira } from "@/libs/format";

export type PaymentStatus =
  | "created"
  | "pending"
  | "processing"
  | "successful"
  | "failed"
  | "cancelled"
  | "expired"
  | "refunded"
  | "partially_refunded";

export type PaymentMethod =
  | "card"
  | "bank_transfer"
  | "bank_account"
  | "ussd"
  | "opay"
  | "nqr"
  | "enaira"
  | "internet_banking"
  | "other";

export interface PaymentDetailsData {
  id: string;
  paymentReference: string;

  orderId?: string;
  orderReference?: string;

  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  businessId?: string;
  businessName?: string;

  provider?: string;
  providerTransactionId?: string;
  providerReference?: string;
  providerStatus?: string;
  providerMessage?: string;
  providerChannel?: string;

  method: PaymentMethod;
  status: PaymentStatus;

  amount: number;
  currency?: string;

  createdAt?: string | Date;
  updatedAt?: string | Date;
  successfulAt?: string | Date;
  failedAt?: string | Date;
  cancelledAt?: string | Date;
  expiredAt?: string | Date;
  refundedAt?: string | Date;

  metadata?: Record<string, unknown>;
}

export interface PaymentDetailsProps {
  payment: PaymentDetailsData;

  onRefresh?: (payment: PaymentDetailsData) => void;
  onViewOrder?: (payment: PaymentDetailsData) => void;
  onViewCustomer?: (payment: PaymentDetailsData) => void;
  onViewBusiness?: (payment: PaymentDetailsData) => void;

  loading?: boolean;
  showActions?: boolean;
  className?: string;
}

const statusConfig: Record<
  PaymentStatus,
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
  created: {
    label: "Created",
    variant: "neutral",
    icon: FileText,
  },
  pending: {
    label: "Pending",
    variant: "warning",
    icon: Clock3,
  },
  processing: {
    label: "Processing",
    variant: "info",
    icon: RefreshCw,
  },
  successful: {
    label: "Successful",
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
  expired: {
    label: "Expired",
    variant: "warning",
    icon: Clock3,
  },
  refunded: {
    label: "Refunded",
    variant: "info",
    icon: RefreshCw,
  },
  partially_refunded: {
    label: "Partially refunded",
    variant: "info",
    icon: RefreshCw,
  },
};

const methodLabels: Record<PaymentMethod, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  bank_account: "Bank account",
  ussd: "USSD",
  opay: "OPay",
  nqr: "NQR",
  enaira: "eNaira",
  internet_banking: "Internet banking",
  other: "Other",
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
        ].join(" ")}
      >
        {displayValue(value)}
      </p>
    </div>
  );
}

function TimelineItem({
  label,
  date,
  completed = false,
  active = false,
}: {
  label: string;
  date?: string | Date;
  completed?: boolean;
  active?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      <div
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
          completed
            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
            : active
              ? "border-brand-200 bg-brand-50 text-brand-600"
              : "border-slate-200 bg-white text-slate-400",
        ].join(" ")}
      >
        {completed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Clock3 className="h-4 w-4" />
        )}
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

export function PaymentDetails({
  payment,
  onRefresh,
  onViewOrder,
  onViewCustomer,
  onViewBusiness,
  loading = false,
  showActions = true,
  className = "",
}: PaymentDetailsProps) {
  const config = statusConfig[payment.status];
  const StatusIcon = config.icon;

  const providerName = payment.provider ?? "Flutterwave";

  return (
    <section
      className={[
        "w-full space-y-4",
        className,
      ].filter(Boolean).join(" ")}
    >
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Payment details
              </h2>

              <Badge variant={config.variant}>
                <StatusIcon className="h-4 w-4" />
                {config.label}
              </Badge>

              <Badge variant="neutral">
                <CreditCard className="h-4 w-4" />
                {methodLabels[payment.method]}
              </Badge>
            </div>

            <p className="mt-2 break-all font-mono text-xs text-slate-500">
              {payment.paymentReference}
            </p>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-2xl font-bold text-slate-900">
              {formatNaira(payment.amount)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {payment.currency ?? "NGN"}
            </p>
          </div>
        </div>

        {showActions &&
          (onRefresh ||
            onViewOrder ||
            onViewCustomer ||
            onViewBusiness) && (
            <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/70 p-4">
              {onRefresh && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRefresh(payment)}
                  loading={loading}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh status
                </Button>
              )}

              {onViewOrder && payment.orderId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onViewOrder(payment)}
                  disabled={loading}
                >
                  <ExternalLink className="h-4 w-4" />
                  View order
                </Button>
              )}

              {onViewCustomer && payment.customerId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onViewCustomer(payment)}
                  disabled={loading}
                >
                  <ExternalLink className="h-4 w-4" />
                  View customer
                </Button>
              )}

              {onViewBusiness && payment.businessId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onViewBusiness(payment)}
                  disabled={loading}
                >
                  <ExternalLink className="h-4 w-4" />
                  View business
                </Button>
              )}
            </div>
          )}

        <div className="grid gap-6 p-5 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />

              <h3 className="text-sm font-semibold text-slate-900">
                Payment references
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Payment reference"
                value={payment.paymentReference}
                mono
              />

              <DetailItem
                label="Order reference"
                value={payment.orderReference}
                mono
              />

              <DetailItem
                label="Payment ID"
                value={payment.id}
                mono
              />

              <DetailItem
                label="Order ID"
                value={payment.orderId}
                mono
              />

              <DetailItem
                label="Provider"
                value={providerName}
              />

              <DetailItem
                label="Payment method"
                value={methodLabels[payment.method]}
              />
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-500" />

              <h3 className="text-sm font-semibold text-slate-900">
                Provider information
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Provider transaction ID"
                value={payment.providerTransactionId}
                mono
              />

              <DetailItem
                label="Provider reference"
                value={payment.providerReference}
                mono
              />

              <DetailItem
                label="Provider status"
                value={payment.providerStatus}
              />

              <DetailItem
                label="Provider channel"
                value={payment.providerChannel}
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
              value={payment.customerName}
            />

            <DetailItem
              label="Email"
              value={payment.customerEmail}
            />

            <DetailItem
              label="Phone"
              value={payment.customerPhone}
            />

            <DetailItem
              label="Customer ID"
              value={payment.customerId}
              mono
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            Business
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailItem
              label="Business"
              value={payment.businessName}
            />

            <DetailItem
              label="Business ID"
              value={payment.businessId}
              mono
            />
          </div>
        </div>
      </div>

      {(payment.providerMessage || payment.status === "failed") && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">
                Payment message
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {payment.providerMessage ??
                  "The payment provider reported that this payment was not successful."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-5 text-sm font-semibold text-slate-900">
          Payment lifecycle
        </h3>

        <div className="grid gap-x-8 sm:grid-cols-2">
          <div>
            <TimelineItem
              label="Payment created"
              date={payment.createdAt}
              completed={Boolean(payment.createdAt)}
              active={payment.status === "created"}
            />

            <TimelineItem
              label="Payment successful"
              date={payment.successfulAt}
              completed={Boolean(payment.successfulAt)}
              active={payment.status === "successful"}
            />

            <TimelineItem
              label="Payment failed"
              date={payment.failedAt}
              completed={Boolean(payment.failedAt)}
              active={payment.status === "failed"}
            />
          </div>

          <div>
            <TimelineItem
              label="Payment cancelled"
              date={payment.cancelledAt}
              completed={Boolean(payment.cancelledAt)}
              active={payment.status === "cancelled"}
            />

            <TimelineItem
              label="Payment expired"
              date={payment.expiredAt}
              completed={Boolean(payment.expiredAt)}
              active={payment.status === "expired"}
            />

            <TimelineItem
              label="Payment refunded"
              date={payment.refundedAt}
              completed={Boolean(payment.refundedAt)}
              active={
                payment.status === "refunded" ||
                payment.status === "partially_refunded"
              }
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          Payment timestamps
        </h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem
            label="Created"
            value={displayDate(payment.createdAt)}
          />

          <DetailItem
            label="Updated"
            value={displayDate(payment.updatedAt)}
          />

          <DetailItem
            label="Successful"
            value={displayDate(payment.successfulAt)}
          />

          <DetailItem
            label="Refunded"
            value={displayDate(payment.refundedAt)}
          />
        </div>
      </div>

      {payment.metadata &&
        Object.keys(payment.metadata).length > 0 && (
          <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-900">
              Technical metadata
            </summary>

            <div className="border-t border-slate-100 p-5">
              <pre className="max-h-96 overflow-auto rounded-lg bg-ink-950 p-4 text-xs leading-5 text-slate-200 dark-surface">
                {JSON.stringify(
                  payment.metadata,
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

export default PaymentDetails;
