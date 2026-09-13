

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bike,
  CheckCircle2,
  Clock3,
  DollarSign,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Settings,
  Truck,
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
} from "../../libs/format";

type Rider = {
  id: string;
  user_id: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  operating_area: string | null;
  available: boolean;
  verified: boolean;
  active: boolean;
};

type DeliveryRequest = {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
  expires_at: string | null;
};

type DeliveryAssignment = {
  id: string;
  order_id: string;
  rider_id: string;
  status: string;
  pickup_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

type Order = {
  id: string;
  reference: string | null;
  status: string;
  delivery_fee: number;
  total_amount: number;
  created_at: string;
};

type RiderEarning = {
  id: string;
  rider_id: string;
  order_id: string | null;
  amount: number;
  status: string;
  created_at: string;
};

type DashboardDelivery = DeliveryAssignment & {
  order: Order | null;
};

function normalizeStatus(status: string) {
  return status.toLowerCase().replace(/[\s-]+/g, "_");
}

function isActiveDelivery(status: string) {
  return [
    "assigned",
    "accepted",
    "picked_up",
    "out_for_delivery",
    "in_transit",
  ].includes(normalizeStatus(status));
}

function isCompletedDelivery(status: string) {
  return [
    "delivered",
    "completed",
  ].includes(normalizeStatus(status));
}

function isCancelledDelivery(status: string) {
  return [
    "cancelled",
    "canceled",
    "rejected",
    "failed",
  ].includes(normalizeStatus(status));
}

function getDeliveryStatusLabel(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "assigned") {
    return "Assigned";
  }

  if (normalized === "accepted") {
    return "Accepted";
  }

  if (normalized === "picked_up") {
    return "Picked up";
  }

  if (
    normalized === "out_for_delivery" ||
    normalized === "in_transit"
  ) {
    return "Out for delivery";
  }

  if (normalized === "delivered") {
    return "Delivered";
  }

  if (normalized === "completed") {
    return "Completed";
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return "Cancelled";
  }

  return status || "Unknown";
}

