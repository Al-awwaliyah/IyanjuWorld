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
  type:
