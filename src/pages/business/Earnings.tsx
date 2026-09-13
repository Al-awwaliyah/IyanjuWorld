

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownToLine,
  Banknote,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Wallet,
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

type Business = {
  id: string;
  name: string;
  owner_id: string;
};

type BusinessEarning = {
  id: string;
  business_id: string;
  order_id: string | null;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  available_at: string | null;
  created_at: string;
  updated_at: string;
};

type Order = {
  id: string;
  reference: string | null;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  created_at: string;
};

type EarningRow = BusinessEarning & {
  order: Order | null;
};

function normalizeStatus(status: string) {
  return status.toLowerCase().replace(/[\s-]+/g, "_");
}

function isAvailable(status: string) {
  return [
    "available",
    "settled",
    "completed",
    "paid",
  ].includes(normalizeStatus(status));
}

function isPending(status: string) {
  return [
    "pending",
    "processing",
    "pending_settlement",
    "held",
  ].includes(normalizeStatus(status));
}

function isCancelled(status: string) {
  return [
    "cancelled",
    "canceled",
    "refunded",
    "reversed",
    "failed",
  ].includes(normalizeStatus(status));
}

function getStatusLabel(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "pending_settlement") {
    return "Pending settlement";
  }

  if (normalized === "available") {
    return "Available";
  }

  if (normalized === "settled") {
    return "Settled";
  }

  if (normalized === "completed") {
    return "Completed";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "Cancelled";
  }

  if (normalized === "refunded") {
    return "Refunded";
  }

  if (normalized === "reversed") {
    return "Reversed";
  }

  return status || "Unknown";
}

export default function BusinessEarnings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [earnings, setEarnings] = useState<EarningRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    void loadEarnings();
  }, []);

  async function loadEarnings() {
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

      const { data: earningData, error: earningError } =
        await supabase
          .from("business_earnings")
          .select(
            "id, business_id, order_id, gross_amount, platform_fee, net_amount, status, available_at, created_at, updated_at",
          )
          .eq("business_id", businessData.id)
          .order("created_at", { ascending: false });

      if (earningError) {
        throw earningError;
      }

      const rows = (earningData ?? []) as BusinessEarning[];

      if (rows.length === 0) {
        setEarnings([]);
        return;
      }

      const orderIds = [
        ...new Set(
          rows
            .map((row) => row.order_id)
            .filter(
              (orderId): orderId is string =>
                Boolean(orderId),
            ),
        ),
      ];

      let orders: Order[] = [];

      if (orderIds.length > 0) {
        const { data: orderData, error: orderError } =
          await supabase
            .from("orders")
            .select(
              "id, reference, status, subtotal, delivery_fee, total_amount, created_at",
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

      setEarnings(
        rows.map((row) => ({
          ...row,
          order: row.order_id
            ? orderMap.get(row.order_id) ?? null
            : null,
        })),
      );
    } catch (err) {
      logAppError("business-earnings-load", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    let gross = 0;
    let platformFees = 0;
    let net = 0;
    let available = 0;
    let pending = 0;

    for (const earning of earnings) {
      const grossAmount = Number(earning.gross_amount || 0);
      const platformFee = Number(earning.platform_fee || 0);
      const netAmount = Number(earning.net_amount || 0);

      gross += grossAmount;
      platformFees += platformFee;
      net += netAmount;

      if (isAvailable(earning.status)) {
        available += netAmount;
      }

      if (isPending(earning.status)) {
        pending += netAmount;
      }
    }

    return {
      gross,
      platformFees,
      net,
      available,
      pending,
    };
  }, [earnings]);

  const filteredEarnings = useMemo(() => {
    if (statusFilter === "all") {
      return earnings;
    }

    return earnings.filter((earning) => {
      if (statusFilter === "available") {
        return isAvailable(earning.status);
      }

      if (statusFilter === "pending") {
        return isPending(earning.status);
      }

      if (statusFilter === "cancelled") {
        return isCancelled(earning.status);
      }

      return normalizeStatus(earning.status) === statusFilter;
    });
  }, [earnings, statusFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading earnings...</span>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Wallet className="mx-auto mb-4 h-10 w-10 text-gray-400" />

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
            Earnings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Track your sales earnings, platform fees, and
            available funds.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void loadEarnings()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <Link
            to="/business/payouts"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Payouts
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Banknote className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Gross Sales
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNaira(totals.gross)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Banknote className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Platform Fees
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNaira(totals.platformFees)}
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
                Net Earnings
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNaira(totals.net)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Wallet className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Available
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNaira(totals.available)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Earnings Ledger
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Each row represents earnings generated from an
              order.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["available", "Available"],
              ["pending", "Pending"],
              ["cancelled", "Cancelled"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  statusFilter === value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {filteredEarnings.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Wallet className="mx-auto mb-4 h-10 w-10 text-gray-300" />

            <h3 className="text-lg font-semibold text-gray-900">
              No earnings found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Earnings will appear here when your orders generate
              business revenue.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Order
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Gross
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Platform Fee
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Net
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredEarnings.map((earning) => {
                    const cancelled = isCancelled(
                      earning.status,
                    );

                    return (
                      <tr
                        key={earning.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <Link
                            to={
                              earning.order_id
                                ? `/business/orders/${earning.order_id}`
                                : "/business/orders"
                            }
                            className="font-semibold text-gray-900 hover:underline"
                          >
                            {earning.order?.reference ||
                              earning.order_id ||
                              "Order"}
                          </Link>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700">
                          {formatNaira(
                            Number(
                              earning.gross_amount || 0,
                            ),
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700">
                          {formatNaira(
                            Number(
                              earning.platform_fee || 0,
                            ),
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {formatNaira(
                            Number(earning.net_amount || 0),
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              cancelled
                                ? "bg-red-50 text-red-700"
                                : isPending(earning.status)
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-green-50 text-green-700"
                            }`}
                          >
                            {cancelled ? (
                              <XCircle className="h-3.5 w-3.5" />
                            ) : isPending(earning.status) ? (
                              <Clock3 className="h-3.5 w-3.5" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}

                            {getStatusLabel(earning.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {formatDateTime(
                            earning.created_at,
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-gray-100 md:hidden">
              {filteredEarnings.map((earning) => {
                const cancelled = isCancelled(
                  earning.status,
                );

                return (
                  <div key={earning.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          to={
                            earning.order_id
                              ? `/business/orders/${earning.order_id}`
                              : "/business/orders"
                          }
                          className="font-semibold text-gray-900"
                        >
                          {earning.order?.reference ||
                            earning.order_id ||
                            "Order"}
                        </Link>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDateTime(
                            earning.created_at,
                          )}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          cancelled
                            ? "bg-red-50 text-red-700"
                            : isPending(earning.status)
                              ? "bg-amber-50 text-amber-700"
                              : "bg-green-50 text-green-700"
                        }`}
                      >
                        {getStatusLabel(earning.status)}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">
                          Gross
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {formatNaira(
                            Number(
                              earning.gross_amount || 0,
                            ),
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Platform Fee
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {formatNaira(
                            Number(
                              earning.platform_fee || 0,
                            ),
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Net Earnings
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {formatNaira(
                            Number(earning.net_amount || 0),
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Available At
                        </p>

                        <p className="mt-1 font-medium text-gray-700">
                          {earning.available_at
                            ? formatDateTime(
                                earning.available_at,
                              )
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="flex items-start gap-3">
          <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />

          <div>
            <h3 className="font-semibold text-gray-900">
              Earnings and payouts
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              Earnings shown here are separate from payout
              activity. Funds become available according to the
              marketplace settlement rules, after which eligible
              funds can be requested through the Payouts section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
