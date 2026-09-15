import {
  ArrowDownToLine,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  TrendingUp,
  Wallet,
} from "lucide-react";

import Badge, {
  type BadgeProps,
} from "../ui/Badge";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Spinner from "../ui/Spinner";
import {
  formatDateTime,
  formatNaira,
  formatPercentage,
} from "../../libs/format";

export type BusinessEarningStatus =
  | "pending"
  | "available"
  | "paid_out"
  | "reversed"
  | "failed";

export type BusinessEarningType =
  | "sale"
  | "refund"
  | "payout"
  | "adjustment";

export interface BusinessEarning {
  id: string;
  type: BusinessEarningType;
  status: BusinessEarningStatus;
  orderId?: string | null;
  orderReference?: string | null;
  description?: string | null;
  grossAmount: number;
  platformFee?: number | null;
  netAmount: number;
  currency?: string;
  createdAt: string;
  availableAt?: string | null;
  paidOutAt?: string | null;
}

export interface BusinessEarningsSummary {
  grossSales: number;
  platformFees: number;
  refunds: number;
  netEarnings: number;
  pendingAmount: number;
  availableAmount: number;
  paidOutAmount: number;
  orderCount: number;
  platformFeeRate?: number;
  currency?: string;
}

export interface BusinessEarningsProps {
  summary?: BusinessEarningsSummary | null;
  earnings?: BusinessEarning[];
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewPayouts?: () => void;
  onViewOrder?: (orderId: string) => void;
  currency?: string;
  className?: string;
}

const statusConfig: Record<
  BusinessEarningStatus,
  {
    label: string;
    variant: BadgeProps["variant"];
  }
> = {
  pending: {
    label: "Pending",
    variant: "warning",
  },
  available: {
    label: "Available",
    variant: "success",
  },
  paid_out: {
    label: "Paid out",
    variant: "info",
  },
  reversed: {
    label: "Reversed",
    variant: "neutral",
  },
  failed: {
    label: "Failed",
    variant: "danger",
  },
};

const typeConfig: Record<
  BusinessEarningType,
  {
    label: string;
    icon: typeof ArrowUpRight;
  }
> = {
  sale: {
    label: "Sale",
    icon: ArrowUpRight,
  },
  refund: {
    label: "Refund",
    icon: ArrowDownToLine,
  },
  payout: {
    label: "Payout",
    icon: Wallet,
  },
  adjustment: {
    label: "Adjustment",
    icon: CircleDollarSign,
  },
};

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  description?: string;
  icon: typeof Wallet;
  iconClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600",
            iconClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Icon
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

function EarningRow({
  earning,
  currency,
  onViewOrder,
}: {
  earning: BusinessEarning;
  currency: string;
  onViewOrder?: (orderId: string) => void;
}) {
  const TypeIcon = typeConfig[earning.type].icon;
  const status = statusConfig[earning.status];

  const isRefund =
    earning.type === "refund" ||
    earning.netAmount < 0;

  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <TypeIcon
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {earning.description ||
                typeConfig[earning.type].label}
            </p>

            <Badge
              variant={status.variant}
              size="sm"
            >
              {status.label}
            </Badge>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {earning.orderReference && (
              <span>
                {earning.orderReference}
              </span>
            )}

            <span>
              {formatDateTime(earning.createdAt)}
            </span>
          </div>

          {earning.orderId &&
            onViewOrder && (
              <button
                type="button"
                onClick={() =>
                  onViewOrder(earning.orderId as string)
                }
                className="mt-2 text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
              >
                View order
              </button>
            )}
        </div>
      </div>

      <div className="shrink-0 sm:text-right">
        <p
          className={[
            "text-sm font-bold",
            isRefund
              ? "text-red-600"
              : "text-slate-900",
          ].join(" ")}
        >
          {isRefund ? "-" : "+"}
          {formatNaira(
            Math.abs(earning.netAmount),
            currency,
          )}
        </p>

        {earning.platformFee &&
          earning.platformFee > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Fee:{" "}
              {formatNaira(
                earning.platformFee,
                currency,
              )}
            </p>
          )}
      </div>
    </div>
  );
}

