import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Landmark,
  MoreHorizontal,
  Wallet,
  XCircle,
} from "lucide-react";

import Badge, {
  type BadgeProps,
} from "../ui/Badge";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Spinner from "../ui/Spinner";
import Dropdown from "../ui/Dropdown";
import {
  formatDateTime,
  formatNaira,
} from "../../libs/format";

export type BusinessPayoutStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "reversed";

export interface BusinessPayout {
  id: string;
  reference: string;
  amount: number;
  currency?: string;
  status: BusinessPayoutStatus;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  createdAt: string;
  processedAt?: string | null;
  failureReason?: string | null;
}

export interface BusinessPayoutsProps {
  payouts?: BusinessPayout[];
  availableBalance?: number;
  pendingBalance?: number;
  totalPaidOut?: number;
  currency?: string;
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onRequestPayout?: () => void;
  onViewPayout?: (payout: BusinessPayout) => void;
  onRetryPayout?: (payout: BusinessPayout) => void;
  className?: string;
}

const statusConfig: Record<
  BusinessPayoutStatus,
  {
    label: string;
    variant: BadgeProps["variant"];
    icon: typeof Clock3;
  }
> = {
  pending: {
    label: "Pending",
    variant: "warning",
    icon: Clock3,
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
    variant: "warning",
    icon: XCircle,
  },
};

function maskAccountNumber(
  accountNumber?: string | null,
) {
  if (!accountNumber) {
    return "—";
  }

  const cleaned = accountNumber.replace(/\s+/g, "");

  if (cleaned.length <= 4) {
    return cleaned;
  }

  return `•••• ${cleaned.slice(-4)}`;
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Wallet;
  iconClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 truncate text-xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
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

function PayoutRow({
  payout,
  currency,
  onView,
  onRetry,
}: {
  payout: BusinessPayout;
  currency: string;
  onView?: (payout: BusinessPayout) => void;
  onRetry?: (payout: BusinessPayout) => void;
}) {
  const config =
    statusConfig[payout.status];

  const StatusIcon = config.icon;

  return (
    <div className="border-b border-slate-100 px-4 py-4 last:border-b-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Landmark
              className="h-5 w-5"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">
                {payout.reference}
              </p>

              <Badge
                variant={config.variant}
                size="sm"
              >
                <span className="inline-flex items-center gap-1">
                  <StatusIcon
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  {config.label}
                </span>
              </Badge>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CalendarDays
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                {formatDateTime(
                  payout.createdAt,
                )}
              </span>

              {payout.bankName && (
                <span className="inline-flex items-center gap-1">
                  <Building2
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  {payout.bankName}
                </span>
              )}
            </div>

            {(payout.accountName ||
              payout.accountNumber) && (
              <div className="mt-2 text-xs text-slate-500">
                {payout.accountName && (
                  <span className="font-medium text-slate-700">
                    {payout.accountName}
                  </span>
                )}

                {payout.accountName &&
                  payout.accountNumber && (
                    <span className="mx-1">
                      •
                    </span>
                  )}

                {payout.accountNumber && (
                  <span>
                    {maskAccountNumber(
                      payout.accountNumber,
                    )}
                  </span>
                )}
              </div>
            )}

            {payout.failureReason && (
              <p className="mt-2 max-w-xl text-xs text-red-600">
                {payout.failureReason}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <div className="lg:text-right">
            <p className="text-base font-bold text-slate-900">
              {formatNaira(
                payout.amount,
                currency,
              )}
            </p>

            {payout.processedAt && (
              <p className="mt-1 text-xs text-slate-500">
                Processed{" "}
                {formatDateTime(
                  payout.processedAt,
                )}
              </p>
            )}
          </div>

          {(onView || onRetry) && (
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-label="Payout actions"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <MoreHorizontal
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </button>
              }
              items={[
                ...(onView
                  ? [
                      {
                        label: "View details",
                        icon: Eye,
                        onClick: () =>
                          onView(payout),
                      },
                    ]
                  : []),
                ...(onRetry &&
                payout.status === "failed"
                  ? [
                      {
                        label: "Retry payout",
                        icon: CreditCard,
                        onClick: () =>
                          onRetry(payout),
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function BusinessPayouts({
  payouts = [],
  availableBalance = 0,
  pendingBalance = 0,
  totalPaidOut = 0,
  currency = "NGN",
  loading = false,
  refreshing = false,
  error,
  onRefresh,
  onRequestPayout,
  onViewPayout,
  onRetryPayout,
  className = "",
}: BusinessPayoutsProps) {
  if (loading && payouts.length === 0) {
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
          label="Loading payouts"
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
            Payouts
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your available business earnings and
            payout history.
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

          {onRequestPayout && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={availableBalance <= 0}
              onClick={onRequestPayout}
            >
              Request payout
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Available balance"
          value={formatNaira(
            availableBalance,
            currency,
          )}
          description="Available to request"
          icon={Wallet}
          iconClassName="bg-emerald-50 text-emerald-600"
        />

        <SummaryCard
          label="Pending balance"
          value={formatNaira(
            pendingBalance,
            currency,
          )}
          description="Not yet available"
          icon={Clock3}
          iconClassName="bg-amber-50 text-amber-600"
        />

        <SummaryCard
          label="Total paid out"
          value={formatNaira(
            totalPaidOut,
            currency,
          )}
          description="Successfully settled"
          icon={CheckCircle2}
          iconClassName="bg-brand-50 text-brand-600"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <CreditCard
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Payout account
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Payouts are sent to the verified business
                settlement account configured for your
                business.
              </p>
            </div>
          </div>

          <Badge
            variant="info"
            size="sm"
          >
            Business settlement
          </Badge>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Payout history
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Review previous payout requests and their
              settlement status.
            </p>
          </div>

          <span className="text-xs text-slate-500">
            {payouts.length} payout
            {payouts.length === 1 ? "" : "s"}
          </span>
        </div>

        {payouts.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Wallet}
              title="No payouts yet"
              description="Completed payout requests will appear here."
              actionLabel={
                onRequestPayout &&
                availableBalance > 0
                  ? "Request payout"
                  : undefined
              }
              onAction={onRequestPayout}
            />
          </div>
        ) : (
          <div>
            {payouts.map((payout) => (
              <PayoutRow
                key={payout.id}
                payout={payout}
                currency={currency}
                onView={onViewPayout}
                onRetry={onRetryPayout}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
