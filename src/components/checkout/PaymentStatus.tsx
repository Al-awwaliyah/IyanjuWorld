import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  XCircle,
} from "lucide-react";
import Button from "../ui/Button";

export type PaymentStatusType =
  | "pending"
  | "processing"
  | "successful"
  | "failed"
  | "cancelled"
  | "expired";

export interface PaymentStatusProps {
  status: PaymentStatusType;
  title?: string;
  message?: string;
  reference?: string | null;
  amount?: number | null;
  currency?: string;
  onRetry?: () => void;
  onContinue?: () => void;
  retryLabel?: string;
  continueLabel?: string;
  loading?: boolean;
  className?: string;
}

const statusConfig: Record<
  PaymentStatusType,
  {
    title: string;
    message: string;
    icon: typeof CheckCircle2;
    iconClass: string;
    backgroundClass: string;
  }
> = {
  pending: {
    title: "Payment Pending",
    message:
      "Your payment has not been confirmed yet. Please wait while we verify it.",
    icon: Clock3,
    iconClass: "text-amber-600",
    backgroundClass: "bg-amber-50",
  },
  processing: {
    title: "Processing Payment",
    message:
      "Your payment is being processed. Please do not close this page.",
    icon: Loader2,
    iconClass: "text-slate-700",
    backgroundClass: "bg-slate-100",
  },
  successful: {
    title: "Payment Successful",
    message:
      "Your payment has been verified successfully.",
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
    backgroundClass: "bg-emerald-50",
  },
  failed: {
    title: "Payment Failed",
    message:
      "We could not confirm your payment. You can try again using another payment method.",
    icon: AlertCircle,
    iconClass: "text-red-600",
    backgroundClass: "bg-red-50",
  },
  cancelled: {
    title: "Payment Cancelled",
    message:
      "The payment was cancelled before it could be completed.",
    icon: XCircle,
    iconClass: "text-slate-600",
    backgroundClass: "bg-slate-100",
  },
  expired: {
    title: "Payment Expired",
    message:
      "This payment session has expired. Please start a new payment.",
    icon: Clock3,
    iconClass: "text-red-600",
    backgroundClass: "bg-red-50",
  },
};

function formatAmount(
  amount: number,
  currency = "NGN",
) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentStatus({
  status,
  title,
  message,
  reference,
  amount,
  currency = "NGN",
  onRetry,
  onContinue,
  retryLabel = "Try Again",
  continueLabel = "Continue",
  loading = false,
  className = "",
}: PaymentStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const isProcessing =
    status === "processing";

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-8",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
          config.backgroundClass,
        ].join(" ")}
      >
        <Icon
          className={[
            "h-8 w-8",
            config.iconClass,
            isProcessing ? "animate-spin" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-5 text-xl font-bold text-slate-900">
        {title || config.title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {message || config.message}
      </p>

      {amount !== null &&
        amount !== undefined && (
          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Amount
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatAmount(amount, currency)}
            </p>
          </div>
        )}

      {reference && (
        <div className="mx-auto mt-5 max-w-md rounded-xl bg-slate-50 px-4 py-3 text-left">
          <p className="text-xs font-medium text-slate-400">
            Payment Reference
          </p>

          <p className="mt-1 break-all text-sm font-medium text-slate-700">
            {reference}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            size="md"
            loading={loading}
            disabled={loading}
            onClick={onRetry}
          >
            <CreditCard
              className="h-4 w-4"
              aria-hidden="true"
            />
            {retryLabel}
          </Button>
        )}

        {onContinue && (
          <Button
            type="button"
            variant="primary"
            size="md"
            loading={loading}
            disabled={loading}
            onClick={onContinue}
          >
            {continueLabel}
          </Button>
        )}
      </div>
    </section>
  );
}
