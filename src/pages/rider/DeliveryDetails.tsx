import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Truck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCurrentProfile } from "../../libs/auth";
import { supabase } from "../../libs/supabase";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import {
  formatDateTime,
  formatNaira,
  formatRelativeDate,
} from "../../libs/format";

type DeliveryAssignment = {
  id: string;
  delivery_request_id: string | null;
  order_id: string;
  rider_id: string;
  status: string;
  pickup_address: string | null;
  delivery_address: string | null;
  delivery_fee: number | null;
  rider_earning: number | null;
  picked_up_at: string | null;
  submitted_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string | null;
};

type Order = {
  id: string;
  reference: string | null;
  customer_id: string;
  status: string;
  subtotal: number | null;
  delivery_fee: number | null;
  total_amount: number | null;
  payment_method: string | null;
  payment_status: string | null;
  customer_note: string | null;
  created_at: string;
  updated_at: string | null;
};

type CustomerProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type StatusHistory = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
};

function normalizeStatus(status: string | null | undefined) {
  return String(status ?? "").toLowerCase().trim();
}

function isAwaitingConfirmation(status: string) {
  return [
    "awaiting_customer_confirmation",
    "delivery_submitted",
  ].includes(normalizeStatus(status));
}

function isCompleted(status: string) {
  return ["completed", "delivered"].includes(
    normalizeStatus(status)
  );
}

function isCancelled(status: string) {
  return ["cancelled", "failed", "rejected"].includes(
    normalizeStatus(status)
  );
}

function isActive(status: string) {
  return [
    "accepted",
    "assigned",
    "picked_up",
    "out_for_delivery",
  ].includes(normalizeStatus(status));
}

function getStatusLabel(status: string) {
  switch (normalizeStatus(status)) {
    case "accepted":
      return "Accepted";
    case "assigned":
      return "Assigned";
    case "picked_up":
      return "Picked up";
    case "out_for_delivery":
      return "Out for delivery";
    case "awaiting_customer_confirmation":
      return "Awaiting customer confirmation";
    case "delivery_submitted":
      return "Awaiting customer confirmation";
    case "delivered":
      return "Delivered";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "failed":
      return "Delivery failed";
    default:
      return String(status || "Unknown").replace(/_/g, " ");
  }
}

function getStatusClasses(status: string) {
  if (isCompleted(status)) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (isAwaitingConfirmation(status)) {
    return "bg-amber-50 text-amber-700";
  }

  if (isCancelled(status)) {
    return "bg-red-50 text-red-700";
  }

  return "bg-blue-50 text-blue-700";
}

