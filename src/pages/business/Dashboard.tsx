import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  WalletCards,
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import { getAuthState } from "../../libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import {
  formatDateTime,
  formatNaira,
} from "../../libs/format";
import { supabase } from "../../libs/supabase";

interface Business {
  id: string;
  name: string;
  slug: string | null;
  status: string | null;
  verification_status: string | null;
  active: boolean | null;
}

interface DashboardOrder {
  id: string;
  reference: string | null;
  status: string;
  total_amount: number;
  created_at: string;
}

interface BusinessStats {
  productCount: number;
  activeProductCount: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  grossSales: number;
  pendingEarnings: number;
  availableEarnings: number;
}

function getStatusLabel(status: string | null) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getOrderStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
    case "delivered":
      return "bg-emerald-50 text-emerald-700";

    case "paid":
    case "business_confirmed":
    case "rider_assigned":
    case "picked_up":
    case "out_for_delivery":
      return "bg-blue-50 text-blue-700";

    case "pending_payment":
    case "delivery_requested":
      return "bg-amber-50 text-amber-700";

    case "cancelled":
    case "disputed":
    case "refund_pending":
    case "refunded":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function Dashboard() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [stats, setStats] = useState<BusinessStats>({
    productCount: 0,
    activeProductCount: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    grossSales: 0,
    pendingEarnings: 0,
    availableEarnings: 0,
  });
  const [recentOrders, setRecentOrders] = useState<
    DashboardOrder[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const authState = await getAuthState();

      if (!authState.user) {
        setError("Please sign in to access your business dashboard.");
        return;
      }

      const userId = authState.user.id;

      const { data: businessRow, error: businessError } =
        await supabase
          .from("businesses")
          .select(
            "id, name, slug, status, verification_status, active"
          )
          .eq("owner_id", userId)
          .maybeSingle();

      if (businessError) {
        throw businessError;
      }

      if (!businessRow) {
        setBusiness(null);
        setError(
          "Your business profile has not been set up yet."
        );
        return;
      }

      const currentBusiness: Business = {
        id: businessRow.id,
        name: businessRow.name || "Your business",
        slug: businessRow.slug ?? null,
        status: businessRow.status ?? null,
        verification_status:
          businessRow.verification_status ?? null,
        active:
          typeof businessRow.active === "boolean"
            ? businessRow.active
            : null,
      };

      setBusiness(currentBusiness);

      const [
        productsResult,
        ordersResult,
        earningsResult,
      ] = await Promise.all([
        supabase
          .from("products")
          .select("id, active")
          .eq("business_id", currentBusiness.id),

        supabase
          .from("orders")
          .select(
            "id, reference, status, total_amount, created_at"
          )
          .eq("business_id", currentBusiness.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("business_earnings")
          .select(
            "amount, status"
          )
          .eq("business_id", currentBusiness.id),
      ]);

      if (productsResult.error) {
        throw productsResult.error;
      }

      if (ordersResult.error) {
        throw ordersResult.error;
      }

      if (earningsResult.error) {
        throw earningsResult.error;
      }

      const products = productsResult.data ?? [];
      const orders = (ordersResult.data ?? []) as DashboardOrder[];
      const earnings = earningsResult.data ?? [];

      const completedStatuses = new Set([
        "completed",
        "delivered",
      ]);

      const pendingStatuses = new Set([
        "paid",
        "business_confirmed",
        "delivery_requested",
        "rider_assigned",
        "picked_up",
        "out_for_delivery",
      ]);

      const completedOrders = orders.filter((order) =>
        completedStatuses.has(order.status)
      );

      const pendingOrders = orders.filter((order) =>
        pendingStatuses.has(order.status)
      );

      const grossSales = completedOrders.reduce(
        (sum, order) =>
          sum + (Number(order.total_amount) || 0),
        0
      );

      const pendingEarnings = earnings
        .filter((earning) =>
          ["pending", "processing"].includes(
            String(earning.status).toLowerCase()
          )
        )
        .reduce(
          (sum, earning) => sum + (Number(earning.amount) || 0),
          0
        );

      const availableEarnings = earnings
        .filter((earning) =>
          ["available", "completed", "ready"].includes(
            String(earning.status).toLowerCase()
          )
        )
        .reduce(
          (sum, earning) => sum + (Number(earning.amount) || 0),
          0
        );

      setStats({
        productCount: products.length,
        activeProductCount: products.filter(
          (product) => product.active !== false
        ).length,
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        completedOrders: completedOrders.length,
        grossSales,
        pendingEarnings,
        availableEarnings,
      });

      setRecentOrders(orders.slice(0, 6));
    } catch (err) {
      logAppError(err, {
        action: "business.dashboard.load",
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const verificationLabel = useMemo(() => {
    if (!business) {
      return "Business profile";
    }

    if (
      String(business.verification_status).toLowerCase() ===
      "verified"
    ) {
      return "Verified business";
    }

    if (
      String(business.verification_status).toLowerCase() ===
      "pending"
    ) {
      return "Verification pending";
    }

    return "Verification required";
  }, [business]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">
            Loading your business dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>

          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Business dashboard unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Business dashboard
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Welcome back, {business.name}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your products, orders, customers, and earnings.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void loadDashboard(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900">
              <Store className="h-7 w-7 text-white" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  {business.name}
                </h2>

                {business.active !== false && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {verificationLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/business/products">
                <Package className="mr-2 h-4 w-4" />
                Products
              </Link>
            </Button>

            <Button asChild>
              <Link to="/business/orders">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Orders
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">
                Total products
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {stats.productCount}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {stats.activeProductCount} active
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">
                Total orders
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {stats.totalOrders}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {stats.pendingOrders} currently active
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50">
              <ShoppingBag className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">
                Completed sales
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatNaira(stats.grossSales)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {stats.completedOrders} completed orders
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">
                Available earnings
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatNaira(stats.availableEarnings)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {formatNaira(stats.pendingEarnings)} pending
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
              <WalletCards className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Clock3 className="h-5 w-5 text-slate-600" />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Orders requiring attention
              </p>
              <p className="text-xl font-semibold text-slate-900">
                {stats.pendingOrders}
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="mt-5 w-full"
          >
            <Link to="/business/orders">
              Review orders
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <ArrowDownToLine className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Pending earnings
              </p>
              <p className="text-xl font-semibold text-slate-900">
                {formatNaira(stats.pendingEarnings)}
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="mt-5 w-full"
          >
            <Link to="/business/earnings">
              View earnings
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <ArrowUpRight className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Available to withdraw
              </p>
              <p className="text-xl font-semibold text-slate-900">
                {formatNaira(stats.availableEarnings)}
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="mt-5 w-full"
          >
            <Link to="/business/payouts">
              Manage payouts
            </Link>
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-900">
              Recent orders
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Latest customer orders for your business.
            </p>
          </div>

          <Button asChild variant="ghost" size="sm">
            <Link to="/business/orders">
              View all
            </Link>
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-6 w-6 text-slate-400" />
            </div>

            <h3 className="mt-4 font-medium text-slate-900">
              No orders yet
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Customer orders will appear here when your products
              start selling.
            </p>

            <Button asChild className="mt-5">
              <Link to="/business/products/new">
                Add a product
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/business/orders/${order.id}`}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {order.reference || `Order ${order.id}`}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(order.created_at)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusClass(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {formatNaira(
                      Number(order.total_amount) || 0
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
