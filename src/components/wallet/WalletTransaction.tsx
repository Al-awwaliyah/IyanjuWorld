import {
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Wallet,
} from "lucide-react";
import Badge, {
  type BadgeProps,
} from "../ui/Badge";
import { formatNaira, formatDateTime } from "../../libs/format";

export type WalletTransactionType =
  | "deposit"
  | "order_payment"
  | "refund"
  | "withdrawal"
  | "withdrawal_reversal"
  | "adjustment"
  | "promotion"
  | "referral"
  | "reversal";

export type WalletTransactionStatus =
  | "pending"
  | "available"
  | "completed"
  | "withdrawal_pending"
  | "withdrawn"
  | "reversed"
  | "failed";

export interface WalletTransactionProps {
  id: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amount: number;
  reference: string;
  description?: string | null;
  createdAt: string;
  balanceAfter?: number | null;
  currency?: string;
  className?: string;
}

const typeLabels: Record<
  WalletTransactionType,
  string
> = {
  deposit: "Wallet Deposit",
  order_payment: "Order Payment",
  refund: "Order Refund",
  withdrawal: "Wallet Withdrawal",
  withdrawal_reversal:
    "Withdrawal Reversal",
  adjustment: "Balance Adjustment",
  promotion: "Promotion",
  referral: "Referral Reward",
  reversal: "Transaction Reversal",
};

const statusLabels: Record<
  WalletTransactionStatus,
  string
> = {
  pending: "Pending",
  available: "Available",
  completed: "Completed",
  withdrawal_pending: "Processing",
  withdrawn: "Withdrawn",
  reversed: "Reversed",
  failed: "Failed",
};

const statusVariants: Record<
  WalletTransactionStatus,
  BadgeProps["variant"]
> = {
  pending: "warning",
  available: "info",
  completed: "success",
  withdrawal_pending: "warning",
  withdrawn: "success",
  reversed: "danger",
  failed: "danger",
};

const incomingTypes: WalletTransactionType[] = [
  "deposit",
  "refund",
  "withdrawal_reversal",
  "promotion",
  "referral",
];

const outgoingTypes: WalletTransactionType[] = [
  "order_payment",
  "withdrawal",
];

function getTransactionIcon(
  type: WalletTransactionType,
) {
  if (incomingTypes.includes(type)) {
    return ArrowDownLeft;
  }

  if (outgoingTypes.includes(type)) {
    return ArrowUpRight;
  }

  return type === "reversal"
    ? RotateCcw
    : Wallet;
}

function isIncoming(
  type: WalletTransactionType,
) {
  return incomingTypes.includes(type);
}

function formatAmount(
  amount: number,
  currency = "NGN",
) {
  if (currency === "NGN") {
    return formatNaira(Math.abs(amount));
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export default function WalletTransaction({
  type,
  status,
  amount,
  reference,
  description,
  createdAt,
  balanceAfter,
  currency = "NGN",
  className = "",
}: WalletTransactionProps) {
  const Icon = getTransactionIcon(type);
  const incoming = isIncoming(type);

  return (
    <article
      className={[
        "flex gap-3 border-b border-slate-100 py-4 last:border-b-0 sm:gap-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          incoming
            ? "bg-emerald-50 text-emerald-600"
            : "bg-slate-100 text-slate-600",
        ].join(" ")}
      >
        <Icon
          className="h-5 w-5"
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {typeLabels[type]}
            </h3>

            {description && (
              <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>

          <p
            className={[
              "shrink-0 text-sm font-bold",
              incoming
                ? "text-emerald-600"
                : "text-slate-900",
            ].join(" ")}
          >
            {incoming ? "+" : "-"}
            {formatAmount(
              amount,
              currency,
            )}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Badge
            variant={statusVariants[status]}
            size="sm"
          >
            {statusLabels[status]}
          </Badge>

          <span className="text-xs text-slate-400">
            {formatDateTime(createdAt)}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
          <span className="break-all text-slate-400">
            {reference}
          </span>

          {balanceAfter !== null &&
            balanceAfter !== undefined && (
              <span className="text-slate-500">
                Balance:{" "}
                <span className="font-medium text-slate-700">
                  {formatAmount(
                    balanceAfter,
                    currency,
                  )}
                </span>
              </span>
            )}
        </div>
      </div>
    </article>
  );
}
