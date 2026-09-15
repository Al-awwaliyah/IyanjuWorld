import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  EyeOff,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import Button from "../ui/Button";
import { formatNaira } from "../../libs/format";

export interface WalletBalanceProps {
  availableBalance: number;
  pendingBalance?: number;
  currency?: string;
  loading?: boolean;
  onAddMoney?: () => void;
  onWithdraw?: () => void;
  showActions?: boolean;
  className?: string;
}

export default function WalletBalance({
  availableBalance,
  pendingBalance = 0,
  currency = "NGN",
  loading = false,
  onAddMoney,
  onWithdraw,
  showActions = true,
  className = "",
}: WalletBalanceProps) {
  const [hidden, setHidden] = useState(false);

  const formatAmount = (amount: number) => {
    if (currency === "NGN") {
      return formatNaira(amount);
    }

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const displayedBalance = hidden
    ? "••••••"
    : formatAmount(availableBalance);

  const displayedPending = hidden
    ? "••••••"
    : formatAmount(pendingBalance);

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl bg-ink-900 p-5 text-white shadow-sm sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Wallet
              className="h-5 w-5 text-white"
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-300">
              Available Balance
            </p>

            <div className="mt-1 flex items-center gap-2">
              <p className="text-2xl font-bold tracking-tight sm:text-3xl">
                {loading
                  ? "Loading..."
                  : displayedBalance}
              </p>

              {!loading && (
                <button
                  type="button"
                  onClick={() =>
                    setHidden((current) => !current)
                  }
                  className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={
                    hidden
                      ? "Show wallet balance"
                      : "Hide wallet balance"
                  }
                >
                  {hidden ? (
                    <Eye
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  ) : (
                    <EyeOff
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-white/5 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400">
            Pending Balance
          </span>

          <span className="text-sm font-semibold text-slate-200">
            {loading
              ? "Loading..."
              : displayedPending}
          </span>
        </div>
      </div>

      {showActions &&
        (onAddMoney || onWithdraw) && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {onAddMoney && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                loading={loading}
                disabled={loading}
                onClick={onAddMoney}
              >
                <ArrowDownToLine
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Add Money
              </Button>
            )}

            {onWithdraw && (
              <Button
                type="button"
                variant="outline"
                size="md"
                loading={loading}
                disabled={loading}
                onClick={onWithdraw}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <ArrowUpFromLine
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Withdraw
              </Button>
            )}
          </div>
        )}
    </section>
  );
}
