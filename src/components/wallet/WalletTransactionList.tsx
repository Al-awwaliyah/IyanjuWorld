import { Receipt, RefreshCw } from "lucide-react";
import WalletTransaction, {
  type WalletTransactionProps,
} from "./WalletTransaction";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import Button from "../ui/Button";

export interface WalletTransactionListProps {
  transactions: WalletTransactionProps[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export default function WalletTransactionList({
  transactions,
  loading = false,
  refreshing = false,
  onRefresh,
  emptyTitle = "No transactions yet",
  emptyDescription = "Your wallet transactions will appear here.",
  className = "",
}: WalletTransactionListProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Wallet Transactions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View deposits, payments, refunds and withdrawals.
          </p>
        </div>

        {onRefresh && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={refreshing}
            disabled={loading || refreshing}
            onClick={onRefresh}
          >
            <RefreshCw
              className="h-4 w-4"
              aria-hidden="true"
            />
            Refresh
          </Button>
        )}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Spinner
              size="lg"
              label="Loading wallet transactions"
            />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div>
            {transactions.map(
              (transaction) => (
                <WalletTransaction
                  key={transaction.id}
                  {...transaction}
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}
