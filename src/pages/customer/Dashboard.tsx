import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Clock3,
  MapPin,
  Package,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getAuthState } from "../../libs/auth";
import { formatNaira } from "../../libs/format";
import { getSafeErrorMessage } from "../../libs/errors";
import { supabase } from "../../libs/supabase";

type DashboardOrder = {
  id: string;
  reference: string | null;
  status: string;
  total_amount: number;
  created_at: string;
};

type WalletSummary = {
  available_balance: number;
  pending_balance: number;
};

type CustomerProfile = {
  full_name: string | null;
  phone: string | null;
};

const quickActions = [
  {
    label: "Explore products",
    description: "Find products from local businesses",
    href: "/explore",
    icon: ShoppingBag,
  },
  {
    label: "My orders",
    description: "View and track your purchases",
    href: "/customer/orders",
    icon: Package,
  },
  {
    label: "My wallet",
    description: "Manage your IyanjuWorld wallet",
    href: "/customer/wallet",
    icon: Wallet,
  },
];

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getStatusClasses(status: string) {
  switch (status) {
    case "completed":
    case "delivered":
      return "bg-emerald-50 text-emerald-700";

    case "cancelled":
    case "refunded":
      return "bg-red-50 text-red-700";

    case "out_for_delivery":
    case "picked_up":
    case "rider_assigned":
      return "bg-brand-50 text-brand-700";

    case "paid":
    case "business_confirmed":
    case "delivery_requested":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function CustomerDashboard() {
  const [profile, setProfile] =
    useState<CustomerProfile | null>(null);

  const [wallet, setWallet] =
    useState<WalletSummary>({
      available_balance: 0,
      pending_balance: 0,
    });

  const [orders, setOrders] = useState<
    DashboardOrder[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const authState = await getAuthState();

        if (!authState.user || !authState.profile) {
          throw new Error(
            "Your session could not be verified. Please sign in again.",
          );
        }

        if (authState.profile.role !== "customer") {
          throw new Error(
            "This dashboard is only available to customer accounts.",
          );
        }

        if (!mounted) {
          return;
        }

        setProfile({
          full_name: authState.profile.full_name ?? null,
          phone: authState.profile.phone ?? null,
        });

        /*
         * Wallet and order data are loaded independently so
         * a problem with one area does not expose raw backend
         * errors or prevent the rest of the dashboard from
         * rendering.
         */

        const [walletResult, ordersResult] =
          await Promise.all([
            supabase
              .from("customer_wallets")
              .select(
                "available_balance, pending_balance",
              )
              .eq("customer_id", authState.user.id)
              .maybeSingle(),

            supabase
              .from("orders")
              .select(
                "id, reference, status, total_amount, created_at",
              )
              .eq("customer_id", authState.user.id)
              .order("created_at", {
                ascending: false,
              })
              .limit(5),
          ]);

        if (!mounted) {
          return;
        }

        if (walletResult.error) {
          console.error(
            "[CustomerDashboard] Wallet loading failed:",
            walletResult.error,
          );
        } else if (walletResult.data) {
          setWallet({
            available_balance:
              Number(
                walletResult.data
                  .available_balance,
              ) || 0,

            pending_balance:
              Number(
                walletResult.data.pending_balance,
              ) || 0,
          });
        }

        if (ordersResult.error) {
          console.error(
            "[CustomerDashboard] Orders loading failed:",
            ordersResult.error,
          );
        } else {
          setOrders(
            (ordersResult.data ??
              []) as DashboardOrder[],
          );
        }
      } catch (dashboardError) {
        console.error(
          "[CustomerDashboard] Dashboard loading failed:",
          dashboardError,
        );

        if (mounted) {
          setError(
            getSafeErrorMessage(
              dashboardError,
            ) ||
              "We could not load your dashboard. Please try again.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    "there";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">
              Customer dashboard
            </p>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {firstName}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Discover products from businesses on
              IyanjuWorld and manage your purchases in
              one place.
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Start shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          to="/customer/wallet"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Wallet className="h-5 w-5" />
            </div>

            <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            Available wallet balance
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading
              ? "₦—"
              : formatNaira(
                  wallet.available_balance,
                )}
          </p>

          {wallet.pending_balance > 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              {formatNaira(
                wallet.pending_balance,
              )} pending
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Ready for marketplace purchases
            </p>
          )}
        </Link>

        <Link
          to="/customer/orders"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Package className="h-5 w-5" />
            </div>

            <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            Recent orders
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loading ? "—" : orders.length}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            View your complete order history
          </p>
        </Link>

        <Link
          to="/customer/messages"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:col-span-2 xl:col-span-1"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Bell className="h-5 w-5" />
            </div>

            <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            Messages & notifications
          </p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            Stay updated
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Communicate with businesses and riders
          </p>
        </Link>
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Quick actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Common things you can do on IyanjuWorld
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                to={action.href}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-brand-50 group-hover:text-brand-700">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {action.label}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {action.description}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent orders */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Recent orders
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Your latest marketplace activity
            </p>
          </div>

          <Link
            to="/customer/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-5 sm:p-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-xl bg-slate-100 p-5"
              >
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-48 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <ShoppingBag className="h-5 w-5" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No orders yet
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Explore the marketplace and place your first
              order from a trusted business.
            </p>

            <Link
              to="/explore"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Explore marketplace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/customer/orders/${order.id}`}
                className="group flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Package className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {order.reference ||
                        `Order #${order.id.slice(0, 8).toUpperCase()}`}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {new Date(
                          order.created_at,
                        ).toLocaleDateString()}
                      </span>

                      <span className="text-slate-300">
                        •
                      </span>

                      <span>
                        {formatNaira(
                          Number(
                            order.total_amount,
                          ) || 0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                      order.status,
                    )}`}
                  >
                    {formatStatus(
                      order.status,
                    )}
                  </span>

                  <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Delivery reminder */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Keep your delivery details updated
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Accurate delivery information helps businesses
              and riders complete your orders smoothly.
            </p>

            <Link
              to="/customer/profile"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Manage your profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
