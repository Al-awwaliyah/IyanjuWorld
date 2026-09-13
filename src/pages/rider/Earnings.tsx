import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  Clock3,
  RefreshCw,
  TrendingUp,
  Truck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getCurrentProfile } from "../../libs/auth";
import { supabase } from "../../libs/supabase";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import {
  formatDate,
  formatDateTime,
  formatNaira,
  formatRelativeDate,
} from "../../libs/format";

type RiderEarning = {
  id: string;
  rider_id: string;
  order_id: string;
  amount: number;
  status: string;
  available_at: string | null;
  created_at: string;
  updated_at: string | null;
};

type Payout = {
  id: string;
  rider_id: string | null;
  business_id: string | null;
  amount: number;
  status: string;
  reference: string | null;
  provider: string | null;
  provider_reference: string | null;
  bank_code: string | null;
  account_name: string | null;
  account_number_last4: string | null;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
};

type Order = {
  id: string;
  reference: string | null;
  status: string;
  created_at: string;
};

type EarningView = RiderEarning & {
  order?: Order;
};

type FilterKey =
  | "all"
  | "available"
  | "pending"
  | "paid"
  | "failed";

function normalizeStatus(status: string | null | undefined) {
  return String(status ?? "").toLowerCase().trim();
}

function isSuccessfulPayout(status: string) {
  return [
    "successful",
    "success",
    "completed",
    "paid",
  ].includes(normalizeStatus(status));
}

function isPendingPayout(status: string) {
  return [
    "pending",
    "processing",
    "initiated",
    "queued",
  ].includes(normalizeStatus(status));
}

function isFailedPayout(status: string) {
  return [
    "failed",
    "reversed",
    "cancelled",
  ].includes(normalizeStatus(status));
}

function isAvailableEarning(status: string) {
  return [
    "available",
    "payable",
    "earned",
    "pending_payout",
  ].includes(normalizeStatus(status));
}

function getPayoutStatusLabel(status: string) {
  const normalized = normalizeStatus(status);

  if (isSuccessfulPayout(normalized)) {
    return "Paid";
  }

  if (isPendingPayout(normalized)) {
    return "Processing";
  }

  if (isFailedPayout(normalized)) {
    return "Failed";
  }

  return String(status || "Unknown").replace(/_/g, " ");
}

