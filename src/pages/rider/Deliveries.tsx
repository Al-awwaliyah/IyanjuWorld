import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
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
  delivery_request_id: string;
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
  total_amount: number;
  created_at: string;
  updated_at: string | null;
};

type CustomerProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type DeliveryView = DeliveryAssignment & {
  order?: Order;
  customer?: CustomerProfile;
};

type FilterKey =
  | "active"
  | "awaiting_confirmation"
  | "completed"
  | "cancelled"
  | "all";

const ACTIVE_STATUSES = [
  "accepted",
  "assigned",
  "picked_up",
  "out_for_delivery",
];

const AWAITING_CONFIRMATION_STATUSES = [
  "awaiting_customer_confirmation",
  "delivery_submitted",
];

const COMPLETED_STATUSES = [
  "completed",
  "delivered",
];

const CANCELLED_STATUSES = [
  "cancelled",
  "rejected",
  "failed",
];

function normalizeStatus(status: string | null | undefined) {
  return String(status ?? "").toLowerCase().trim();
}

function isActiveStatus(status: string) {
  return ACTIVE_STATUSES.includes(normalizeStatus(status));
}

function isAwaitingConfirmationStatus(status: string) {
  return AWAITING_CONFIRMATION_STATUSES.includes(
    normalizeStatus(status)
  );
}

function isCompletedStatus(status: string) {
  return COMPLETED_STATUSES.includes(normalizeStatus(status));
}

function isCancelledStatus(status: string) {
  return CANCELLED_STATUSES.includes(normalizeStatus(status));
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
      return "Awaiting confirmation";

    case "delivery_submitted":
      return "Awaiting confirmation";

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
  const normalized = normalizeStatus(status);

  if (isCompletedStatus(normalized)) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (isAwaitingConfirmationStatus(normalized)) {
    return "bg-amber-50 text-amber-700";
  }

  if (isCancelledStatus(normalized)) {
    return "bg-red-50 text-red-700";
  }

  return "bg-brand-50 text-brand-700";
}

