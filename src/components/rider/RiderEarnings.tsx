import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Clock3,
  CreditCard,
  RefreshCw,
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
  formatNumber,
} from "../../libs/format";

export type RiderEarningType =
  | "delivery"
  | "bonus"
  | "adjustment"
  | "reversal";

export type RiderEarningStatus =
  | "pending"
  | "available"
  | "paid_out"
  | "reversed"
  | "failed";

export interface RiderEarning {
  id: string;
  reference: string;
  type: RiderEarningType;
  status: RiderEarningStatus;
  amount: number;
  description?: string | null;
  orderReference?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

export interface RiderEarningsSummary {
  totalEarnings: number;
  pendingAmount: number;
  availableAmount: number;
  paidOutAmount: number;
  deliveryCount: number;
  averageDeliveryEarning: number;
}

export interface RiderEarningsProps {
  summary: RiderEarningsSummary;
  earnings?: RiderEarning[];

  currency?: string;

  loading?: boolean;
  refreshing?: boolean;

  onRefresh?: () => void;
  onViewPayouts?: () => void;
  onViewEarning?: (
    earning: RiderEarning,
  ) => void;

  emptyTitle?: string;
  emptyDescription?: string;

  className?: string;
}

const TYPE_CONFIG: Record<
  RiderEarningType,
  {
    label: string;
    variant: BadgeProps["variant"];
  }
> = {
  delivery: {
    label: "Delivery",
    variant: "success",
  },

  bonus: {
    label: "Bonus",
    variant: "info",
  },

  adjustment: {
    label: "Adjustment",
    variant: "warning",
  },

  reversal: {
    label: "Reversal",
    variant: "danger",
  },
};

const STATUS_CONFIG: Record<
  RiderEarningStatus,
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
    label: "Paid Out",
    variant: "info",
  },

  reversed: {
    label: "Reversed",
    variant: "danger",
  },

  failed: {
    label: "Failed",
    variant: "danger",
  },
};

function isPositiveEarning(
  type: RiderEarningType,
) {
  return type !== "reversal";
}

function getTypeIcon(
  type: RiderEarningType,
) {
  switch (type) {
    case "delivery":
      return Banknote;

    case "bonus":
      return ArrowUpRight;

    case "adjustment":
      return RefreshCw;

    case "reversal":
      return ArrowDownRight;
  }
}

export default function RiderEarnings({
  summary,
  earnings = [],
  currency = "NGN",
  loading = false,
  refreshing = false,
  onRefresh,
  onViewPayouts,
  onViewEarning,
  emptyTitle = "No earnings yet",
  emptyDescription =
    "Your delivery earnings and other rider payments will appear here.",
  className = "",
}: RiderEarningsProps) {
  return (
    <section
      className={[
        "space-y-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Rider earnings"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Rider Earnings
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Track your delivery income,
            available earnings, and payouts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={refreshing}
              disabled={refreshing}
              onClick={onRefresh}
            >
              <RefreshCw
                className="h-4 w-4"
                aria-hidden="true"
              />
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
              <Wallet
                className="h-4 w-4"
                aria-hidden="true"
              />
              View Payouts
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner
            size="md"
            label="Loading earnings..."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Banknote
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>

                <Badge
                  variant="success"
                  size="sm"
                >
                  Total
                </Badge>
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                Total Earnings
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatNaira(
                  summary.totalEarnings,
                  currency,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Wallet
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>

                <Badge
                  variant="info"
                  size="sm"
                >
                  Available
                </Badge>
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                Available to Withdraw
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatNaira(
                  summary.availableAmount,
                  currency,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock3
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>

                <Badge
                  variant="warning"
                  size="sm"
                >
                  Pending
                </Badge>
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                Pending Earnings
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatNaira(
                  summary.pendingAmount,
                  currency,
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <CreditCard
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Paid Out
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {formatNaira(
                      summary.paidOutAmount,
                      currency,
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <CalendarDays
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Completed Deliveries
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {formatNumber(
                      summary.deliveryCount,
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <TruckIcon />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Average Delivery
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {formatNaira(
                      summary.averageDeliveryEarning,
                      currency,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Earnings History
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Delivery earnings and financial
                  adjustments.
                </p>
              </div>

              <span className="text-xs text-slate-400">
                {formatNumber(
                  earnings.length,
                )}{" "}
                records
              </span>
            </div>

            {earnings.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Wallet}
                  title={emptyTitle}
                  description={
                    emptyDescription
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {earnings.map(
                  (earning) => {
                    const typeConfig =
                      TYPE_CONFIG[
                        earning.type
                      ];

                    const statusConfig =
                      STATUS_CONFIG[
                        earning.status
                      ];

                    const TypeIcon =
                      getTypeIcon(
                        earning.type,
                      );

                    const positive =
                      isPositiveEarning(
                        earning.type,
                      );

                    return (
                      <button
                        key={earning.id}
                        type="button"
                        className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                        onClick={() =>
                          onViewEarning?.(
                            earning,
                          )
                        }
                      >
                        <div
                          className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            positive
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600",
                          ].join(" ")}
                        >
                          <TypeIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {
                                typeConfig.label
                              }
                            </p>

                            <Badge
                              variant={
                                statusConfig.variant
                              }
                              size="sm"
                            >
                              {
                                statusConfig.label
                              }
                            </Badge>
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {earning.description ||
                              earning.reference}
                          </p>

                          {earning.orderReference && (
                            <p className="mt-1 text-xs text-slate-400">
                              Order{" "}
                              {
                                earning.orderReference
                              }
                            </p>
                          )}

                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock3
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {formatDateTime(
                              earning.createdAt,
                            )}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className={[
                              "text-sm font-bold",
                              positive
                                ? "text-emerald-600"
                                : "text-red-600",
                            ].join(" ")}
                          >
                            {positive
                              ? "+"
                              : "-"}
                            {formatNaira(
                              Math.abs(
                                earning.amount,
                              ),
                              currency,
                            )}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            {
                              earning.reference
                            }
                          </p>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function TruckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M10 17h4V5H2v12h3" />
      <path d="M14 8h4l4 4v5h-3" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
    </svg>
  );
}
