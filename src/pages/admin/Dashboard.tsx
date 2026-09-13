import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  DollarSign,
  Package,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AdminStats } from "@/components/admin/AdminStats";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatDateTime, formatNaira } from "@/libs/format";

interface DashboardActivity {
  id: string;
  type:
    | "order"
    | "payment"
    | "business"
    | "rider"
    | "dispute"
    | "payout";
  title: string;
  description: string;
  createdAt: string | Date;
  status?: string;
  amount?: number;
}

interface AdminDashboardData {
  totalCustomers: number;
  activeCustomers: number;

  totalBusinesses: number;
  activeBusinesses: number;

  totalRiders: number;
  onlineRiders: number;
  availableRiders: number;
  ridersOnDelivery: number;

  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;

  totalRevenue: number;
  platformFees: number;

  pendingPayments: number;
  pendingPayouts: number;

  walletBalance: number;
  openDisputes: number;

  recentActivity: DashboardActivity[];
}

const defaultData: AdminDashboardData = {
  totalCustomers: 0,
  activeCustomers: 0,

  totalBusinesses: 0,
  activeBusinesses: 0,

  totalRiders: 0,
  onlineRiders: 0,
  availableRiders: 0,
  ridersOnDelivery: 0,

  totalOrders: 0,
  pendingOrders: 0,
  completedOrders: 0,

  totalRevenue: 0,
  platformFees: 0,

  pendingPayments: 0,
  pendingPayouts: 0,

  walletBalance: 0,
  openDisputes: 0,

  recentActivity: [],
};

interface AdminDashboardProps {
  data?: Partial<AdminDashboardData>;
  loading?: boolean;
  onRefresh?: () => void;
}

const activityIcons = {
  order: Package,
  payment: CreditCard,
  business: Store,
  rider: Truck,
  dispute: AlertTriangle,
  payout: DollarSign,
};

const activityBadgeVariants = {
  order: "info",
  payment: "success",
  business: "warning",
  rider: "info",
  dispute: "danger",
  payout: "success",
} as const;

function getDashboardData(
  data?: Partial<AdminDashboardData>,
): AdminDashboardData {
  return {
    ...defaultData,
    ...data,
    recentActivity: data?.recentActivity ?? [],
  };
}

export default function AdminDashboard({
  data,
  loading = false,
  onRefresh,
}: AdminDashboardProps) {
  const dashboard = getDashboardData(data);

  const stats = [
    {
      id: "customers",
      label: "Total customers",
      value: dashboard.totalCustomers,
      format: "number" as const,
      icon: Users,
      description: `${dashboard.activeCustomers.toLocaleString()} active`,
    },
    {
      id: "businesses",
      label: "Businesses",
      value: dashboard.totalBusinesses,
      format: "number" as const,
      icon: Store,
      description: `${dashboard.activeBusinesses.toLocaleString()} active`,
    },
    {
      id: "riders",
      label: "Riders",
      value: dashboard.totalRiders,
      format: "number" as const,
      icon: Truck,
      description: `${dashboard.onlineRiders.toLocaleString()} online`,
    },
    {
      id: "orders",
      label: "Total orders",
      value: dashboard.totalOrders,
      format: "number" as const,
      icon: Package,
      description: `${dashboard.pendingOrders.toLocaleString()} pending`,
    },
    {
      id: "revenue",
      label: "Marketplace revenue",
      value: dashboard.totalRevenue,
      format: "currency" as const,
      icon: DollarSign,
      description: `${formatNaira(dashboard.platformFees)} platform fees`,
    },
    {
      id: "payments",
      label: "Pending payments",
      value: dashboard.pendingPayments,
      format: "number" as const,
      icon: CreditCard,
    },
    {
      id: "payouts",
      label: "Pending payouts",
      value: dashboard.pendingPayouts,
      format: "number" as const,
      icon: Activity,
    },
    {
      id: "disputes",
      label: "Open disputes",
      value: dashboard.openDisputes,
      format: "number" as const,
      icon: AlertTriangle,
    },
  ];

  const deliverySummary = [
    {
      label: "Online",
      value: dashboard.onlineRiders,
      variant: "info" as const,
    },
    {
      label: "Available",
      value: dashboard.availableRiders,
      variant: "success" as const,
    },
    {
      label: "On delivery",
      value: dashboard.ridersOnDelivery,
      variant: "warning" as const,
    },
  ];

  return (
    <PageContainer size="full">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor marketplace operations, payments,
              deliveries, and financial activity.
            </p>
          </div>

          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              loading={loading}
            >
              Refresh
            </Button>
          )}
        </div>

        <AdminStats
          stats={stats}
          loading={loading}
          columns={4}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Recent activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest important events across the
                  marketplace.
                </p>
              </div>

              <Link
                to="/admin/audit"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                View audit
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {dashboard.recentActivity.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                <Activity className="mb-3 h-8 w-8 text-slate-400" />

                <p className="text-sm font-medium text-slate-700">
                  No recent activity
                </p>

                <p className="mt-1 max-w-sm text-xs text-slate-500">
                  Important marketplace events will
                  appear here as they occur.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dashboard.recentActivity
                  .slice(0, 8)
                  .map((activity) => {
                    const Icon =
                      activityIcons[activity.type];

                    const badgeVariant =
                      activityBadgeVariants[
                        activity.type
                      ];

                    return (
                      <div
                        key={activity.id}
                        className="flex gap-3 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <Icon className="h-4 w-4 text-slate-600" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-slate-800">
                              {activity.title}
                            </p>

                            {activity.status && (
                              <Badge
                                variant={badgeVariant}
                                size="sm"
                              >
                                {activity.status}
                              </Badge>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {activity.description}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(
                              activity.createdAt,
                            )}
                          </p>
                        </div>

                        {activity.amount !==
                          undefined && (
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatNaira(
                                activity.amount,
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                Delivery network
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current rider availability.
              </p>
            </div>

            <div className="space-y-3">
              {deliverySummary.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.variant}
                      size="sm"
                      dot
                    >
                      {item.label}
                    </Badge>
                  </div>

                  <span className="text-lg font-semibold text-slate-900">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <Link
                to="/admin/riders"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Manage riders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link
            to="/admin/orders"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Package className="h-5 w-5 text-slate-600" />
              </div>

              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              Order operations
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {dashboard.pendingOrders.toLocaleString()}{" "}
              orders currently need attention.
            </p>
          </Link>

          <Link
            to="/admin/payments"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <CreditCard className="h-5 w-5 text-slate-600" />
              </div>

              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              Payment monitoring
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Review pending payments and transaction
              activity.
            </p>
          </Link>

          <Link
            to="/admin/disputes"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <AlertTriangle className="h-5 w-5 text-slate-600" />
              </div>

              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              Dispute management
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {dashboard.openDisputes.toLocaleString()}{" "}
              open disputes require review.
            </p>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Financial overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current marketplace financial indicators.
              </p>
            </div>

            <Link
              to="/admin/fees"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              View fee settings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Marketplace revenue
              </p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {formatNaira(
                  dashboard.totalRevenue,
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Platform fees
              </p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {formatNaira(
                  dashboard.platformFees,
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Wallet balance
              </p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {formatNaira(
                  dashboard.walletBalance,
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Completed orders
              </p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {dashboard.completedOrders.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
