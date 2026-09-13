
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShoppingBag,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { supabase } from "../../libs/supabase";
import { getCurrentProfile, type Profile } from "../../libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import {
  formatDateTime,
  formatNaira,
  formatPhone,
} from "../../libs/format";

type Business = {
  id: string;
  name: string;
  owner_id: string;
};

type Order = {
  id: string;
  reference: string | null;
  customer_id: string;
  business_id: string;
  delivery_address_id: string | null;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  customer_note: string | null;
  created_at: string;
  updated_at: string | null;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type Rider = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  phone: string | null;
};

type DeliveryAddress = {
  id: string;
  recipient_name: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  landmark: string | null;
};

type StatusHistory = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  business_confirmed: "Business Confirmed",
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

const lifecycleStatuses = [
  "pending_payment",
  "paid",
  "business_confirmed",
  "delivery_requested",
  "rider_assigned",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "completed",
];

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

function getPaymentLabel(method: string | null) {
  if (!method) {
    return "Not specified";
  }

  return method
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function BusinessOrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rider, setRider] = useState<Rider | null>(null);
  const [deliveryAddress, setDeliveryAddress] =
    useState<DeliveryAddress | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("The requested order could not be identified.");
      setLoading(false);
      return;
    }

    void loadOrder(orderId);
  }, [orderId]);

  async function loadOrder(id: string) {
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
        throw new Error("Your business profile could not be found.");
      }

      setBusiness(businessData as Business);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          "id, reference, customer_id, business_id, delivery_address_id, status, payment_status, payment_method, subtotal, delivery_fee, total_amount, customer_note, created_at, updated_at",
        )
        .eq("id", id)
        .eq("business_id", businessData.id)
        .maybeSingle();

      if (orderError) {
        throw orderError;
      }

      if (!orderData) {
        throw new Error(
          "This order could not be found or is not associated with your business.",
        );
      }

      const loadedOrder = orderData as Order;
      setOrder(loadedOrder);

      const [
        { data: itemData, error: itemError },
        { data: customerData, error: customerError },
        { data: historyData, error: historyError },
      ] = await Promise.all([
        supabase
          .from("order_items")
          .select(
            "id, order_id, product_id, product_name, quantity, unit_price, total_price",
          )
          .eq("order_id", loadedOrder.id)
          .order("id", { ascending: true }),

        supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .eq("id", loadedOrder.customer_id)
          .maybeSingle(),

        supabase
          .from("order_status_history")
          .select("id, status, note, created_at")
          .eq("order_id", loadedOrder.id)
          .order("created_at", { ascending: false }),
      ]);

      if (itemError) {
        throw itemError;
      }

      if (customerError) {
        throw customerError;
      }

      if (historyError) {
        throw historyError;
      }

      setItems((itemData ?? []) as OrderItem[]);
      setCustomer((customerData ?? null) as Customer | null);
      setStatusHistory((historyData ?? []) as StatusHistory[]);

      if (loadedOrder.delivery_address_id) {
        const { data: addressData, error: addressError } =
          await supabase
            .from("customer_addresses")
            .select(
              "id, recipient_name, phone, address_line_1, address_line_2, city, state, postal_code, landmark",
            )
            .eq("id", loadedOrder.delivery_address_id)
            .maybeSingle();

        if (addressError) {
          throw addressError;
        }

        setDeliveryAddress(
          (addressData ?? null) as DeliveryAddress | null,
        );
      } else {
        setDeliveryAddress(null);
      }

      const { data: assignmentData, error: assignmentError } =
        await supabase
          .from("delivery_assignments")
          .select("rider_id")
          .eq("order_id", loadedOrder.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (assignmentError) {
        throw assignmentError;
      }

      if (assignmentData?.rider_id) {
        const { data: riderData, error: riderError } =
          await supabase
            .from("riders")
            .select("id, user_id, full_name, phone")
            .eq("id", assignmentData.rider_id)
            .maybeSingle();

        if (riderError) {
          throw riderError;
        }

        setRider((riderData ?? null) as Rider | null);
      } else {
        setRider(null);
      }
    } catch (err) {
      logAppError("business-order-details-load", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const canConfirm =
    order?.status === "paid";

  const canRequestDelivery =
    order?.status === "business_confirmed";

  const canCancel =
    order &&
    ![
      "completed",
      "cancelled",
      "refunded",
      "disputed",
    ].includes(order.status);

  const nextAction = useMemo(() => {
    if (!order) {
      return null;
    }

    if (order.status === "paid") {
      return {
        label: "Confirm Order",
        nextStatus: "business_confirmed",
      };
    }

    if (order.status === "business_confirmed") {
      return {
        label: "Request Delivery",
        nextStatus: "delivery_requested",
      };
    }

    return null;
  }, [order]);

  async function updateOrderStatus(
    nextStatus: "business_confirmed" | "delivery_requested" | "cancelled",
  ) {
    if (!order || !business) {
      return;
    }

    setError("");
    setActionLoading(true);

    try {
      const { data: updatedOrder, error: updateError } =
        await supabase
          .from("orders")
          .update({
            status: nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)
          .eq("business_id", business.id)
          .select(
            "id, reference, customer_id, business_id, delivery_address_id, status, payment_status, payment_method, subtotal, delivery_fee, total_amount, customer_note, created_at, updated_at",
          )
          .single();

      if (updateError) {
        throw updateError;
      }

      if (!updatedOrder) {
        throw new Error("The order status could not be updated.");
      }

      setOrder(updatedOrder as Order);

      await loadOrder(order.id);
    } catch (err) {
      logAppError("business-order-status-update", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePrimaryAction() {
    if (!nextAction) {
      return;
    }

    await updateOrderStatus(
      nextAction.nextStatus as
        | "business_confirmed"
        | "delivery_requested",
    );
  }

  async function handleCancel() {
    if (!order || !canCancel) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmed) {
      return;
    }

    await updateOrderStatus("cancelled");
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading order...</span>
        </div>
      </div>
    );
  }

  if (!order || !business) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Package className="mx-auto mb-4 h-10 w-10 text-gray-400" />

          <h1 className="text-xl font-semibold text-gray-900">
            Order unavailable
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error || "This order could not be loaded."}
          </p>

          <Link
            to="/business/orders"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const orderReference =
    order.reference || order.id.slice(0, 8).toUpperCase();

  const paymentStatus =
    order.payment_status ||
    (order.status === "pending_payment" ? "pending" : "paid");

  const isCancelled = [
    "cancelled",
    "refunded",
    "disputed",
  ].includes(order.status);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/business/orders"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Order {orderReference}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                order.status,
              )}`}
            >
              {getStatusLabel(order.status)}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Placed {formatDateTime(order.created_at)}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {customer?.phone && (
            <a
              href={`tel:${formatPhone(customer.phone)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <Phone className="h-4 w-4" />
              Call Customer
            </a>
          )}

          <Link
            to="/business/messages"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <MessageCircle className="h-4 w-4" />
            Messages
          </Link>
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

      {!isCancelled && nextAction && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-blue-900">
                Action required
              </h2>

              <p className="mt-1 text-sm text-blue-700">
                {canConfirm
                  ? "Payment has been received. Confirm that your business will process this order."
                  : canRequestDelivery
                    ? "The order is confirmed. Request a rider to begin the delivery process."
                    : "Continue processing this order from its current status."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handlePrimaryAction()}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {nextAction.label}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900">
                Order Items
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Products included in this order.
              </p>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-gray-300" />

                <p className="text-sm text-gray-500">
                  No order items were found.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                        <Package className="h-5 w-5 text-gray-500" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {item.product_name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {item.quantity} ×{" "}
                          {formatNaira(Number(item.unit_price || 0))}
                        </p>
                      </div>
                    </div>

                    <p className="font-semibold text-gray-900">
                      {formatNaira(Number(item.total_price || 0))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900">
                Order Timeline
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Recorded status changes for this order.
              </p>
            </div>

            <div className="p-5">
              {statusHistory.length === 0 ? (
                <div className="py-6 text-center">
                  <Clock3 className="mx-auto mb-3 h-8 w-8 text-gray-300" />

                  <p className="text-sm text-gray-500">
                    No status history is available yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {statusHistory.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="relative flex gap-4"
                    >
                      {index < statusHistory.length - 1 && (
                        <span className="absolute left-[11px] top-7 h-full w-px bg-gray-200" />
                      )}

                      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900">
                        <span className="h-2 w-2 rounded-full bg-white" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {getStatusLabel(entry.status)}
                          </p>

                          <span className="text-xs text-gray-400">
                            {formatDateTime(entry.created_at)}
                          </span>
                        </div>

                        {entry.note && (
                          <p className="mt-1 text-sm text-gray-500">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {order.customer_note && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">
                Customer Note
              </h2>

              <div className="mt-3 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                {order.customer_note}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <User className="h-5 w-5 text-gray-600" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Customer
                </h2>

                <p className="text-xs text-gray-500">
                  Order customer
                </p>
              </div>
            </div>

            {customer ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {customer.full_name || "Customer"}
                  </p>
                </div>

                {customer.email && (
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="mt-1 break-all text-gray-700">
                      {customer.email}
                    </p>
                  </div>
                )}

                {customer.phone && (
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="mt-1 text-gray-700">
                      {customer.phone}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Customer information is unavailable.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <MapPin className="h-5 w-5 text-gray-600" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Delivery Address
                </h2>

                <p className="text-xs text-gray-500">
                  Customer delivery location
                </p>
              </div>
            </div>

            {deliveryAddress ? (
              <div className="space-y-1 text-sm leading-6 text-gray-700">
                {deliveryAddress.recipient_name && (
                  <p className="font-medium text-gray-900">
                    {deliveryAddress.recipient_name}
                  </p>
                )}

                {deliveryAddress.phone && (
                  <p>{deliveryAddress.phone}</p>
                )}

                {deliveryAddress.address_line_1 && (
                  <p>{deliveryAddress.address_line_1}</p>
                )}

                {deliveryAddress.address_line_2 && (
                  <p>{deliveryAddress.address_line_2}</p>
                )}

                <p>
                  {[
                    deliveryAddress.city,
                    deliveryAddress.state,
                    deliveryAddress.postal_code,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>

                {deliveryAddress.landmark && (
                  <p>
                    <span className="font-medium">Landmark:</span>{" "}
                    {deliveryAddress.landmark}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No delivery address is attached to this order.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <Truck className="h-5 w-5 text-gray-600" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Delivery
                </h2>

                <p className="text-xs text-gray-500">
                  Rider assignment
                </p>
              </div>
            </div>

            {rider ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Rider</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {rider.full_name || "Assigned Rider"}
                  </p>
                </div>

                {rider.phone && (
                  <a
                    href={`tel:${formatPhone(rider.phone)}`}
                    className="inline-flex items-center gap-2 font-medium text-gray-700 hover:text-gray-900"
                  >
                    <Phone className="h-4 w-4" />
                    {rider.phone}
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  No rider has been assigned yet.
                </p>

                {order.status === "delivery_requested" && (
                  <p className="mt-1 text-xs text-gray-500">
                    Eligible riders will receive the delivery request.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Payment Summary
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">Payment status</span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    paymentStatus === "paid"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {paymentStatus
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">
                  Payment method
                </span>

                <span className="font-medium text-gray-900">
                  {getPaymentLabel(order.payment_method)}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    Product subtotal
                  </span>

                  <span className="font-medium text-gray-900">
                    {formatNaira(Number(order.subtotal || 0))}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-gray-500">
                    Delivery fee
                  </span>

                  <span className="font-medium text-gray-900">
                    {formatNaira(Number(order.delivery_fee || 0))}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="font-semibold text-gray-900">
                    Customer total
                  </span>

                  <span className="text-lg font-bold text-gray-900">
                    {formatNaira(Number(order.total_amount || 0))}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {canCancel && (
            <button
              type="button"
              onClick={() => void handleCancel()}
              disabled={actionLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Cancel Order
            </button>
          )}

          {order.status === "completed" && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>
                This order has been completed successfully.
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
