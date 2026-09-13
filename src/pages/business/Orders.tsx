

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { supabase } from "../../libs/supabase";
import { getCurrentProfile, type Profile } from "../../libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import { formatDateTime, formatNaira } from "../../libs/format";

type Business = {
  id: string;
  name: string;
  owner_id: string;
};

type Order = {
  id: string;
  reference: string | null;
  customer_id: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  created_at: string;
  updated_at: string | null;
};

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type OrderRow = Order & {
  customer?: Customer;
};

type StatusFilter =
  | "all"
  | "pending"
  | "paid"
  | "processing"
  | "delivery"
  | "completed"
  | "cancelled";

const statusLabels: Record<string, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  business_confirmed: "Confirmed",
  delivery_requested: "Delivery Requested",
  rider_assigned: "Rider Assigned",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refund_pending: "Refund Pending",
  refunded: "Refunded",
  disputed: "Disputed",
};

function getStatusLabel(status: string) {
  return (
    statusLabels[status] ||
    status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function getStatusClass(status: string) {
  switch (status) {
    case "paid":
    case "business_confirmed":
      return "bg-blue-50 text-blue-700";

    case "delivery_requested":
    case "rider_assigned":
    case "picked_up":
    case "out_for_delivery":
      return "bg-amber-50 text-amber-700";

    case "delivered":
    case "completed":
      return "bg-green-50 text-green-700";

    case "cancelled":
    case "refunded":
    case "disputed":
      return "bg-red-50 text-red-700";

    case "refund_pending":
      return "bg-purple-50 text-purple-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function matchesStatusFilter(status: string, filter: StatusFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "pending") {
    return status === "pending_payment";
  }

  if (filter === "paid") {
    return status === "paid";
  }

  if (filter === "processing") {
    return status === "business_confirmed";
  }

  if (filter === "delivery") {
    return [
      "delivery_requested",
      "rider_assigned",
      "picked_up",
      "out_for_delivery",
    ].includes(status);
  }

  if (filter === "completed") {
    return ["delivered", "completed"].includes(status);
  }

  if (filter === "cancelled") {
    return ["cancelled", "refunded", "disputed"].includes(status);
  }

  return true;
}

export default function BusinessOrders() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const currentProfile = await getCurrentProfile();

      if (!currentProfile) {
        throw new Error("Unable to load your account.");
      }

      setProfile(currentProfile);

      const { data: businessData, error: businessError } =
        await supabase
          .from("businesses")
          .select("id, name, owner_id")
          .eq("owner_id", currentProfile.id)
          .maybeSingle();

      if (businessError) {
        throw businessError;
      }

      if (!businessData) {
        throw new Error(
          "Your business profile could not be found.",
        );
      }

      setBusiness(businessData as Business);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          "id, reference, customer_id, status, subtotal, delivery_fee, total_amount, created_at, updated_at",
        )
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false });

      if (orderError) {
        throw orderError;
      }

      const loadedOrders = (orderData ?? []) as Order[];

      if (loadedOrders.length === 0) {
        setOrders([]);
        return;
      }

      const customerIds = [
        ...new Set(
          loadedOrders
            .map((order) => order.customer_id)
            .filter(Boolean),
        ),
      ];

      let customers: Customer[] = [];

      if (customerIds.length > 0) {
        const { data: customerData, error: customerError } =
          await supabase
            .from("profiles")
            .select("id, full_name, email, phone")
            .in("id", customerIds);

        if (customerError) {
          throw customerError;
        }

        customers = (customerData ?? []) as Customer[];
      }

      const customerMap = new Map(
        customers.map((customer) => [customer.id, customer]),
      );

      setOrders(
        loadedOrders.map((order) => ({
          ...order,
          customer: customerMap.get(order.customer_id),
        })),
      );
    } catch (err) {
      logAppError("business-orders-load", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      if (!matchesStatusFilter(order.status, statusFilter)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const customerName = order.customer?.full_name || "";
      const customerEmail = order.customer?.email || "";
      const customerPhone = order.customer?.phone || "";
      const reference = order.reference || order.id;

      return [
        reference,
        customerName,
        customerEmail,
        customerPhone,
        order.status,
      ].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    });
  }, [orders, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(
        (order) => order.status === "pending_payment",
      ).length,
      paid: orders.filter((order) => order.status === "paid").length,
      processing: orders.filter(
        (order) => order.status === "business_confirmed",
      ).length,
      delivery: orders.filter((order) =>
        [
          "delivery_requested",
          "rider_assigned",
          "picked_up",
          "out_for_delivery",
        ].includes(order.status),
      ).length,
      completed: orders.filter((order) =>
        ["delivered", "completed"].includes(order.status),
      ).length,
    };
  }, [orders]);

  const totalVisibleValue = useMemo(
    () =>
      filteredOrders.reduce(
        (total, order) => total + Number(order.total_amount || 0),
        0,
      ),
    [filteredOrders],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading orders...</span>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-gray-400" />

          <h1 className="text-xl font-semibold text-gray-900">
            Business profile unavailable
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "We could not find a business associated with your account."}
          </p>

          <Link
            to="/business/settings"
            className="mt-6 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Open Business Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Orders
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage orders received by {business.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`rounded-2xl border p-5 text-left shadow-sm transition ${
            statusFilter === "all"
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <ShoppingBag className="mb-3 h-5 w-5" />

          <p className="text-sm opacity-70">All Orders</p>
          <p className="mt-1 text-2xl font-bold">{counts.all}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={`rounded-2xl border p-5 text-left shadow-sm transition ${
            statusFilter === "pending"
              ? "border-amber-500 bg-amber-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <Clock3 className="mb-3 h-5 w-5 text-amber-600" />

          <p className="text-sm text-gray-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {counts.pending}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("paid")}
          className={`rounded-2xl border p-5 text-left shadow-sm transition ${
            statusFilter === "paid"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <Package className="mb-3 h-5 w-5 text-blue-600" />

          <p className="text-sm text-gray-500">Paid</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {counts.paid}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("delivery")}
          className={`rounded-2xl border p-5 text-left shadow-sm transition ${
            statusFilter === "delivery"
              ? "border-orange-500 bg-orange-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <Truck className="mb-3 h-5 w-5 text-orange-600" />

          <p className="text-sm text-gray-500">Delivery</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {counts.delivery}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("completed")}
          className={`rounded-2xl border p-5 text-left shadow-sm transition ${
            statusFilter === "completed"
              ? "border-green-500 bg-green-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <ShoppingBag className="mb-3 h-5 w-5 text-green-600" />

          <p className="text-sm text-gray-500">Completed</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {counts.completed}
          </p>
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Order Management
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredOrders.length} order
                {filteredOrders.length === 1 ? "" : "s"} shown
                {filteredOrders.length > 0 &&
                  ` • ${formatNaira(totalVisibleValue)} total order value`}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search orders..."
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />
              </div>

              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as StatusFilter,
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 sm:w-48"
                >
                  <option value="all">All orders</option>
                  <option value="pending">Pending payment</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="delivery">Delivery</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-gray-300" />

            <h3 className="text-lg font-semibold text-gray-900">
              {orders.length === 0
                ? "No orders yet"
                : "No matching orders"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              {orders.length === 0
                ? "Orders placed for your products will appear here."
                : "Try changing the search term or order status filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredOrders.map((order) => {
              const customerName =
                order.customer?.full_name ||
                order.customer?.email ||
                "Customer";

              const orderReference =
                order.reference || order.id.slice(0, 8).toUpperCase();

              return (
                <div
                  key={order.id}
                  className="p-5 transition hover:bg-gray-50/70"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {orderReference}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                            order.status,
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="mt-2 grid gap-2 text-sm text-gray-500 sm:grid-cols-2">
                        <div>
                          <span className="font-medium text-gray-700">
                            Customer:
                          </span>{" "}
                          {customerName}
                        </div>

                        {order.customer?.phone && (
                          <div>
                            <span className="font-medium text-gray-700">
                              Phone:
                            </span>{" "}
                            {order.customer.phone}
                          </div>
                        )}

                        <div>
                          <span className="font-medium text-gray-700">
                            Date:
                          </span>{" "}
                          {formatDateTime(order.created_at)}
                        </div>

                        <div>
                          <span className="font-medium text-gray-700">
                            Items value:
                          </span>{" "}
                          {formatNaira(Number(order.subtotal || 0))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-500">
                          Customer paid
                        </p>

                        <p className="text-lg font-bold text-gray-900">
                          {formatNaira(
                            Number(order.total_amount || 0),
                          )}
                        </p>

                        {Number(order.delivery_fee || 0) > 0 && (
                          <p className="text-xs text-gray-500">
                            Includes{" "}
                            {formatNaira(
                              Number(order.delivery_fee || 0),
                            )}{" "}
                            delivery
                          </p>
                        )}
                      </div>

                      <Link
                        to={`/business/orders/${order.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-white hover:border-gray-400"
                      >
                        <Eye className="h-4 w-4" />
                        View Order
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
