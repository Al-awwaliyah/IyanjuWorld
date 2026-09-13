

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
  net_amount: number;
  status: string;
  available_at: string | null;
  created_at: string;
};

type Payout = {
  id: string;
  business_id: string;
  amount: number;
  status: string;
  reference: string | null;
  provider_reference: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

function normalizeStatus(status: string) {
  return status.toLowerCase().replace(/[\s-]+/g, "_");
}

function isSuccessful(status: string) {
  return [
    "completed",
    "successful",
    "success",
    "paid",
    "settled",
  ].includes(normalizeStatus(status));
}

function isPending(status: string) {
  return [
    "pending",
    "processing",
    "queued",
    "initiated",
  ].includes(normalizeStatus(status));
}

function isFailed(status: string) {
  return [
    "failed",
    "cancelled",
    "canceled",
    "reversed",
    "rejected",
  ].includes(normalizeStatus(status));
}

function getStatusLabel(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "completed") {
    return "Completed";
  }

  if (normalized === "successful" || normalized === "success") {
    return "Successful";
  }

  if (normalized === "processing") {
    return "Processing";
  }

  if (normalized === "queued") {
    return "Queued";
  }

  if (normalized === "initiated") {
    return "Initiated";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "Cancelled";
  }

  if (normalized === "reversed") {
    return "Reversed";
  }

  if (normalized === "rejected") {
    return "Rejected";
  }

  if (normalized === "failed") {
    return "Failed";
  }

  return status || "Unknown";
}

export default function BusinessPayouts() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [earnings, setEarnings] = useState<BusinessEarning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    void loadPayouts();
  }, []);

  async function loadPayouts() {
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

      const [earningsResult, payoutsResult] =
        await Promise.all([
          supabase
            .from("business_earnings")
            .select(
              "id, business_id, net_amount, status, available_at, created_at",
            )
            .eq("business_id", businessData.id),

          supabase
            .from("payouts")
            .select(
              "id, business_id, amount, status, reference, provider_reference, created_at, updated_at, completed_at",
            )
            .eq("business_id", businessData.id)
            .order("created_at", { ascending: false }),
        ]);

      if (earningsResult.error) {
        throw earningsResult.error;
      }

      if (payoutsResult.error) {
        throw payoutsResult.error;
      }

      setEarnings(
        (earningsResult.data ?? []) as BusinessEarning[],
      );

      setPayouts((payoutsResult.data ?? []) as Payout[]);
    } catch (err) {
      logAppError("business-payouts-load", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const financialSummary = useMemo(() => {
    let availableEarnings = 0;
    let pendingEarnings = 0;
    let totalPaidOut = 0;
    let pendingPayouts = 0;

    for (const earning of earnings) {
      const amount = Number(earning.net_amount || 0);

      if (isSuccessful(earning.status)) {
        availableEarnings += amount;
      } else if (isPending(earning.status)) {
        pendingEarnings += amount;
      }
    }

    for (const payout of payouts) {
      const amount = Number(payout.amount || 0);

      if (isSuccessful(payout.status)) {
        totalPaidOut += amount;
      } else if (isPending(payout.status)) {
        pendingPayouts += amount;
      }
    }

    const estimatedAvailable =
      Math.max(availableEarnings - totalPaidOut - pendingPayouts, 0);

    return {
      availableEarnings,
      pendingEarnings,
      totalPaidOut,
      pendingPayouts,
      estimatedAvailable,
    };
  }, [earnings, payouts]);

  const filteredPayouts = useMemo(() => {
    if (statusFilter === "all") {
      return payouts;
    }

    return payouts.filter((payout) => {
      if (statusFilter === "successful") {
        return isSuccessful(payout.status);
      }

      if (statusFilter === "pending") {
        return isPending(payout.status);
      }

      if (statusFilter === "failed") {
        return isFailed(payout.status);
      }

      return normalizeStatus(payout.status) === statusFilter;
    });
  }, [payouts, statusFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading payouts...</span>
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
            Payouts
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View your business payout history and settlement
            status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPayouts()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Wallet className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Available to Payout
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNaira(
                  financialSummary.estimatedAvailable,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Clock3 className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Pending Earnings
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNaira(
                  financialSummary.pendingEarnings,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <ArrowDownToLine className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Paid Out
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNaira(
                  financialSummary.totalPaidOut,
                )}
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
                Pending Payouts
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNaira(
                  financialSummary.pendingPayouts,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Payout History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredPayouts.length} payout
              {filteredPayouts.length === 1 ? "" : "s"} shown
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["successful", "Successful"],
              ["pending", "Pending"],
              ["failed", "Failed"],
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

        {filteredPayouts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ArrowDownToLine className="mx-auto mb-4 h-10 w-10 text-gray-300" />

            <h3 className="text-lg font-semibold text-gray-900">
              No payouts yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Payout records will appear here after a payout has
              been initiated for your business.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Reference
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Created
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Completed
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredPayouts.map((payout) => {
                    const successful = isSuccessful(
                      payout.status,
                    );
                    const pending = isPending(payout.status);
                    const failed = isFailed(payout.status);

                    return (
                      <tr
                        key={payout.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {payout.reference ||
                                payout.id}
                            </p>

                            {payout.provider_reference && (
                              <p className="mt-1 text-xs text-gray-500">
                                Provider:{" "}
                                {payout.provider_reference}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {formatNaira(
                            Number(payout.amount || 0),
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              failed
                                ? "bg-red-50 text-red-700"
                                : pending
                                  ? "bg-amber-50 text-amber-700"
                                  : successful
                                    ? "bg-green-50 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {failed ? (
                              <XCircle className="h-3.5 w-3.5" />
                            ) : pending ? (
                              <Clock3 className="h-3.5 w-3.5" />
                            ) : successful ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Banknote className="h-3.5 w-3.5" />
                            )}

                            {getStatusLabel(payout.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {formatDateTime(
                            payout.created_at,
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {payout.completed_at
                            ? formatDateTime(
                                payout.completed_at,
                              )
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-gray-100 md:hidden">
              {filteredPayouts.map((payout) => {
                const successful = isSuccessful(
                  payout.status,
                );
                const pending = isPending(payout.status);
                const failed = isFailed(payout.status);

                return (
                  <div key={payout.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {payout.reference ||
                            payout.id}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDateTime(
                            payout.created_at,
                          )}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          failed
                            ? "bg-red-50 text-red-700"
                            : pending
                              ? "bg-amber-50 text-amber-700"
                              : successful
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {getStatusLabel(payout.status)}
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs text-gray-500">
                        Amount
                      </p>

                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {formatNaira(
                          Number(payout.amount || 0),
                        )}
                      </p>
                    </div>

                    {payout.provider_reference && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500">
                          Provider Reference
                        </p>

                        <p className="mt-1 break-all text-sm text-gray-700">
                          {payout.provider_reference}
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <p className="text-xs text-gray-500">
                        Completed
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {payout.completed_at
                          ? formatDateTime(
                              payout.completed_at,
                            )
                          : "Not completed"}
                      </p>
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
              Payout processing
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              Payouts are processed through the platform's
              financial system. Your available earnings are
              separated from pending settlements and existing
              payout requests so the same funds are not paid out
              twice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