export default function RiderDeliveries() {
  const [deliveries, setDeliveries] = useState<DeliveryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("active");
  const [error, setError] = useState("");

  const loadDeliveries = useCallback(
    async (showRefreshState = false) => {
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
            "Your rider account has not been verified yet."
          );
        }

        const { data: assignmentRows, error: assignmentsError } =
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
            .eq("rider_id", rider.id)
            .order("created_at", { ascending: false });

        if (assignmentsError) {
          throw assignmentsError;
        }

        const assignmentList =
          (assignmentRows ?? []) as DeliveryAssignment[];

        if (assignmentList.length === 0) {
          setDeliveries([]);
          return;
        }

        const orderIds = [
          ...new Set(
            assignmentList
              .map((assignment) => assignment.order_id)
              .filter(Boolean)
          ),
        ];

        let orders: Order[] = [];

        if (orderIds.length > 0) {
          const { data: orderRows, error: ordersError } =
            await supabase
              .from("orders")
              .select(
                `
                  id,
                  reference,
                  customer_id,
                  status,
                  total_amount,
                  created_at,
                  updated_at
                `
              )
              .in("id", orderIds);

          if (ordersError) {
            throw ordersError;
          }

          orders = (orderRows ?? []) as Order[];
        }

        const customerIds = [
          ...new Set(
            orders
              .map((order) => order.customer_id)
              .filter(Boolean)
          ),
        ];

        let customers: CustomerProfile[] = [];

        if (customerIds.length > 0) {
          const { data: customerRows, error: customersError } =
            await supabase
              .from("profiles")
              .select("id, full_name, phone")
              .in("id", customerIds);

          if (customersError) {
            throw customersError;
          }

          customers = (customerRows ?? []) as CustomerProfile[];
        }

        const orderMap = new Map(
          orders.map((order) => [order.id, order])
        );

        const customerMap = new Map(
          customers.map((customer) => [customer.id, customer])
        );

        const enriched = assignmentList.map((assignment) => {
          const order = orderMap.get(assignment.order_id);

          return {
            ...assignment,
            order,
            customer: order
              ? customerMap.get(order.customer_id)
              : undefined,
          };
        });

        setDeliveries(enriched);
      } catch (err) {
        logAppError(err, {
          operation: "rider.deliveries.load",
        });

        setDeliveries([]);
        setError(getSafeErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  const filteredDeliveries = useMemo(() => {
    switch (filter) {
      case "active":
        return deliveries.filter((delivery) =>
          isActiveStatus(delivery.status)
        );

      case "awaiting_confirmation":
        return deliveries.filter((delivery) =>
          isAwaitingConfirmationStatus(delivery.status)
        );

      case "completed":
        return deliveries.filter((delivery) =>
          isCompletedStatus(delivery.status)
        );

      case "cancelled":
        return deliveries.filter((delivery) =>
          isCancelledStatus(delivery.status)
        );

      case "all":
      default:
        return deliveries;
    }
  }, [deliveries, filter]);

  const counts = useMemo(
    () => ({
      active: deliveries.filter((delivery) =>
        isActiveStatus(delivery.status)
      ).length,
      awaiting: deliveries.filter((delivery) =>
        isAwaitingConfirmationStatus(delivery.status)
      ).length,
      completed: deliveries.filter((delivery) =>
        isCompletedStatus(delivery.status)
      ).length,
      cancelled: deliveries.filter((delivery) =>
        isCancelledStatus(delivery.status)
      ).length,
    }),
    [deliveries]
  );

  const submitDelivery = async (delivery: DeliveryView) => {
    if (submittingId) return;

    try {
      setSubmittingId(delivery.id);
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
          "Your rider account is not verified."
        );
      }

      /*
       * The production implementation should move this operation
       * into a server-side RPC/Edge Function so the assignment,
       * order status, status history, earning creation and push
       * notification can be committed atomically.
       *
       * This conditional update prevents a second submission after
       * the delivery has already changed state.
       */

      const { data: updatedAssignment, error: updateError } =
        await supabase
          .from("delivery_assignments")
          .update({
            status: "awaiting_customer_confirmation",
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", delivery.id)
          .eq("rider_id", rider.id)
          .in("status", [
            "accepted",
            "assigned",
            "picked_up",
            "out_for_delivery",
          ])
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

      if (updateError) {
        throw updateError;
      }

      if (!updatedAssignment) {
        throw new Error(
          "This delivery cannot be submitted because its status has changed."
        );
      }

      /*
       * The rider has submitted the delivery, but the order MUST NOT
       * become completed here.
       *
       * The customer must explicitly confirm receipt.
       */

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "awaiting_customer_confirmation",
          updated_at: new Date().toISOString(),
        })
        .eq("id", delivery.order_id)
        .in("status", [
          "rider_assigned",
          "picked_up",
          "out_for_delivery",
        ]);

      if (orderError) {
        logAppError(orderError, {
          operation: "rider.deliveries.submit.order_status",
          deliveryId: delivery.id,
          orderId: delivery.order_id,
        });
      }

      await loadDeliveries(true);
      setFilter("awaiting_confirmation");
    } catch (err) {
      logAppError(err, {
        operation: "rider.deliveries.submit",
        deliveryId: delivery.id,
        orderId: delivery.order_id,
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setSubmittingId(null);
    }
  };

  const renderDeliveryCard = (delivery: DeliveryView) => {
    const order = delivery.order;
    const customer = delivery.customer;
    const normalizedStatus = normalizeStatus(delivery.status);

    const canSubmit =
      isActiveStatus(normalizedStatus) &&
      !delivery.submitted_at &&
      !delivery.delivered_at;

    const awaitingConfirmation =
      isAwaitingConfirmationStatus(normalizedStatus);

    return (
      <article
        key={delivery.id}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Package className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  {order?.reference ??
                    `Order ${delivery.order_id.slice(0, 8)}`}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {formatRelativeDate(delivery.created_at)}
                </p>
              </div>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusClasses(
                delivery.status
              )}`}
            >
              {getStatusLabel(delivery.status)}
            </span>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-3 w-3 rounded-full border-2 border-brand-600 bg-white" />
              <span className="h-12 w-px bg-slate-200" />
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
            </div>

            <div className="min-w-0 flex-1 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pickup
                </p>

                <p className="mt-1 flex items-start gap-2 text-sm leading-6 text-slate-800">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand-600" />
                  <span>
                    {delivery.pickup_address ||
                      "Pickup address unavailable."}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Customer delivery
                </p>

                <p className="mt-1 flex items-start gap-2 text-sm leading-6 text-slate-800">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    {delivery.delivery_address ||
                      "Delivery address unavailable."}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <UserRound className="h-4 w-4" />
                Customer
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-900">
                {customer?.full_name || "Customer"}
              </p>

              {customer?.phone && (
                <p className="mt-1 text-xs text-slate-500">
                  {customer.phone}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <Truck className="h-4 w-4" />
                Rider earning
              </div>

              <p className="mt-2 text-lg font-bold text-emerald-800">
                {formatNaira(Number(delivery.rider_earning ?? 0))}
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-700">
                Paid directly to your verified bank account after customer
                confirmation.
              </p>
            </div>
          </div>

          {awaitingConfirmation && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Waiting for customer confirmation
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    You have submitted this delivery. The order will not
                    become completed until the customer confirms that the
                    order was received.
                  </p>

                  {delivery.submitted_at && (
                    <p className="mt-2 text-xs text-amber-700">
                      Submitted {formatDateTime(delivery.submitted_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isCompletedStatus(normalizedStatus) && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    Delivery completed
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-800">
                    The customer confirmed receipt. Your earning is now
                    eligible for direct bank payout.
                  </p>

                  {delivery.delivered_at && (
                    <p className="mt-2 text-xs text-emerald-700">
                      Confirmed {formatDateTime(delivery.delivered_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isCancelledStatus(normalizedStatus) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Delivery unavailable
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-800">
                    This delivery can no longer be completed through this
                    assignment.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {canSubmit && (
              <button
                type="button"
                onClick={() => void submitDelivery(delivery)}
                disabled={submittingId === delivery.id}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-60 dark-surface"
              >
                {submittingId === delivery.id ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Submit Delivery
                  </>
                )}
              </button>
            )}

            <Link
              to={`/rider/deliveries/${delivery.order_id}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <MapPin className="h-4 w-4" />
              View Details
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400">
            Created {formatDateTime(delivery.created_at)}
          </p>
        </div>
      </article>
    );
  };

  const filterItems: {
    key: FilterKey;
    label: string;
    count: number;
  }[] = [
    {
      key: "active",
      label: "Active",
      count: counts.active,
    },
    {
      key: "awaiting_confirmation",
      label: "Awaiting confirmation",
      count: counts.awaiting,
    },
    {
      key: "completed",
      label: "Completed",
      count: counts.completed,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: counts.cancelled,
    },
    {
      key: "all",
      label: "All",
      count: deliveries.length,
    },
  ];

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-brand-700">
              <Truck className="h-4 w-4" />
              Rider deliveries
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My Deliveries
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Manage your accepted deliveries and submit completed deliveries
              for customer confirmation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDeliveries(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Unable to load your deliveries
              </p>

              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-2">
            {filterItems.map((item) => {
              const selected = filter === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    selected
                      ? "bg-ink-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}

                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      selected
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="h-5 w-44 rounded bg-slate-200" />
                <div className="mt-5 h-4 w-full rounded bg-slate-200" />
                <div className="mt-2 h-4 w-4/5 rounded bg-slate-200" />
                <div className="mt-6 h-24 rounded-xl bg-slate-200" />
                <div className="mt-5 h-11 rounded-xl bg-slate-200" />
              </div>
            ))}
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              {filter === "awaiting_confirmation" ? (
                <Clock3 className="h-7 w-7" />
              ) : filter === "completed" ? (
                <CheckCircle2 className="h-7 w-7" />
              ) : (
                <Truck className="h-7 w-7" />
              )}
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              {filter === "active"
                ? "No active deliveries"
                : filter === "awaiting_confirmation"
                  ? "No deliveries awaiting confirmation"
                  : filter === "completed"
                    ? "No completed deliveries"
                    : filter === "cancelled"
                      ? "No cancelled deliveries"
                      : "No deliveries yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              {filter === "active"
                ? "Accepted deliveries will appear here while you are working on them."
                : filter === "awaiting_confirmation"
                  ? "When you submit a delivery, it will remain here until the customer confirms receipt."
                  : filter === "completed"
                    ? "Completed deliveries will appear here after customer confirmation."
                    : "Your delivery history will appear here as you receive and complete deliveries."}
            </p>

            <button
              type="button"
              onClick={() => void loadDeliveries(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-900 dark-surface"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredDeliveries.map(renderDeliveryCard)}
          </div>
        )}
      </div>
    </div>
  );
}
