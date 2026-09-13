import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Package,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getAuthState } from "../../libs/auth";
import {
  formatDate,
  formatNaira,
  getSafeErrorMessage,
} from "../../libs/format";
import { supabase } from "../../libs/supabase";

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "business_confirmed"
  | "delivery_requested"
  | "rider_assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refund_pending"
  | "refunded"
  | "disputed"
  | string;

interface CustomerOrder {
  id: string;
  reference: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  item_count?: number | null;
}

type FilterKey = "all" | "active" | "completed" | "cancelled";

const ACTIVE_STATUSES = new Set([
  "pending_payment",
  "paid",
  "business_confirmed",
  "delivery_requested",
  "rider_assigned",
  "picked_up",
  "out_for_delivery",
  "refund_pending",
  "disputed",
]);

const COMPLETED_STATUSES = new Set(["delivered", "completed", "refunded"]);

const CANCELLED_STATUSES = new Set(["cancelled"]);

function formatStatus(status: string) {
  switch (status) {
    case "pending_payment":
      return "Pending payment";
    case "paid":
      return "Paid";
    case "business_confirmed":
      return "Confirmed";
    case "delivery_requested":
      return "Finding rider";
    case "rider_assigned":
      return "Rider assigned";
    case "picked_up":
      return "Picked up";
    case "out_for_delivery":
      return "Out for delivery";
    case "delivered":
      return "Delivered";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "refund_pending":
      return "Refund pending";
    case "refunded":
      return "Refunded";
    case "disputed":
      return "Disputed";
    default:
      return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}

function getStatusClasses(status: string) {
  if (CANCELLED_STATUSES.has(status)) {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  if (COMPLETED_STATUSES.has(status)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "pending_payment") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (status === "refund_pending" || status === "disputed") {
    return "bg-orange-50 text-orange-700 ring-orange-200";
  }

  return "bg-blue-50 text-blue-700 ring-blue-200";
}

function getStatusIcon(status: string) {
  if (CANCELLED_STATUSES.has(status)) {
    return <XCircle className="h-4 w-4" />;
  }

  if (COMPLETED_STATUSES.has(status)) {
    return <Package className="h-4 w-4" />;
  }

  if (
    status === "out_for_delivery" ||
    status === "picked_up" ||
    status === "rider_assigned"
  ) {
    return <Truck className="h-4 w-4" />;
  }

  if (status === "pending_payment") {
    return <Clock3 className="h-4 w-4" />;
  }

  return <ShoppingBag className="h-4 w-4" />;
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const authState = await getAuthState();

        if (!authState.user || !authState.profile) {
          throw new Error("Please sign in to view your orders.");
        }

        if (authState.profile.role !== "customer") {
          throw new Error("This order area is only available to customers.");
        }

        const { data, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, reference, status, total_amount, created_at"
          )
          .eq("customer_id", authState.user.id)
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.error("CustomerOrders: failed to load orders", ordersError);
          throw ordersError;
        }

        if (mounted) {
          setOrders((data ?? []) as CustomerOrder[]);
        }
      } catch (loadError) {
        console.error("CustomerOrders: unexpected load error", loadError);

        if (mounted) {
          setError(
            getSafeErrorMessage(
              loadError,
              "We couldn't load your orders right now. Please try again."
            )
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "active"
            ? ACTIVE_STATUSES.has(order.status)
            : filter === "completed"
              ? COMPLETED_STATUSES.has(order.status)
              : CANCELLED_STATUSES.has(order.status);

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const reference = order.reference?.toLowerCase() ?? "";
      const status = formatStatus(order.status).toLowerCase();

      return (
        reference.includes(normalizedSearch) ||
        status.includes(normalizedSearch)
      );
    });
  }, [orders, filter, search]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter((order) => ACTIVE_STATUSES.has(order.status)).length,
      completed: orders.filter((order) =>
        COMPLETED_STATUSES.has(order.status)
      ).length,
      cancelled: orders.filter((order) =>
        CANCELLED_STATUSES.has(order.status)
      ).length,
    };
  }, [orders]);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-blue-600">
              Customer dashboard
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My orders
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track your purchases and manage your order history.
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <ShoppingBag className="h-4 w-4" />
            Continue shopping
          </Link>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              key: "all" as const,
              label: "All orders",
              value: counts.all,
            },
            {
              key: "active" as const,
              label: "Active",
              value: counts.active,
            },
            {
              key: "completed" as const,
              label: "Completed",
              value: counts.completed,
            },
            {
              key: "cancelled" as const,
              label: "Cancelled",
              value: counts.cancelled,
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-2xl border p-4 text-left transition ${
                filter === item.key
                  ? "border-blue-200 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-xs font-medium text-slate-500">
                {item.label}
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {item.value}
              </p>
            </button>
          ))}
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by order reference or status"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {[
                ["all", "All"],
                ["active", "Active"],
                ["completed", "Completed"],
                ["cancelled", "Cancelled"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key as FilterKey)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    filter === key
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Package className="h-7 w-7 text-slate-400" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {orders.length === 0
                ? "You haven't placed an order yet"
                : "No orders found"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {orders.length === 0
                ? "Explore products from trusted businesses and place your first order."
                : "Try another search term or change the selected order filter."}
            </p>

            {orders.length === 0 && (
              <Link
                to="/explore"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Explore marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Link
                key={order.id}
                to={`/customer/orders/${order.id}`}
                className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      {getStatusIcon(order.status)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-semibold text-slate-900">
                          {order.reference || `Order ${order.id.slice(0, 8)}`}
                        </h2>

                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(
                            order.status
                          )}`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(order.created_at)}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" />
                          Marketplace order
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                    <div>
                      <p className="text-xs text-slate-500">Order total</p>
                      <p className="mt-1 text-base font-bold text-slate-900">
                        {formatNaira(order.total_amount)}
                      </p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Find more products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
