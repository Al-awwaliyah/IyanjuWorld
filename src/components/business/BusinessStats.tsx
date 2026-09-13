import type { LucideIcon } from "lucide-react";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import {
  formatNaira,
  formatNumber,
  formatPercentage,
} from "../../libs/format";

export type BusinessStatTrend =
  | "up"
  | "down"
  | "neutral";

export type BusinessStatFormat =
  | "number"
  | "currency"
  | "percentage";

export interface BusinessStat {
  id: string;
  label: string;
  value: number;
  format?: BusinessStatFormat;
  icon?: LucideIcon;
  trend?: number | null;
  trendLabel?: string;
  trendDirection?: BusinessStatTrend;
  description?: string;
}

export interface BusinessStatsProps {
  stats?: BusinessStat[];
  orders?: number;
  sales?: number;
  earnings?: number;
  products?: number;
  customers?: number;
  className?: string;
}

const defaultIcons: LucideIcon[] = [
  ShoppingBag,
  DollarSign,
  Package,
  Users,
];

function formatStatValue(
  value: number,
  format: BusinessStatFormat = "number",
) {
  switch (format) {
    case "currency":
      return formatNaira(value);

    case "percentage":
      return formatPercentage(value);

    default:
      return formatNumber(value);
  }
}

function getDefaultStats({
  orders,
  sales,
  earnings,
  products,
  customers,
}: BusinessStatsProps): BusinessStat[] {
  const stats: BusinessStat[] = [];

  if (orders !== undefined) {
    stats.push({
      id: "orders",
      label: "Orders",
      value: orders,
      format: "number",
      icon: ShoppingBag,
    });
  }

  if (sales !== undefined) {
    stats.push({
      id: "sales",
      label: "Sales",
      value: sales,
      format: "currency",
      icon: DollarSign,
    });
  }

  if (earnings !== undefined) {
    stats.push({
      id: "earnings",
      label: "Earnings",
      value: earnings,
      format: "currency",
      icon: DollarSign,
    });
  }

  if (products !== undefined) {
    stats.push({
      id: "products",
      label: "Products",
      value: products,
      format: "number",
      icon: Package,
    });
  }

  if (customers !== undefined) {
    stats.push({
      id: "customers",
      label: "Customers",
      value: customers,
      format: "number",
      icon: Users,
    });
  }

  return stats;
}

function getTrendDirection(
  trend: number,
): BusinessStatTrend {
  if (trend > 0) {
    return "up";
  }

  if (trend < 0) {
    return "down";
  }

  return "neutral";
}

export default function BusinessStats({
  stats,
  orders,
  sales,
  earnings,
  products,
  customers,
  className = "",
}: BusinessStatsProps) {
  const resolvedStats =
    stats?.length
      ? stats
      : getDefaultStats({
          orders,
          sales,
          earnings,
          products,
          customers,
        });

  if (resolvedStats.length === 0) {
    return null;
  }

  return (
    <div
      className={[
        "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {resolvedStats.map(
        (stat, index) => {
          const Icon =
            stat.icon ||
            defaultIcons[
              index %
                defaultIcons.length
            ];

          const trend =
            stat.trend === null ||
            stat.trend === undefined
              ? null
              : stat.trend;

          const direction =
            stat.trendDirection ||
            (trend !== null
              ? getTrendDirection(
                  trend,
                )
              : "neutral");

          return (
            <article
              key={stat.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>

                {trend !== null && (
                  <div
                    className={[
                      "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                      direction === "up"
                        ? "bg-emerald-50 text-emerald-600"
                        : direction === "down"
                          ? "bg-red-50 text-red-600"
                          : "bg-slate-100 text-slate-500",
                    ].join(" ")}
                  >
                    {direction ===
                      "up" && (
                      <ArrowUpRight
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    )}

                    {direction ===
                      "down" && (
                      <ArrowDownRight
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    )}

                    {formatPercentage(
                      Math.abs(trend),
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {formatStatValue(
                    stat.value,
                    stat.format,
                  )}
                </p>

                {(stat.description ||
                  stat.trendLabel) && (
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {stat.description ||
                      stat.trendLabel}
                  </p>
                )}
              </div>
            </article>
          );
        },
      )}
    </div>
  );
}