export default function RiderDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rider, setRider] = useState<Rider | null>(null);
  const [requests, setRequests] = useState<
    DeliveryRequest[]
  >([]);
  const [deliveries, setDeliveries] = useState<
    DashboardDelivery[]
  >([]);
  const [earnings, setEarnings] = useState<RiderEarning[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availabilityUpdating, setAvailabilityUpdating] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard(
    showFullLoader = true,
  ) {
    if (showFullLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const currentProfile = await getCurrentProfile();

      if (!currentProfile) {
        throw new Error("Unable to load your account.");
      }

      setProfile(currentProfile);

      const { data: riderData, error: riderError } =
        await supabase
          .from("riders")
          .select(
            "id, user_id, vehicle_type, vehicle_number, operating_area, available, verified, active",
          )
          .eq("user_id", currentProfile.id)
          .maybeSingle();

      if (riderError) {
        throw riderError;
      }

      if (!riderData) {
        throw new Error(
          "Your rider profile could not be found.",
        );
      }

      const riderProfile = riderData as Rider;

      setRider(riderProfile);

      const [
        requestsResult,
        assignmentsResult,
        earningsResult,
      ] = await Promise.all([
        supabase
          .from("delivery_requests")
          .select(
            "id, order_id, status, created_at, expires_at",
          )
          .eq("status", "pending")
          .order("created_at", { ascending: false }),

        supabase
          .from("delivery_assignments")
          .select(
            "id, order_id, rider_id, status, pickup_at, delivered_at, created_at, updated_at",
          )
          .eq("rider_id", riderProfile.id)
          .order("created_at", { ascending: false })
          .limit(20),

        supabase
          .from("rider_earnings")
          .select(
            "id, rider_id, order_id, amount, status, created_at",
          )
          .eq("rider_id", riderProfile.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (requestsResult.error) {
        throw requestsResult.error;
      }

      if (assignmentsResult.error) {
        throw assignmentsResult.error;
      }

      if (earningsResult.error) {
        throw earningsResult.error;
      }

      setRequests(
        (requestsResult.data ?? []) as DeliveryRequest[],
      );

      const assignments =
        (assignmentsResult.data ??
          []) as DeliveryAssignment[];

      setEarnings(
        (earningsResult.data ?? []) as RiderEarning[],
      );

      const orderIds = [
        ...new Set(
          assignments
            .map((assignment) => assignment.order_id)
            .filter(Boolean),
        ),
      ];

      let orders: Order[] = [];

      if (orderIds.length > 0) {
        const { data: orderData, error: orderError } =
          await supabase
            .from("orders")
            .select(
              "id, reference, status, delivery_fee, total_amount, created_at",
            )
            .in("id", orderIds);

        if (orderError) {
          throw orderError;
        }

        orders = (orderData ?? []) as Order[];
      }

      const orderMap = new Map(
        orders.map((order) => [order.id, order]),
      );

      setDeliveries(
        assignments.map((assignment) => ({
          ...assignment,
          order:
            orderMap.get(assignment.order_id) ?? null,
        })),
      );
    } catch (err) {
      logAppError("rider-dashboard-load", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function toggleAvailability() {
    if (!rider) {
      return;
    }

    setAvailabilityUpdating(true);
    setError("");

    try {
      const nextAvailability = !rider.available;

      const { data, error: updateError } = await supabase
        .from("riders")
        .update({
          available: nextAvailability,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rider.id)
        .eq("user_id", profile?.id || "")
        .select(
          "id, user_id, vehicle_type, vehicle_number, operating_area, available, verified, active",
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      setRider(data as Rider);
    } catch (err) {
      logAppError(
        "rider-availability-update",
        err,
      );
      setError(getSafeErrorMessage(err));
    } finally {
      setAvailabilityUpdating(false);
    }
  }

  const stats = useMemo(() => {
    const activeDeliveries = deliveries.filter(
      (delivery) =>
        isActiveDelivery(delivery.status),
    ).length;

    const completedDeliveries = deliveries.filter(
      (delivery) =>
        isCompletedDelivery(delivery.status),
    ).length;

    const completedEarnings = earnings
      .filter((earning) =>
        [
          "completed",
          "successful",
          "paid",
          "settled",
        ].includes(normalizeStatus(earning.status)),
      )
      .reduce(
        (total, earning) =>
          total + Number(earning.amount || 0),
        0,
      );

    const pendingEarnings = earnings
      .filter((earning) =>
        [
          "pending",
          "processing",
          "pending_payout",
        ].includes(normalizeStatus(earning.status)),
      )
      .reduce(
        (total, earning) =>
          total + Number(earning.amount || 0),
        0,
      );

    return {
      activeDeliveries,
      completedDeliveries,
      completedEarnings,
      pendingEarnings,
    };
  }, [deliveries, earnings]);

  const recentDeliveries = deliveries.slice(0, 5);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading rider dashboard...</span>
        </div>
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Bike className="mx-auto mb-4 h-10 w-10 text-gray-400" />

          <h1 className="text-xl font-semibold text-gray-900">
            Rider profile unavailable
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "We could not find a rider profile associated with your account."}
          </p>

          <Link
            to="/rider/profile"
            className="mt-6 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Open Rider Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            Welcome back
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Rider Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage delivery requests, active deliveries, and
            rider earnings.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void loadDashboard(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <Link
            to="/rider/profile"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <Settings className="h-4 w-4" />
            Profile
          </Link>
        </div>
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

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <Bike className="h-7 w-7 text-gray-700" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                {profile?.full_name || "Rider"}
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                {rider.vehicle_type && (
                  <span>{rider.vehicle_type}</span>
                )}

                {rider.vehicle_number && (
                  <>
                    <span>•</span>
                    <span>{rider.vehicle_number}</span>
                  </>
                )}

                {rider.operating_area && (
                  <>
                    <span>•</span>
                    <span>{rider.operating_area}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  rider.available
                    ? "bg-green-500"
                    : "bg-gray-400"
                }`}
              />

              <span className="text-sm font-medium text-gray-700">
                {rider.available
                  ? "Available for deliveries"
                  : "Currently offline"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void toggleAvailability()}
              disabled={
                availabilityUpdating || !rider.active
              }
              className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                rider.available
                  ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {availabilityUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : rider.available ? (
                "Go Offline"
              ) : (
                "Go Online"
              )}
            </button>
          </div>
        </div>

        {!rider.verified && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your rider profile is still awaiting verification.
            Delivery requests may remain unavailable until
            verification is completed.
          </div>
        )}

        {!rider.active && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Your rider account is currently inactive. Contact
            platform support if you believe this is incorrect.
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Package className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                New Requests
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {requests.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Truck className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Active Deliveries
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {stats.activeDeliveries}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <CheckCircle2 className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Completed Deliveries
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {stats.completedDeliveries}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <DollarSign className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Completed Earnings
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatNaira(stats.completedEarnings)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 p-5">
            <div>
              <h2 className="font-semibold text-gray-900">
                Recent Deliveries
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your latest delivery activity.
              </p>
            </div>

            <Link
              to="/rider/deliveries"
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:underline"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentDeliveries.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Package className="mx-auto mb-3 h-9 w-9 text-gray-300" />

              <p className="font-medium text-gray-900">
                No deliveries yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Accepted deliveries will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentDeliveries.map((delivery) => {
                const active = isActiveDelivery(
                  delivery.status,
                );
                const cancelled =
                  isCancelledDelivery(
                    delivery.status,
                  );

                return (
                  <Link
                    key={delivery.id}
                    to={`/rider/deliveries/${delivery.order_id}`}
                    className="block p-5 transition hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                          {active ? (
                            <Activity className="h-5 w-5 text-gray-700" />
                          ) : (
                            <Package className="h-5 w-5 text-gray-600" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {delivery.order?.reference ||
                              delivery.order_id}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatDateTime(
                              delivery.created_at,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            cancelled
                              ? "bg-red-50 text-red-700"
                              : active
                                ? "bg-amber-50 text-amber-700"
                                : "bg-green-50 text-green-700"
                          }`}
                        >
                          {cancelled ? (
                            <XCircle className="h-3.5 w-3.5" />
                          ) : active ? (
                            <Clock3 className="h-3.5 w-3.5" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}

                          {getDeliveryStatusLabel(
                            delivery.status,
                          )}
                        </span>

                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <MapPin className="h-5 w-5 text-gray-700" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Operating Area
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {rider.operating_area ||
                    "Not configured"}
                </p>
              </div>
            </div>

            <Link
              to="/rider/profile"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:underline"
            >
              Update profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-gray-700" />

              <h2 className="font-semibold text-gray-900">
                Earnings
              </h2>
            </div>

            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatNaira(stats.completedEarnings)}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {formatNaira(stats.pendingEarnings)} pending
            </p>

            <Link
              to="/rider/earnings"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:underline"
            >
              View earnings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Quick Actions
            </h2>

            <div className="mt-4 grid gap-2">
              <Link
                to="/rider/requests"
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Delivery Requests
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>

              <Link
                to="/rider/deliveries"
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                My Deliveries
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>

              <Link
                to="/rider/messages"
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Messages
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
