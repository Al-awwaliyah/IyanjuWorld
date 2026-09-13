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

type DeliveryRequest = {
  id: string;
  order_id: string;
  rider_id: string | null;
  status: string;
  pickup_address: string | null;
  delivery_address: string | null;
  delivery_fee: number | null;
  rider_earning: number | null;
  notes: string | null;
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
};

type CustomerProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type RequestView = DeliveryRequest & {
  order?: Order;
  customer?: CustomerProfile;
};

const REQUEST_STATUSES = [
  "pending",
  "available",
  "delivery_requested",
];

function isAvailableRequest(status: string) {
  return REQUEST_STATUSES.includes(status.toLowerCase());
}

function getRequestStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "New request";
    case "available":
      return "Available";
    case "delivery_requested":
      return "Delivery requested";
    case "accepted":
      return "Accepted";
    default:
      return status.replace(/_/g, " ");
  }
}

export default function RiderRequests() {
  const [requests, setRequests] = useState<RequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadRequests = useCallback(
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
          .select("id, user_id, available, verified, active")
          .eq("user_id", profile.id)
          .maybeSingle();

        if (riderError) {
          throw riderError;
        }

        if (!rider) {
          throw new Error(
            "Your rider profile could not be found. Please contact support."
          );
        }

        if (rider.active === false) {
          throw new Error(
            "Your rider account is currently inactive. Please contact support."
          );
        }

        if (rider.verified === false) {
          throw new Error(
            "Your rider account has not been verified yet."
          );
        }

        if (rider.available === false) {
          setRequests([]);
          return;
        }

        const { data: deliveryRequests, error: requestsError } =
          await supabase
            .from("delivery_requests")
            .select(
              `
                id,
                order_id,
                rider_id,
                status,
                pickup_address,
                delivery_address,
                delivery_fee,
                rider_earning,
                notes,
                created_at,
                updated_at
              `
            )
            .is("rider_id", null)
            .in("status", REQUEST_STATUSES)
            .order("created_at", { ascending: false });

        if (requestsError) {
          throw requestsError;
        }

        const requestRows = (deliveryRequests ?? []) as DeliveryRequest[];

        if (requestRows.length === 0) {
          setRequests([]);
          return;
        }

        const orderIds = [
          ...new Set(
            requestRows
              .map((request) => request.order_id)
              .filter(Boolean)
          ),
        ];

        let orders: Order[] = [];

        if (orderIds.length > 0) {
          const { data: orderRows, error: ordersError } = await supabase
            .from("orders")
            .select(
              `
                id,
                reference,
                customer_id,
                status,
                total_amount,
                created_at
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

        const enrichedRequests: RequestView[] = requestRows.map(
          (request) => {
            const order = orderMap.get(request.order_id);

            return {
              ...request,
              order,
              customer: order
                ? customerMap.get(order.customer_id)
                : undefined,
            };
          }
        );

        setRequests(enrichedRequests);
      } catch (err) {
        logAppError(err, {
          operation: "rider.requests.load",
        });

        setRequests([]);
        setError(getSafeErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const availableRequests = useMemo(
    () =>
      requests.filter((request) => {
        if (request.rider_id) return false;
        return isAvailableRequest(request.status);
      }),
    [requests]
  );

  const handleAccept = async (request: RequestView) => {
    if (acceptingId) return;

    try {
      setAcceptingId(request.id);
      setError("");

      const profile = await getCurrentProfile();

      if (!profile?.id) {
        throw new Error("Your session could not be verified.");
      }

      const { data: rider, error: riderError } = await supabase
        .from("riders")
        .select("id, user_id, available, verified, active")
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

      if (rider.available === false) {
        throw new Error(
          "You are currently unavailable for deliveries."
        );
      }

      /*
       * The acceptance operation should eventually be handled by a
       * server-side RPC/Edge Function so that two riders cannot accept
       * the same request simultaneously.
       *
       * The conditional update below also checks that the request is
       * still unassigned and available before assigning it.
       */

      const { data: acceptedRequest, error: acceptError } =
        await supabase
          .from("delivery_requests")
          .update({
            rider_id: rider.id,
            status: "accepted",
            updated_at: new Date().toISOString(),
          })
          .eq("id", request.id)
          .is("rider_id", null)
          .in("status", REQUEST_STATUSES)
          .select(
            `
              id,
              order_id,
              rider_id,
              status,
              pickup_address,
              delivery_address,
              delivery_fee,
              rider_earning,
              notes,
              created_at,
              updated_at
            `
          )
          .maybeSingle();

      if (acceptError) {
        throw acceptError;
      }

      if (!acceptedRequest) {
        throw new Error(
          "This delivery is no longer available. Another rider may have accepted it."
        );
      }

      /*
       * Keep the order lifecycle synchronized with the delivery
       * assignment. The final implementation should move this into
       * the same transactional backend operation.
       */
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "rider_assigned",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.order_id)
        .in("status", [
          "paid",
          "business_confirmed",
          "delivery_requested",
        ]);

      if (orderError) {
        logAppError(orderError, {
          operation: "rider.requests.accept.order_status",
          requestId: request.id,
          orderId: request.order_id,
        });
      }

      await loadRequests(true);
    } catch (err) {
      logAppError(err, {
        operation: "rider.requests.accept",
        requestId: request.id,
        orderId: request.order_id,
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
              <Truck className="h-4 w-4" />
              Rider delivery requests
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Available Deliveries
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Accept an eligible delivery request and complete the delivery
              safely through the customer confirmation process.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadRequests(true)}
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
              <p className="font-semibold">Unable to load delivery requests</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Package className="h-5 w-5" />
              </div>

              <p className="text-sm text-slate-500">
                Available requests
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {availableRequests.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <p className="text-sm text-slate-500">
                Ready to accept
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {availableRequests.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Clock3 className="h-5 w-5" />
              </div>

              <p className="text-sm text-slate-500">
                Delivery confirmation
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                Customer confirmation required
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="h-5 w-40 rounded bg-slate-200" />
                <div className="mt-4 h-4 w-full rounded bg-slate-200" />
                <div className="mt-2 h-4 w-4/5 rounded bg-slate-200" />
                <div className="mt-6 h-12 w-full rounded-xl bg-slate-200" />
              </div>
            ))}
          </div>
        ) : availableRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Truck className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              No delivery requests available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              New delivery requests will appear here when you are available
              and eligible to receive deliveries.
            </p>

            <button
              type="button"
              onClick={() => void loadRequests(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Check again
            </button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {availableRequests.map((request) => {
              const order = request.order;
              const customer = request.customer;
              const isAccepting = acceptingId === request.id;

              return (
                <article
                  key={request.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <Package className="h-5 w-5" />
                          </span>

                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {order?.reference ??
                                `Order ${request.order_id.slice(0, 8)}`}
                            </p>

                            <p className="text-xs text-slate-500">
                              {formatRelativeDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold capitalize text-blue-700">
                        {getRequestStatusLabel(request.status)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-5 p-5">
                    <div>
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className="mt-1 h-3 w-3 rounded-full border-2 border-blue-600 bg-white" />
                          <span className="h-12 w-px bg-slate-200" />
                          <span className="h-3 w-3 rounded-full bg-emerald-500" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-5">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Pickup
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-800">
                              {request.pickup_address ||
                                "Pickup address will be provided."}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Delivery
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-800">
                              {request.delivery_address ||
                                "Delivery address will be provided."}
                            </p>
                          </div>
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
                          {formatNaira(
                            Number(request.rider_earning ?? 0)
                          )}
                        </p>

                        <p className="mt-1 text-xs text-emerald-700">
                          Paid directly to your verified bank account after
                          customer confirmation.
                        </p>
                      </div>
                    </div>

                    {request.delivery_fee !== null && (
                      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
                        <span className="text-sm text-slate-500">
                          Customer delivery fee
                        </span>

                        <span className="text-sm font-semibold text-slate-900">
                          {formatNaira(Number(request.delivery_fee))}
                        </span>
                      </div>
                    )}

                    {request.notes && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                          Delivery note
                        </p>

                        <p className="mt-2 text-sm leading-6 text-amber-900">
                          {request.notes}
                        </p>
                      </div>
                    )}

                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                        <div>
                          <p className="text-sm font-semibold text-blue-900">
                            Delivery safety
                          </p>

                          <p className="mt-1 text-xs leading-5 text-blue-800">
                            After delivery, you will submit the delivery for
                            customer confirmation. The order will only become
                            completed after the customer accepts the delivery.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => void handleAccept(request)}
                        disabled={isAccepting}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isAccepting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Accept Delivery
                          </>
                        )}
                      </button>

                      {order?.id && (
                        <Link
                          to={`/rider/deliveries/${order.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <MapPin className="h-4 w-4" />
                          View Details
                        </Link>
                      )}
                    </div>

                    <p className="text-center text-xs text-slate-400">
                      Request created {formatDateTime(request.created_at)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