function getPayoutStatusClasses(status: string) {
  const normalized = normalizeStatus(status);

  if (isSuccessfulPayout(normalized)) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (isPendingPayout(normalized)) {
    return "bg-amber-50 text-amber-700";
  }

  if (isFailedPayout(normalized)) {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getEarningStatusLabel(status: string) {
  const normalized = normalizeStatus(status);

  if (isAvailableEarning(normalized)) {
    return "Payable";
  }

  if (normalized === "paid") {
    return "Paid";
  }

  if (normalized === "pending") {
    return "Pending";
  }

  if (normalized === "cancelled") {
    return "Cancelled";
  }

  return String(status || "Unknown").replace(/_/g, " ");
}

function getEarningStatusClasses(status: string) {
  const normalized = normalizeStatus(status);

  if (isAvailableEarning(normalized)) {
    return "bg-blue-50 text-blue-700";
  }

  if (normalized === "paid") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalized === "pending") {
    return "bg-amber-50 text-amber-700";
  }

  if (normalized === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default function RiderEarnings() {
  const [earnings, setEarnings] = useState<EarningView[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [error, setError] = useState("");

  const loadEarnings = useCallback(
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

        const { data: earningRows, error: earningsError } =
          await supabase
            .from("rider_earnings")
            .select(
              `
                id,
                rider_id,
                order_id,
                amount,
                status,
                available_at,
                created_at,
                updated_at
              `
            )
            .eq("rider_id", rider.id)
            .order("created_at", { ascending: false });

        if (earningsError) {
          throw earningsError;
        }

        const earningList =
          (earningRows ?? []) as RiderEarning[];

        const orderIds = [
          ...new Set(
            earningList
              .map((earning) => earning.order_id)
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
                  status,
                  created_at
                `
              )
              .in("id", orderIds);

          if (ordersError) {
            throw ordersError;
          }

          orders = (orderRows ?? []) as Order[];
        }

        const orderMap = new Map(
          orders.map((order) => [order.id, order])
        );

        const enrichedEarnings = earningList.map(
          (earning) => ({
            ...earning,
            order: orderMap.get(earning.order_id),
          })
        );

        const { data: payoutRows, error: payoutsError } =
          await supabase
            .from("payouts")
            .select(
              `
                id,
                rider_id,
                business_id,
                amount,
                status,
                reference,
                provider,
                provider_reference,
                bank_code,
                account_name,
                account_number_last4,
                created_at,
                updated_at,
                completed_at,
                failed_at,
                failure_reason
              `
            )
            .eq("rider_id", rider.id)
            .order("created_at", { ascending: false });

        if (payoutsError) {
          throw payoutsError;
        }

        setEarnings(enrichedEarnings);
        setPayouts((payoutRows ?? []) as Payout[]);
      } catch (err) {
        logAppError(err, {
          operation: "rider.earnings.load",
        });

        setEarnings([]);
        setPayouts([]);
        setError(getSafeErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadEarnings();
  }, [loadEarnings]);

  const totals = useMemo(() => {
    const totalEarned = earnings.reduce(
      (sum, earning) => sum + Number(earning.amount || 0),
      0
    );

    const payable = earnings
      .filter((earning) =>
        isAvailableEarning(earning.status)
      )
      .reduce(
        (sum, earning) => sum + Number(earning.amount || 0),
        0
      );

    const pending = earnings
      .filter(
        (earning) =>
          normalizeStatus(earning.status) === "pending"
      )
      .reduce(
        (sum, earning) => sum + Number(earning.amount || 0),
        0
      );

    const paidOut = payouts
      .filter((payout) => isSuccessfulPayout(payout.status))
      .reduce(
        (sum, payout) => sum + Number(payout.amount || 0),
        0
      );

    const processing = payouts
      .filter((payout) => isPendingPayout(payout.status))
      .reduce(
        (sum, payout) => sum + Number(payout.amount || 0),
        0
      );

    const failed = payouts
      .filter((payout) => isFailedPayout(payout.status))
      .reduce(
        (sum, payout) => sum + Number(payout.amount || 0),
        0
      );

    return {
      totalEarned,
      payable,
      pending,
      paidOut,
      processing,
      failed,
    };
  }, [earnings, payouts]);

  const filteredEarnings = useMemo(() => {
    switch (filter) {
      case "available":
        return earnings.filter((earning) =>
          isAvailableEarning(earning.status)
        );

      case "pending":
        return earnings.filter(
          (earning) =>
            normalizeStatus(earning.status) === "pending"
        );

      case "paid":
        return earnings.filter(
          (earning) =>
            normalizeStatus(earning.status) === "paid"
        );

      case "failed":
        return earnings.filter(
          (earning) =>
            normalizeStatus(earning.status) === "cancelled"
        );

      case "all":
      default:
        return earnings;
    }
  }, [earnings, filter]);

  const filterItems: {
    key: FilterKey;
    label: string;
    count: number;
  }[] = [
    {
      key: "all",
      label: "All earnings",
      count: earnings.length,
    },
    {
      key: "available",
      label: "Payable",
      count: earnings.filter((earning) =>
        isAvailableEarning(earning.status)
      ).length,
    },
    {
      key: "pending",
      label: "Pending",
      count: earnings.filter(
        (earning) =>
          normalizeStatus(earning.status) === "pending"
      ).length,
    },
    {
      key: "paid",
      label: "Paid",
      count: earnings.filter(
        (earning) =>
          normalizeStatus(earning.status) === "paid"
      ).length,
    },
    {
      key: "failed",
      label: "Cancelled",
      count: earnings.filter(
        (earning) =>
          normalizeStatus(earning.status) === "cancelled"
      ).length,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-52 rounded bg-slate-200" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl bg-white"
                />
              ))}
            </div>

            <div className="h-16 rounded-2xl bg-white" />
            <div className="h-96 rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
              <TrendingUp className="h-4 w-4" />
              Rider earnings
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Earnings & Payouts
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Track your delivery earnings and direct bank payouts. IyanjuWorld
              does not hold rider funds in a wallet.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadEarnings(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Unable to load earnings
              </p>

              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <TrendingUp className="h-5 w-5" />
            </div>

            <p className="text-sm text-slate-500">
              Total earned
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNaira(totals.totalEarned)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <p className="text-sm text-slate-500">
              Paid to bank
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNaira(totals.paidOut)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>

            <p className="text-sm text-slate-500">
              Pending payout
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNaira(totals.processing)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <WalletCards className="h-5 w-5" />
            </div>

            <p className="text-sm text-slate-500">
              Payable earnings
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNaira(totals.payable)}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <ArrowDownToLine className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

            <div>
              <p className="text-sm font-bold text-blue-900">
                Direct bank payout
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                Your earnings are paid directly to your verified bank account
                after the customer confirms delivery. There is no rider wallet,
                wallet balance, deposit, or manual withdrawal process.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Delivery earnings
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Earnings are created from completed deliveries.
                </p>
              </div>

              <Truck className="h-5 w-5 text-slate-400" />
            </div>
          </div>

          <div className="overflow-x-auto border-b border-slate-100">
            <div className="flex min-w-max gap-2 p-2">
              {filterItems.map((item) => {
                const selected = filter === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      selected
                        ? "bg-slate-900 text-white"
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

          {filteredEarnings.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <TrendingUp className="h-7 w-7" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                No earnings found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Earnings will appear here after deliveries are completed and
                processed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEarnings.map((earning) => (
                <div
                  key={earning.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        {earning.order?.reference ||
                          `Order ${earning.order_id.slice(0, 8)}`}
                      </p>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getEarningStatusClasses(
                          earning.status
                        )}`}
                      >
                        {getEarningStatusLabel(
                          earning.status
                        )}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatRelativeDate(earning.created_at)}
                    </p>

                    {earning.available_at && (
                      <p className="mt-1 text-xs text-slate-400">
                        Payable from{" "}
                        {formatDate(earning.available_at)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        {formatNaira(
                          Number(earning.amount || 0)
                        )}
                      </p>

                      <p className="text-xs text-slate-500">
                        Delivery earning
                      </p>
                    </div>

                    {earning.order_id && (
                      <Link
                        to={`/rider/deliveries/${earning.order_id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Bank payouts
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Direct transfers to your verified bank account.
                </p>
              </div>

              <ArrowDownToLine className="h-5 w-5 text-slate-400" />
            </div>
          </div>

          {payouts.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <ArrowDownToLine className="h-7 w-7" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                No bank payouts yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Once a completed delivery becomes payable, IyanjuWorld will
                process the payout directly to your verified bank account.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payouts.map((payout) => {
                const successful = isSuccessfulPayout(
                  payout.status
                );
                const pending = isPendingPayout(
                  payout.status
                );
                const failed = isFailedPayout(
                  payout.status
                );

                return (
                  <div
                    key={payout.id}
                    className="p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            successful
                              ? "bg-emerald-50 text-emerald-700"
                              : pending
                                ? "bg-amber-50 text-amber-700"
                                : failed
                                  ? "bg-red-50 text-red-700"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {successful ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : pending ? (
                            <Clock3 className="h-5 w-5" />
                          ) : failed ? (
                            <XCircle className="h-5 w-5" />
                          ) : (
                            <ArrowDownToLine className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">
                              {payout.reference ||
                                "Rider payout"}
                            </p>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPayoutStatusClasses(
                                payout.status
                              )}`}
                            >
                              {getPayoutStatusLabel(
                                payout.status
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatDateTime(
                              payout.created_at
                            )}
                          </p>

                          {payout.provider_reference && (
                            <p className="mt-1 text-xs text-slate-400">
                              Transfer reference:{" "}
                              {payout.provider_reference}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {formatNaira(
                            Number(payout.amount || 0)
                          )}
                        </p>

                        <p className="text-xs text-slate-500">
                          Direct bank payout
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Destination
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {payout.account_name ||
                            "Verified bank account"}
                        </p>

                        {payout.account_number_last4 && (
                          <p className="mt-1 text-xs text-slate-500">
                            Account ending{" "}
                            {payout.account_number_last4}
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Payout status
                        </p>

                        {successful && payout.completed_at ? (
                          <p className="mt-1 text-sm font-semibold text-emerald-700">
                            Completed{" "}
                            {formatDateTime(
                              payout.completed_at
                            )}
                          </p>
                        ) : pending ? (
                          <p className="mt-1 text-sm font-semibold text-amber-700">
                            Transfer is being processed
                          </p>
                        ) : failed ? (
                          <p className="mt-1 text-sm font-semibold text-red-700">
                            Transfer requires review or retry
                          </p>
                        ) : (
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {getPayoutStatusLabel(
                              payout.status
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {failed && payout.failure_reason && (
                      <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">
                        <p className="text-xs font-semibold text-red-800">
                          Payout issue
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-700">
                          The payout could not be completed. IyanjuWorld can
                          retry the transfer after resolving the issue.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />

            <div>
              <p className="text-sm font-bold text-slate-900">
                No rider wallet
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Rider earnings are not stored as a customer-style wallet
                balance. Each completed delivery creates a rider earning and
                the payout system transfers eligible funds directly to the
                rider's verified bank account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
