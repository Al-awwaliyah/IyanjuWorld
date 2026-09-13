import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  Plus,
  RefreshCw,
  WalletCards,
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import { getAuthState } from "../../libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import {
  formatDateTime,
  formatNaira,
} from "../../libs/format";
import { supabase } from "../../libs/supabase";

type TransactionType =
  | "deposit"
  | "payment"
  | "refund"
  | "withdrawal"
  | "credit"
  | "debit"
  | string;

type TransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "successful"
  | "failed"
  | "cancelled"
  | "refunded"
  | string;

interface Wallet {
  id: string;
  available_balance: number;
  pending_balance: number;
}

interface WalletTransaction {
  id: string;
  reference: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  description: string | null;
  created_at: string;
}

const transactionTypeLabel: Record<string, string> = {
  deposit: "Wallet funding",
  payment: "Marketplace payment",
  refund: "Refund",
  withdrawal: "Withdrawal",
  credit: "Credit",
  debit: "Debit",
};

function getTransactionLabel(type: string) {
  return (
    transactionTypeLabel[type.toLowerCase()] ||
    type.replace(/_/g, " ").replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    )
  );
}

function isCreditTransaction(type: string) {
  return ["deposit", "refund", "credit"].includes(
    type.toLowerCase()
  );
}

function getStatusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
    case "successful":
      return "bg-emerald-50 text-emerald-700";

    case "pending":
    case "processing":
      return "bg-amber-50 text-amber-700";

    case "failed":
    case "cancelled":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function Wallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<
    WalletTransaction[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadWallet = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const authState = await getAuthState();

      if (!authState.user) {
        setError("Please sign in to access your wallet.");
        return;
      }

      const customerId = authState.user.id;

      const [
        walletResult,
        transactionResult,
      ] = await Promise.all([
        supabase
          .from("customer_wallets")
          .select("id, available_balance, pending_balance")
          .eq("customer_id", customerId)
          .maybeSingle(),

        supabase
          .from("wallet_transactions")
          .select(
            "id, reference, type, status, amount, description, created_at"
          )
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (walletResult.error) {
        throw walletResult.error;
      }

      if (transactionResult.error) {
        throw transactionResult.error;
      }

      setWallet(
        walletResult.data
          ? {
              id: walletResult.data.id,
              available_balance:
                Number(walletResult.data.available_balance) || 0,
              pending_balance:
                Number(walletResult.data.pending_balance) || 0,
            }
          : null
      );

      setTransactions(
        (transactionResult.data ?? []).map((item) => ({
          id: item.id,
          reference: item.reference ?? null,
          type: item.type ?? "transaction",
          status: item.status ?? "pending",
          amount: Number(item.amount) || 0,
          description: item.description ?? null,
          created_at: item.created_at,
        }))
      );
    } catch (err) {
      logAppError(err, {
        action: "customer.wallet.load",
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const totalBalance = useMemo(
    () =>
      (wallet?.available_balance ?? 0) +
      (wallet?.pending_balance ?? 0),
    [wallet]
  );

  const recentTransactions = useMemo(
    () => transactions.slice(0, 10),
    [transactions]
  );

  const completedCredits = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            isCreditTransaction(transaction.type) &&
            ["completed", "successful"].includes(
              transaction.status.toLowerCase()
            )
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions]
  );

  const completedDebits = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            !isCreditTransaction(transaction.type) &&
            ["completed", "successful"].includes(
              transaction.status.toLowerCase()
            )
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions]
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  if (error && !wallet) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <WalletCards className="h-6 w-6 text-red-600" />
          </div>

          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Wallet unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error}
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadWallet(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Try again
            </Button>

            <Button asChild>
              <Link to="/customer/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Customer wallet
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Wallet
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your marketplace funds and view your wallet activity.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void loadWallet(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {error && wallet && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <WalletCards className="h-4 w-4" />
              Available balance
            </div>

            <div className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {formatNaira(wallet?.available_balance ?? 0)}
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
              <Clock3 className="h-4 w-4" />
              Pending
              <span className="font-medium text-white">
                {formatNaira(wallet?.pending_balance ?? 0)}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 p-4 sm:min-w-48">
            <p className="text-xs text-slate-300">
              Total wallet funds
            </p>
            <p className="mt-1 text-xl font-semibold">
              {formatNaira(totalBalance)}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            asChild
            className="w-full bg-white text-slate-900 hover:bg-slate-100"
          >
            <Link to="/customer/wallet/add-money">
              <Plus className="mr-2 h-4 w-4" />
              Add money
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/customer/wallet/withdraw">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Withdraw
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Recent credits
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {formatNaira(completedCredits)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <ArrowUpRight className="h-5 w-5 text-red-600" />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Recent debits
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {formatNaira(completedDebits)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Recent transactions
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Your latest wallet activity
            </p>
          </div>

          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" />
            <span className="hidden text-xs text-slate-500 sm:inline">
              {transactions.length} records
            </span>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <WalletCards className="h-6 w-6 text-slate-400" />
            </div>

            <h3 className="mt-4 font-medium text-slate-900">
              No wallet transactions yet
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your wallet activity will appear here once you fund or
              use your wallet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((transaction) => {
              const credit = isCreditTransaction(
                transaction.type
              );

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        credit
                          ? "bg-emerald-50"
                          : "bg-red-50"
                      }`}
                    >
                      {credit ? (
                        <ArrowDownLeft
                          className={`h-5 w-5 ${
                            credit
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {getTransactionLabel(transaction.type)}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {transaction.description ||
                          transaction.reference ||
                          formatDateTime(transaction.created_at)}
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusClass(
                            transaction.status
                          )}`}
                        >
                          {getStatusLabel(transaction.status)}
                        </span>

                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(transaction.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold ${
                        credit
                          ? "text-emerald-600"
                          : "text-slate-900"
                      }`}
                    >
                      {credit ? "+" : "-"}
                      {formatNaira(transaction.amount)}
                    </p>

                    {transaction.reference && (
                      <p className="mt-1 max-w-28 truncate text-[10px] text-slate-400 sm:max-w-40">
                        {transaction.reference}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {transactions.length > 10 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <Link
              to="/customer/wallet/transactions"
              className="flex items-center justify-between text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              View all transactions
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