export default function RiderDeliveryDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [delivery, setDelivery] =
    useState<DeliveryAssignment | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] =
    useState<CustomerProfile | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadDelivery = useCallback(
    async (showRefreshState = false) => {
      if (!orderId) {
        setError("The delivery could not be identified.");
        setLoading(false);
        return;
      }

      try {
        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const profile = await getCurrentProfile();

        if (!profile?.id) {
          throw new Error("Your session could not be verified.");
        }

        const { data: rider, error: riderError } = await supabase
          .from("riders")
          .select("id, user_id, active, verified")
          .eq("user_id", profile.id)
          .maybeSingle();

        if (riderError) {
          throw riderError;
        }

        if (!rider) {
          throw new Error(
            "Your rider profile could not be found."
          );
        }

        if (rider.active === false) {
          throw new Error(
            "Your rider account is currently inactive."
          );
        }

        if (rider.verified === false) {
          throw new Error(
            "Your rider account has not been verified."
          );
        }

        const { data: assignment, error: assignmentError } =
          await supabase
            .from("delivery_assignments")
            .select(
              `
                id,
                delivery_request_id,
                order_id,
                rider_id,
                status,
                pickup_address,
                delivery_address,
                delivery_fee,
                rider_earning,
                picked_up_at,
                submitted_at,
                delivered_at,
                created_at,
                updated_at
              `
            )
            .eq("order_id", orderId)
            .eq("rider_id", rider.id)
            .maybeSingle();

        if (assignmentError) {
          throw assignmentError;
        }

        if (!assignment) {
          throw new Error(
            "This delivery could not be found in your rider account."
          );
        }

        const assignmentData =
          assignment as DeliveryAssignment;

        const { data: orderData, error: orderError } =
          await supabase
            .from("orders")
            .select(
              `
                id,
                reference,
                customer_id,
                status,
                subtotal,
                delivery_fee,
                total_amount,
                payment_method,
                payment_status,
                customer_note,
                created_at,
                updated_at
              `
            )
            .eq("id", orderId)
            .maybeSingle();

        if (orderError) {
          throw orderError;
        }

        if (!orderData) {
          throw new Error(
            "The order connected to this delivery could not be found."
          );
        }

        const orderValue = orderData as Order;

        const { data: customerData, error: customerError } =
          await supabase
            .from("profiles")
            .select("id, full_name, phone")
            .eq("id", orderValue.customer_id)
            .maybeSingle();

        if (customerError) {
          throw customerError;
        }

        const { data: itemRows, error: itemsError } =
          await supabase
            .from("order_items")
            .select(
              `
                id,
                product_id,
                product_name,
                quantity,
                unit_price,
                total_price
              `
            )
            .eq("order_id", orderId)
            .order("id", { ascending: true });

        if (itemsError) {
          throw itemsError;
        }

        const { data: historyRows, error: historyError } =
          await supabase
            .from("order_status_history")
            .select("id, status, note, created_at")
            .eq("order_id", orderId)
            .order("created_at", { ascending: false });

        if (historyError) {
          throw historyError;
        }

        setDelivery(assignmentData);
        setOrder(orderValue);
        setCustomer(
          customerData
            ? (customerData as CustomerProfile)
            : null
        );
        setItems((itemRows ?? []) as OrderItem[]);
        setHistory((historyRows ?? []) as StatusHistory[]);
      } catch (err) {
        logAppError(err, {
          operation: "rider.delivery_details.load",
          orderId,
        });

        setDelivery(null);
        setOrder(null);
        setCustomer(null);
        setItems([]);
        setHistory([]);
        setError(getSafeErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    void loadDelivery();
  }, [loadDelivery]);

  const updateDeliveryStatus = async (
    nextStatus: string,
    allowedStatuses: string[],
    timestampField:
      | "picked_up_at"
      | "submitted_at"
      | null
  ) => {
    if (!delivery || !order || !orderId || actionLoading) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");

      const profile = await getCurrentProfile();

      if (!profile?.id) {
        throw new Error("Your session could not be verified.");
      }

      const { data: rider, error: riderError } = await supabase
        .from("riders")
        .select("id, user_id, active, verified")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (riderError) {
        throw riderError;
      }

      if (!rider) {
        throw new Error(
          "Your rider profile could not be found."
        );
      }

      if (rider.active === false) {
        throw new Error(
          "Your rider account is currently inactive."
        );
      }

      if (rider.verified === false) {
        throw new Error(
          "Your rider account is not verified."
        );
      }

      const now = new Date().toISOString();

      const updatePayload: Record<string, unknown> = {
        status: nextStatus,
        updated_at: now,
      };

      if (timestampField) {
        updatePayload[timestampField] = now;
      }

      const { data: updatedAssignment, error: assignmentError } =
        await supabase
          .from("delivery_assignments")
          .update(updatePayload)
          .eq("id", delivery.id)
          .eq("rider_id", rider.id)
          .in("status", allowedStatuses)
          .select(
            `
              id,
              delivery_request_id,
              order_id,
              rider_id,
              status,
              pickup_address,
              delivery_address,
              delivery_fee,
              rider_earning,
              picked_up_at,
              submitted_at,
              delivered_at,
              created_at,
              updated_at
            `
          )
          .maybeSingle();

      if (assignmentError) {
        throw assignmentError;
      }

      if (!updatedAssignment) {
        throw new Error(
          "This delivery has already changed status. Refresh the page and try again."
        );
      }

      /*
       * Important:
       * The rider can submit a delivery, but cannot complete it.
       *
       * Customer confirmation is the only event that should change
       * the order to "completed".
       */
      const orderStatus =
        nextStatus === "awaiting_customer_confirmation"
          ? "awaiting_customer_confirmation"
          : nextStatus;

      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          status: orderStatus,
          updated_at: now,
        })
        .eq("id", order.id)
        .in("status", allowedStatuses);

      if (orderUpdateError) {
        logAppError(orderUpdateError, {
          operation:
            "rider.delivery_details.order_status_update",
          orderId: order.id,
          deliveryId: delivery.id,
          nextStatus,
        });
      }

      /*
       * Status history is best written by the final transactional
       * backend operation. If the table is available to the rider
       * through RLS, record the event here as an audit trail.
       */
      const historyNote =
        nextStatus === "picked_up"
          ? "Rider picked up the order."
          : nextStatus === "out_for_delivery"
            ? "Rider started delivery to the customer."
            : "Rider submitted the delivery and is awaiting customer confirmation.";

      const { error: historyInsertError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: order.id,
          status: orderStatus,
          note: historyNote,
        });

      if (historyInsertError) {
        logAppError(historyInsertError, {
          operation:
            "rider.delivery_details.status_history",
          orderId: order.id,
          deliveryId: delivery.id,
          nextStatus,
        });
      }

      /*
       * Push notification:
       * The production backend notification event should notify the
       * customer when the rider submits the delivery. The rider does
       * not receive a payout here.
       */

      await loadDelivery(true);
    } catch (err) {
      logAppError(err, {
        operation: "rider.delivery_details.status_update",
        orderId,
        deliveryId: delivery.id,
        nextStatus,
      });

      setActionError(getSafeErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePickup = async () => {
    await updateDeliveryStatus(
      "picked_up",
      ["accepted", "assigned"],
      "picked_up_at"
    );
  };

  const handleOutForDelivery = async () => {
    await updateDeliveryStatus(
      "out_for_delivery",
      ["picked_up"],
      null
    );
  };

  const handleSubmitDelivery = async () => {
    await updateDeliveryStatus(
      "awaiting_customer_confirmation",
      ["out_for_delivery", "picked_up", "accepted", "assigned"],
      "submitted_at"
    );
  };

  const handleReportIssue = () => {
    if (!orderId) return;

    navigate(
      `/rider/messages?orderId=${encodeURIComponent(orderId)}&reason=delivery_issue`
    );
  };

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-5">
            <div className="h-8 w-52 rounded bg-slate-200" />
            <div className="h-24 rounded-2xl bg-white" />
            <div className="h-56 rounded-2xl bg-white" />
            <div className="h-72 rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !delivery || !order) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/rider/deliveries"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to deliveries
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

              <div>
                <h1 className="font-bold text-red-900">
                  Delivery unavailable
                </h1>

                <p className="mt-1 text-sm leading-6 text-red-800">
                  {error ||
                    "The requested delivery could not be loaded."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadDelivery(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = normalizeStatus(delivery.status);
  const awaitingConfirmation = isAwaitingConfirmation(status);
  const completed = isCompleted(status);
  const cancelled = isCancelled(status);
  const active = isActive(status);

  const canPickup =
    ["accepted", "assigned"].includes(status) &&
    !delivery.picked_up_at;

  const canStartDelivery =
    status === "picked_up" && !delivery.submitted_at;

  const canSubmit =
    active &&
    !awaitingConfirmation &&
    !completed &&
    !cancelled &&
    !delivery.submitted_at;

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/rider/deliveries"
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to deliveries
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {order.reference ||
                  `Order ${order.id.slice(0, 8)}`}
              </h1>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                  delivery.status
                )}`}
              >
                {getStatusLabel(delivery.status)}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Created {formatRelativeDate(order.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDelivery(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {actionError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Delivery action could not be completed
              </p>
              <p className="mt-1">{actionError}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Delivery route
                  </h2>
                </div>
              </div>

              <div className="p-5">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 h-4 w-4 rounded-full border-[3px] border-blue-600 bg-white" />
                    <span className="h-24 w-px bg-slate-200" />
                    <span className="h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-10">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Pickup
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-800">
                        {delivery.pickup_address ||
                          "Pickup address unavailable."}
                      </p>

                      {delivery.picked_up_at && (
                        <p className="mt-2 text-xs text-emerald-700">
                          Picked up{" "}
                          {formatDateTime(
                            delivery.picked_up_at
                          )}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Customer
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-800">
                        {delivery.delivery_address ||
                          "Delivery address unavailable."}
                      </p>

                      {delivery.submitted_at && (
                        <p className="mt-2 text-xs text-amber-700">
                          Delivery submitted{" "}
                          {formatDateTime(
                            delivery.submitted_at
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-slate-700" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Order items
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <div className="p-5 text-sm text-slate-500">
                    No item details are available for this order.
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.product_name ||
                            `Product ${item.product_id.slice(
                              0,
                              8
                            )}`}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.quantity} ×{" "}
                          {formatNaira(
                            Number(item.unit_price)
                          )}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-slate-900">
                        {formatNaira(
                          Number(item.total_price)
                        )}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Subtotal
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatNaira(Number(order.subtotal ?? 0))}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Delivery
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatNaira(
                      Number(
                        order.delivery_fee ??
                          delivery.delivery_fee ??
                          0
                      )
                    )}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="font-bold text-slate-900">
                    Total
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatNaira(
                      Number(order.total_amount ?? 0)
                    )}
                  </span>
                </div>
              </div>
            </section>

            {order.customer_note && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Customer note
                </p>

                <p className="mt-2 text-sm leading-6 text-amber-900">
                  {order.customer_note}
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Delivery timeline
                </h2>
              </div>

              <div className="p-5">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No status history is available yet.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {history.map((event, index) => (
                      <div
                        key={event.id}
                        className="flex gap-3"
                      >
                        <div className="flex flex-col items-center">
                          <span
                            className={`mt-1 h-3 w-3 rounded-full ${
                              index === 0
                                ? "bg-blue-600"
                                : "bg-slate-300"
                            }`}
                          />

                          {index < history.length - 1 && (
                            <span className="mt-1 h-10 w-px bg-slate-200" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold capitalize text-slate-900">
                            {getStatusLabel(event.status)}
                          </p>

                          {event.note && (
                            <p className="mt-1 text-sm leading-5 text-slate-600">
                              {event.note}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(event.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <UserRound className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 truncate text-base font-bold text-slate-900">
                    {customer?.full_name || "Customer"}
                  </p>

                  {customer?.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                    >
                      <Phone className="h-4 w-4" />
                      Call customer
                    </a>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-bold text-slate-900">
                  Delivery actions
                </h2>
              </div>

              <div className="space-y-3">
                {canPickup && (
                  <button
                    type="button"
                    onClick={() => void handlePickup()}
                    disabled={actionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                    Confirm Pickup
                  </button>
                )}

                {canStartDelivery && (
                  <button
                    type="button"
                    onClick={() => void handleOutForDelivery()}
                    disabled={actionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4" />
                    )}
                    Start Delivery
                  </button>
                )}

                {canSubmit && (
                  <button
                    type="button"
                    onClick={() => void handleSubmitDelivery()}
                    disabled={actionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Submit Delivery
                  </button>
                )}

                {awaitingConfirmation && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                      <div>
                        <p className="text-sm font-bold text-amber-900">
                          Waiting for customer
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Delivery has been submitted. The customer must
                          confirm receipt before this order is completed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {completed && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                      <div>
                        <p className="text-sm font-bold text-emerald-900">
                          Customer confirmed delivery
                        </p>

                        <p className="mt-1 text-xs leading-5 text-emerald-800">
                          This order is completed. Your rider earning is now
                          eligible for direct bank payout.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {cancelled && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

                      <div>
                        <p className="text-sm font-bold text-red-900">
                          Delivery is no longer active
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-800">
                          This delivery cannot be completed through this
                          assignment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!completed &&
                  !cancelled &&
                  !awaitingConfirmation && (
                    <button
                      type="button"
                      onClick={handleReportIssue}
                      disabled={actionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Report Delivery Issue
                    </button>
                  )}
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Rider earning
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-900">
                {formatNaira(
                  Number(delivery.rider_earning ?? 0)
                )}
              </p>

              <p className="mt-2 text-xs leading-5 text-emerald-800">
                This earning is not a rider wallet balance. Once the customer
                confirms the delivery, the payout becomes eligible for direct
                transfer to your verified bank account.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                <div>
                  <p className="text-sm font-bold text-blue-900">
                    Delivery protection
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-800">
                    Tapping “Submit Delivery” does not complete the order.
                    Completion requires explicit customer confirmation.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
