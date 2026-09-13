import type { LucideIcon } from "lucide-react";

import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CircleDollarSign,
  Package,
  ShoppingCart,
  Store,
  Truck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

import {
  formatNaira,
  formatNumber,
  formatPercentage,
} from "../../libs/format";

export type AdminStatFormat =
  | "number"
  | "currency"
  | "percentage";

export type AdminStatTrendDirection =
  | "up"
  | "down"
  | "neutral";

export interface AdminStat {
  id: string;
  label: string;
  value: number;
  format?: AdminStatFormat;

  icon?: LucideIcon;

  trend?: number | null;
  trendLabel?: string;
  trendDirection?: AdminStatTrendDirection;

  description?: string;
}

export interface AdminStatsData {
  totalCustomers?: number;
  activeCustomers?: number;

  totalBusinesses?: number;
  activeBusinesses?: number;
  pendingBusinesses?: number;

  totalRiders?: number;
  onlineRiders?: number;
  availableRiders?: number;
  ridersOnDelivery?: number;

  totalOrders?: number;
  pendingOrders?: number;
  completedOrders?: number;

  totalRevenue?: number;
  platformFees?: number;
  pendingPayments?: number;

  walletBalance?: number;
  pendingPayouts?: number;

  disputes?: number;
}

export interface AdminStatsProps {
  stats?: AdminStat[];
  data?: AdminStatsData;

  currency?: string;

  loading?: boolean;

  columns?: 2 | 3 | 4 | 5 | 6;

  className?: string;
}

const DEFAULT_STATS: AdminStat[] = [];

function createDefaultStats(
  data: AdminStatsData,
): AdminStat[] {
  const stats: AdminStat[] = [];

  if (data.totalCustomers != null) {
    stats.push({
      id: "customers",
      label: "Customers",
      value: data.totalCustomers,
      format: "number",
      icon: Users,
      description:
        data.activeCustomers != null
          ? `${formatNumber(
              data.activeCustomers,
            )} active`
          : undefined,
    });
  }

  if (data.totalBusinesses != null) {
    stats.push({
      id: "businesses",
      label: "Businesses",
      value: data.totalBusinesses,
      format: "number",
      icon: Store,
      description:
        data.activeBusinesses != null
          ? `${formatNumber(
              data.activeBusinesses,
            )} active`
          : data.pendingBusinesses != null
            ? `${formatNumber(
                data.pendingBusinesses,
              )} pending`
            : undefined,
    });
  }

  if (data.totalRiders != null) {
    stats.push({
      id: "riders",
      label: "Riders",
      value: data.totalRiders,
      format: "number",
      icon: Truck,
      description:
        data.ridersOnDelivery != null
          ? `${formatNumber(
              data.ridersOnDelivery,
            )} on delivery`
          : data.onlineRiders != null
            ? `${formatNumber(
                data.onlineRiders,
              )} online`
            : undefined,
    });
  }

  if (data.totalOrders != null) {
    stats.push({
      id: "orders",
      label: "Orders",
      value: data.totalOrders,
      format: "number",
      icon: ShoppingCart,
      description:
        data.completedOrders != null
          ? `${formatNumber(
              data.completedOrders,
            )} completed`
          : data.pendingOrders != null
            ? `${formatNumber(
                data.pendingOrders,
              )} pending`
            : undefined,
    });
  }

  if (data.totalRevenue != null) {
    stats.push({
      id: "revenue",
      label: "Revenue",
      value: data.totalRevenue,
      format: "currency",
      icon: CircleDollarSign,
    });
  }

  if (data.platformFees != null) {
    stats.push({
      id: "platform-fees",
      label: "Platform Fees",
      value: data.platformFees,
      format: "currency",
      icon: Banknote,
    });
  }

  if (data.pendingPayments != null) {
    stats.push({
      id: "pending-payments",
      label: "Pending Payments",
      value: data.pendingPayments,
      format: "currency",
      icon: Wallet,
    });
  }

  if (data.pendingPayouts != null) {
    stats.push({
      id: "pending-payouts",
      label: "Pending Payouts",
      value: data.pendingPayouts,
      format: "currency",
      icon: Banknote,
    });
  }

  if (data.walletBalance != null) {
    stats.push({
      id: "wallet-balance",
      label: "Customer Wallet Funds",
      value: data.walletBalance,
      format: "currency",
      icon: Wallet,
    });
  }

  if (data.disputes != null) {
    stats.push({
      id: "disputes",
      label: "Open Disputes",
      value: data.disputes,
      format: "number",
      icon: Package,
    });
  }

  return stats;
}

function formatStatValue(
  value: number,
  format: AdminStatFormat,
  currency: string,
) {
  switch (format) {
    case "currency":
      return formatNaira(
        value,
        currency,
      );

    case "percentage":
      return formatPercentage(value);

    case "number":
    default:
      return formatNumber(value);
  }
}

function getGridClass(
  columns: AdminStatsProps["columns"],
) {
  switch (columns) {
    case 2:
      return "grid-cols-1 sm:grid-cols-2";

    case 3:
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

    case 5:
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

    case 6:
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6";

    case 4:
    default:
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  }
}

function getTrendDirection(
  trend: number,
  direction?: AdminStatTrendDirection,
): AdminStatTrendDirection {
  if (direction) {
    return direction;
  }

  if (trend > 0) {
    return "up";
  }

  if (trend < 0) {
    return "down";
  }

  return "neutral";
}

function getTrendClasses(
  direction: AdminStatTrendDirection,
) {
  switch (direction) {
    case "up":
      return "text-emerald-600";

    case "down":
      return "text-red-600";

    case "neutral":
    default:
      return "text-slate-500";
  }
}

export default function AdminStats({
  stats,
  data,
  currency = "NGN",
  loading = false,
  columns = 4,
  className = "",
}: AdminStatsProps) {
  const resolvedStats =
    stats ??
    (data
      ? createDefaultStats(data)
      : DEFAULT_STATS);

  return (
    <section
      className={[
        "grid gap-4",
        getGridClass(columns),
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Administration statistics"
    >
      {loading
        ? Array.from({
            length: columns,
          }).map((_, index) => (
            <div
              key={`admin-stat-skeleton-${index}`}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))
        : resolvedStats.map(
            (stat) => {
              const Icon =
                stat.icon ??
                UserRound;

              const trend =
                stat.trend != null
                  ? getTrendDirection(
                      stat.trend,
                      stat.trendDirection,
                    )
                  : null;

              return (
                <article
                  key={stat.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Icon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>

                    {trend && (
                      <div
                        className={[
                          "flex items-center gap-1 text-xs font-medium",
                          getTrendClasses(
                            trend,
                          ),
                        ].join(" ")}
                      >
                        {trend ===
                          "up" && (
                          <ArrowUpRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        )}

                        {trend ===
                          "down" && (
                          <ArrowDownRight
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        )}

                        {trend ===
                          "neutral" && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-current"
                            aria-hidden="true"
                          />
                        )}

                        <span>
                          {Math.abs(
                            stat.trend ??
                              0,
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </p>

                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      {formatStatValue(
                        stat.value,
                        stat.format ??
                          "number",
                        currency,
                      )}
                    </p>
                  </div>

                  {(stat.trendLabel ||
                    stat.description) && (
                    <div className="mt-2">
                      {stat.trendLabel && (
                        <p className="text-xs text-slate-500">
                          {stat.trendLabel}
                        </p>
                      )}

                      {stat.description && (
                        <p className="text-xs text-slate-400">
                          {stat.description}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            },
          )}
    </section>
  );
}
