import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getAuthState } from "../../libs/auth";
import {
  formatDate,
  formatDateTime,
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

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_image: string | null;
}

interface CustomerOrder {
  id: string;
  reference: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  created_at: string;
  updated_at: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  customer_note: string | null;
  business_id: string | null;
  rider_id: string | null;
}

interface Business {
  id: string;
  name: string;
  slug: string | null;
  phone: string | null;
}

interface Rider {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface StatusHistory {
  id: string;
  status: string;
  created_at: string;
  note: string | null;
}

const ORDER_STEPS = [
  {
    status: "paid",
    label: "Payment confirmed",
    description: "Your payment has been confirmed.",
  },
  {
    status: "business_confirmed",
    label: "Business confirmed",
    description: "The business has received and confirmed your order.",
  },
  {
    status: "rider_assigned",
    label: "Rider assigned",
    description: "A delivery rider has been assigned to your order.",
  },
  {
    status: "picked_up",
    label: "Picked up",
    description: "The rider has picked up your order.",
  },
  {
    status: "out_for_delivery",
    label: "Out for delivery",
    description: "Your order is on the way.",
  },
  {
    status: "delivered",
    label: "Delivered",
    description: "Your order has been delivered.",
  },
  {
    status: "completed",
    label: "Completed",
    description: "Your order has been completed.",
  },
];

function getStatusIndex(status: string) {
  const index = ORDER_STEPS.findIndex((step) => step.status === status);

  if (index >= 0) {
    return index;
  }

  if (status === "delivery_requested") {
    return 1;
  }

  return -1;
}

function formatStatus(status: string) {
  switch (status) {
    case "pending_payment":
      return "Pending payment";
    case "paid":
      return "Paid";
    case "business_confirmed":
      return "Business confirmed";
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
  if (status === "cancelled") {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  if (status === "completed" || status === "delivered") {
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

function getItemImage(item: OrderItem) {
  if (!item.product_image) {
    return null;
  }

  return item.product_image;
}

export default function CustomerOrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [rider, setRider] = useState<Rider | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrder() {
    if (!orderId) {
      setError("This order could not be found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const authState = await getAuthState();

      if (!authState.user || !authState.profile) {
        navigate("/login", {
          replace: true,
          state: { from: `/customer/orders/${orderId}` },
        });
        return;
      }

      if (authState.profile.role !== "customer") {
        throw new Error("This order area is only available to customers.");
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          "id, reference, status, subtotal, delivery_fee, total_amount, created_at, updated_at, delivery_address, delivery_city, delivery_state, customer_note, business_id, rider_id"
        )
        .eq("id", orderId)
        .eq("customer_id", authState.user.id)
        .maybeSingle();

      if (orderError) {
        console.error(
          "CustomerOrderDetails: failed to load order",
          orderError
        );
        throw orderError;
      }

      if (!orderData) {
        throw new Error("We couldn't find this order.");
      }

      setOrder(orderData as CustomerOrder);

      const [
        { data: itemData, error: itemError },
        { data: historyData, error: historyError },
      ] = await Promise.all([
        supabase
          .from("order_items")
          .select(
            "id, product_id, product_name, quantity, unit_price, subtotal, product_image"
          )
          .eq("order_id", orderId)
          .order("created_at", { ascending: true }),
        supabase
          .from("order_status_history")
          .select("id, status, created_at, note")
          .eq("order_id", orderId)
          .order("created_at", { ascending: true }),
      ]);

      if (itemError) {
        console.error(
          "CustomerOrderDetails: failed to load order items",
          itemError
        );
        throw itemError;
      }

      if (historyError) {
        console.error(
          "CustomerOrderDetails: failed to load order history",
          historyError
        );
        throw historyError;
      }

      setItems((itemData ?? []) as OrderItem[]);
      setHistory((historyData ?? []) as StatusHistory[]);

      if (orderData.business_id) {
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("id, name, slug, phone")
          .eq("id", orderData.business_id)
          .maybeSingle();

        if (businessError) {
          console.error(
            "CustomerOrderDetails: failed to load business",
            businessError
          );
        } else {
          setBusiness((businessData ?? null) as Business | null);
        }
      } else {
        setBusiness(null);
      }

      if (orderData.rider_id) {
        const { data: riderData, error: riderError } = await supabase
          .from("riders")
          .select("id, full_name, phone, avatar_url")
          .eq("id", orderData.rider_id)
          .maybeSingle();

        if (riderError) {
          console.error(
            "CustomerOrderDetails: failed to load rider",
            riderError
          );
        } else {
          setRider((riderData ?? null) as Rider | null);
        }
      } else {
        setRider(null);
      }
    } catch (loadError) {
      console.error(
        "CustomerOrderDetails: unexpected load error",
        loadError
      );

      setError(
        getSafeErrorMessage(
          loadError,
          "We couldn't load this order right now. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  const currentStepIndex = useMemo(
    () => getStatusIndex(order?.status ?? ""),
    [order?.status]
  );

  const isExceptionState =
    order?.status === "cancelled" ||
    order?.status === "refund_pending" ||
    order?.status === "refunded" ||
    order?.status === "disputed";

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 h-5 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-32 animate-pulse rounded-2xl bg-white" />
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="h-80 animate-pulse rounded-2xl bg-white" />
            <div className="h-80 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to="/customer/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>

          <div className="mt-5 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <Package className="h-7 w-7 text-red-500" />
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Unable to load order
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {error || "This order is no longer available."}
            </p>

            <button
              type="button"
              onClick={() => void loadOrder()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/customer/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {order.reference || `Order ${order.id.slice(0, 8)}`}
                </h1>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
                    order.status
                  )}`}
                >
                  {formatStatus(order.status)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>Placed {formatDate(order.created_at)}</span>

                {order.updated_at && (
                  <span>Updated {formatDateTime(order.updated_at)}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadOrder()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {!isExceptionState && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Order progress
              </h2>
            </div>

            <div className="relative">
              <div className="absolute left-5 top-5 hidden h-[calc(100%-2.5rem)] w-px bg-slate-200 sm:block" />

              <div className="space-y-6">
                {ORDER_STEPS.map((step, index) => {
                  const completed = currentStepIndex >= index;
                  const current = currentStepIndex === index;

                  const historyEntry = history.find(
                    (entry) => entry.status === step.status
                  );

                  return (
                    <div
                      key={step.status}
                      className="relative flex items-start gap-4"
                    >
                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${
                          completed
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Clock3 className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-sm font-semibold ${
                              completed
                                ? "text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </h3>

                          {current && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                              Current
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-1 text-sm ${
                            completed
                              ? "text-slate-500"
                              : "text-slate-400"
                          }`}
                        >
                          {historyEntry?.note || step.description}
                        </p>

                        {historyEntry && (
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(historyEntry.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {isExceptionState && (
          <div
            className={`mt-5 rounded-2xl border p-5 shadow-sm ${
              order.status === "cancelled"
                ? "border-red-200 bg-red-50"
                : "border-orange-200 bg-orange-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <ShieldCheck
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  order.status === "cancelled"
                    ? "text-red-600"
                    : "text-orange-600"
                }`}
              />

              <div>
                <h2 className="font-bold text-slate-900">
                  {formatStatus(order.status)}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {order.status === "cancelled"
                    ? "This order has been cancelled."
                    : order.status === "refund_pending"
                      ? "Your refund is being processed."
                      : order.status === "refunded"
                        ? "Your refund has been completed."
                        : "This order currently has an active dispute."}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Items in this order
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {items.length}{" "}
                    {items.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No item details are available for this order.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const image = getItemImage(item);

                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {image ? (
                            <img
                              src={image}
                              alt={item.product_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-7 w-7 text-slate-300" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {item.product_name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Qty: {item.quantity}
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatNaira(item.unit_price)} each
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-slate-900">
                            {formatNaira(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Delivery details
                </h2>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Delivery address
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {order.delivery_address || "No delivery address recorded."}
                  {order.delivery_city
                    ? `, ${order.delivery_city}`
                    : ""}
                  {order.delivery_state
                    ? `, ${order.delivery_state}`
                    : ""}
                </p>

                {order.customer_note && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Customer note
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.customer_note}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {rider && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Your delivery rider
                  </h2>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-100">
                      {rider.avatar_url ? (
                        <img
                          src={rider.avatar_url}
                          alt={rider.full_name || "Delivery rider"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <UserRound className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        {rider.full_name || "Delivery rider"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Assigned to this order
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {rider.phone && (
                      <a
                        href={`tel:${rider.phone}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Phone className="h-4 w-4" />
                        Call
                      </a>
                    )}

                    <Link
                      to={`/customer/messages?order=${order.id}&rider=${rider.id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">
                Payment summary
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Product subtotal</span>
                  <span>{formatNaira(order.subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Delivery fee</span>
                  <span>{formatNaira(order.delivery_fee)}</span>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Total paid
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatNaira(order.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                Customer platform fee: ₦0
              </div>
            </section>

            {business && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">
                  Seller
                </h2>

                <div className="mt-4">
                  <p className="font-semibold text-slate-900">
                    {business.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Business seller
                  </p>

                  <div className="mt-4 flex flex-col gap-2">
                    {business.slug && (
                      <Link
                        to={`/businesses/${business.slug}`}
                        className="inline-flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        View storefront
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Link>
                    )}

                    {business.phone && (
                      <a
                        href={`tel:${business.phone}`}
                        className="inline-flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Call business
                        <Phone className="h-4 w-4" />
                      </a>
                    )}

                    <Link
                      to={`/customer/messages?order=${order.id}&business=${business.id}`}
                      className="inline-flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Message business
                      <MessageCircle className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">
                Order information
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Order date</span>
                  <span className="font-medium text-slate-900">
                    {formatDate(order.created_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium text-slate-900">
                    {formatStatus(order.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Order ID</span>
                  <span className="max-w-[180px] truncate font-mono text-xs text-slate-700">
                    {order.id}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