export default function BusinessEarnings({
  summary,
  earnings = [],
  loading = false,
  refreshing = false,
  error,
  onRefresh,
  onViewPayouts,
  onViewOrder,
  currency = "NGN",
  className = "",
}: BusinessEarningsProps) {
  const safeSummary: BusinessEarningsSummary = {
    grossSales: summary?.grossSales ?? 0,
    platformFees: summary?.platformFees ?? 0,
    refunds: summary?.refunds ?? 0,
    netEarnings: summary?.netEarnings ?? 0,
    pendingAmount: summary?.pendingAmount ?? 0,
    availableAmount: summary?.availableAmount ?? 0,
    paidOutAmount: summary?.paidOutAmount ?? 0,
    orderCount: summary?.orderCount ?? 0,
    platformFeeRate:
      summary?.platformFeeRate ?? 5,
    currency:
      summary?.currency ?? currency,
  };

  const displayCurrency =
    safeSummary.currency || currency;

  if (loading && earnings.length === 0) {
    return (
      <div
        className={[
          "flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Spinner
          size="lg"
          label="Loading earnings"
        />
      </div>
    );
  }

  return (
    <section
      className={[
        "space-y-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Earnings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track your sales, platform fees, available
            earnings and payouts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={refreshing}
              onClick={onRefresh}
            >
              Refresh
            </Button>
          )}

          {onViewPayouts && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onViewPayouts}
            >
              View payouts
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Gross sales"
          value={formatNaira(
            safeSummary.grossSales,
            displayCurrency,
          )}
          description={`${safeSummary.orderCount} order${
            safeSummary.orderCount === 1
              ? ""
              : "s"
          }`}
          icon={TrendingUp}
          iconClassName="bg-brand-50 text-brand-600"
        />

        <SummaryCard
          label="Platform fees"
          value={formatNaira(
            safeSummary.platformFees,
            displayCurrency,
          )}
          description={`${formatPercentage(
            safeSummary.platformFeeRate,
          )} marketplace commission`}
          icon={CircleDollarSign}
          iconClassName="bg-amber-50 text-amber-600"
        />

        <SummaryCard
          label="Available earnings"
          value={formatNaira(
            safeSummary.availableAmount,
            displayCurrency,
          )}
          description="Ready for payout"
          icon={Wallet}
          iconClassName="bg-emerald-50 text-emerald-600"
        />

        <SummaryCard
          label="Total paid out"
          value={formatNaira(
            safeSummary.paidOutAmount,
            displayCurrency,
          )}
          description="Successfully settled"
          icon={ArrowUpRight}
          iconClassName="bg-brand-50 text-brand-600"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Pending
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatNaira(
                  safeSummary.pendingAmount,
                  displayCurrency,
                )}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Earnings that are recorded but are not yet
            available for payout.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Net earnings
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatNaira(
                  safeSummary.netEarnings,
                  displayCurrency,
                )}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Sales after the marketplace commission,
            before any payout movement.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <CalendarDays
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Refunds
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatNaira(
                  safeSummary.refunds,
                  displayCurrency,
                )}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Refund activity affecting business earnings.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Earnings history
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Recent financial activity for your business.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CircleDollarSign
              className="h-4 w-4"
              aria-hidden="true"
            />
            <span>
              {earnings.length} record
              {earnings.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {earnings.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={CircleDollarSign}
              title="No earnings yet"
              description="Your business earnings will appear here after customers complete purchases."
            />
          </div>
        ) : (
          <div>
            {earnings.map((earning) => (
              <EarningRow
                key={earning.id}
                earning={earning}
                currency={displayCurrency}
                onViewOrder={onViewOrder}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

