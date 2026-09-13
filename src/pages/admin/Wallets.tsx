import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Search,
  Wallet,
} from "lucide-react";

import PageContainer from "../../components/layout/PageContainer";
import AdminFilters from "../../components/admin/AdminFilters";
import AdminTable, {
  type AdminTableColumn,
  type AdminTableRowAction,
} from "../../components/admin/AdminTable";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { formatDateTime } from "../../libs/format";

type WalletStatus = "active" | "inactive";

type WalletTransactionType =
  | "deposit"
  | "order_payment"
  | "refund"
  | "withdrawal"
  | "withdrawal_reversal"
  | "adjustment"
  | "promotion"
  | "referral"
  | "reversal";

type WalletTransactionStatus =
  | "pending"
  | "available"
  | "completed"
  | "withdrawal_pending"
  | "withdrawn"
  | "reversed"
  | "failed";

type CustomerWallet = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  availableBalance: number;
  pendingBalance: number;
  currency: "NGN";
  status: WalletStatus;
  transactionCount: number;
  lastTransactionAt?: string;
  createdAt: string;
};

type WalletTransaction = {
  id: string;
  reference: string;
  walletId: string;
  customerName: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: "NGN";
  createdAt: string;
};

const demoWallets: CustomerWallet[] = [
  {
    id: "wallet-001",
    customerId: "customer-001",
    customerName: "Customer One",
    customerPhone: "+234 800 000 0001",
    availableBalance: 125000,
    pendingBalance: 0,
    currency: "NGN",
    status: "active",
    transactionCount: 18,
    lastTransactionAt: "2026-09-12T08:25:00.000Z",
    createdAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "wallet-002",
    customerId: "customer-002",
    customerName: "Customer Two",
    customerPhone: "+234 800 000 0002",
    availableBalance: 48500,
    pendingBalance: 12000,
    currency: "NGN",
    status: "active",
    transactionCount: 9,
    lastTransactionAt: "2026-09-12T09:50:00.000Z",
    createdAt: "2026-08-28T12:30:00.000Z",
  },
  {
    id: "wallet-003",
    customerId: "customer-003",
    customerName: "Customer Three",
    customerPhone: "+234 800 000 0003",
    availableBalance: 0,
    pendingBalance: 75000,
    currency: "NGN",
    status: "active",
    transactionCount: 5,
    lastTransactionAt: "2026-09-12T10:22:00.000Z",
    createdAt: "2026-09-02T14:15:00.000Z",
  },
  {
    id: "wallet-004",
    customerId: "customer-004",
    customerName: "Customer Four",
    customerPhone: "+234 800 000 0004",
    availableBalance: 9500,
    pendingBalance: 0,
    currency: "NGN",
    status: "inactive",
    transactionCount: 3,
    lastTransactionAt: "2026-09-10T16:40:00.000Z",
    createdAt: "2026-08-15T09:20:00.000Z",
  },
];

const demoTransactions: WalletTransaction[] = [
  {
    id: "wallet-tx-001",
    reference: "WALLET-DEPOSIT-AX1001",
    walletId: "wallet-001",
    customerName: "Customer One",
    type: "deposit",
    status: "completed",
    amount: 100000,
    balanceBefore: 25000,
    balanceAfter: 125000,
    currency: "NGN",
    createdAt: "2026-09-12T08:25:00.000Z",
  },
  {
    id: "wallet-tx-002",
    reference: "WALLET-PAYMENT-BX2002",
    walletId: "wallet-002",
    customerName: "Customer Two",
    type: "order_payment",
    status: "completed",
    amount: 20300,
    balanceBefore: 68800,
    balanceAfter: 48500,
    currency: "NGN",
    createdAt: "2026-09-12T09:50:00.000Z",
  },
  {
    id: "wallet-tx-003",
    reference: "WALLET-REFUND-CX3003",
    walletId: "wallet-003",
    customerName: "Customer Three",
    type: "refund",
    status: "completed",
    amount: 75000,
    balanceBefore: 0,
    balanceAfter: 75000,
    currency: "NGN",
    createdAt: "2026-09-12T10:22:00.000Z",
  },
  {
    id: "wallet-tx-004",
    reference: "WALLET-WITHDRAWAL-DX4004",
    walletId: "wallet-004",
    customerName: "Customer Four",
    type: "withdrawal",
    status: "withdrawal_pending",
    amount: 5000,
    balanceBefore: 14500,
    balanceAfter: 9500,
    currency: "NGN",
    createdAt: "2026-09-10T16:40:00.000Z",
  },
];

const statusOptions = [
  { value: "", label: "All wallet statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function formatAmount(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function getTransactionTypeLabel(
  type: WalletTransactionType,
) {
  switch (type) {
    case "deposit":
      return "Deposit";
    case "order_payment":
      return "Order payment";
    case "refund":
      return "Refund";
    case "withdrawal":
      return "Withdrawal";
    case "withdrawal_reversal":
      return "Withdrawal reversal";
    case "adjustment":
      return "Adjustment";
    case "promotion":
      return "Promotion";
    case "referral":
      return "Referral";
    case "reversal":
      return "Reversal";
    default:
      return type;
  }
}

function getTransactionStatusVariant(
  status: WalletTransactionStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "completed":
    case "available":
    case "withdrawn":
      return "success";

    case "pending":
    case "withdrawal_pending":
      return "warning";

    case "failed":
    case "reversed":
      return "danger";

    default:
      return "default";
  }
}

function getTransactionStatusLabel(
  status: WalletTransactionStatus,
) {
  switch (status) {
    case "pending":
      return "Pending";
    case "available":
      return "Available";
    case "completed":
      return "Completed";
    case "withdrawal_pending":
      return "Withdrawal pending";
    case "withdrawn":
      return "Withdrawn";
    case "reversed":
      return "Reversed";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function isCreditType(type: WalletTransactionType) {
  return [
    "deposit",
    "refund",
    "withdrawal_reversal",
    "promotion",
    "referral",
    "reversal",
  ].includes(type);
}

export default function Wallets() {
  const [wallets] =
    useState<CustomerWallet[]>(demoWallets);

  const [transactions] =
    useState<WalletTransaction[]>(demoTransactions);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filteredWallets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return wallets.filter((wallet) => {
      const matchesSearch =
        !query ||
        wallet.customerName
          .toLowerCase()
          .includes(query) ||
        wallet.customerPhone
          .toLowerCase()
          .includes(query) ||
        wallet.customerId
          .toLowerCase()
          .includes(query) ||
        wallet.id.toLowerCase().includes(query);

      const matchesStatus =
        !status || wallet.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [wallets, search, status]);

  const walletColumns: AdminTableColumn<CustomerWallet>[] = [
    {
      id: "customer",
      header: "Customer",
      accessor: "customerName",
      sortable: true,
      render: (_, wallet) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Wallet className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">
              {wallet.customerName}
            </div>

            <div className="truncate text-xs text-slate-500">
              {wallet.customerPhone}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "available",
      header: "Available balance",
      accessor: "availableBalance",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="font-semibold text-slate-900">
          {formatAmount(value)}
        </span>
      ),
    },
    {
      id: "pending",
      header: "Pending balance",
      accessor: "pendingBalance",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="text-sm text-slate-700">
          {formatAmount(value)}
        </span>
      ),
    },
    {
      id: "total",
      header: "Wallet total",
      render: (_, wallet) => (
        <span className="font-medium text-slate-800">
          {formatAmount(
            wallet.availableBalance +
              wallet.pendingBalance,
          )}
        </span>
      ),
    },
    {
      id: "transactions",
      header: "Transactions",
      accessor: "transactionCount",
      sortable: true,
      align: "center",
      render: (value) => (
        <span className="text-sm text-slate-700">
          {value}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (value) => (
        <Badge
          variant={
            value === "active" ? "success" : "default"
          }
        >
          {value === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "lastActivity",
      header: "Last activity",
      accessor: "lastTransactionAt",
      sortable: true,
      render: (value) =>
        value ? (
          <span className="whitespace-nowrap text-sm text-slate-600">
            {formatDateTime(value)}
          </span>
        ) : (
          <span className="text-sm text-slate-400">
            No activity
          </span>
        ),
    },
  ];

  const getWalletActions = (
    wallet: CustomerWallet,
  ): AdminTableRowAction[] => [
    {
      id: "view",
      label: "View wallet",
      icon: Eye,
      onClick: () => {
        window.location.href = `/admin/wallets/${wallet.id}`;
      },
    },
  ];

  const totalAvailable = wallets.reduce(
    (sum, wallet) => sum + wallet.availableBalance,
    0,
  );

  const totalPending = wallets.reduce(
    (sum, wallet) => sum + wallet.pendingBalance,
    0,
  );

  const activeWalletCount = wallets.filter(
    (wallet) => wallet.status === "active",
  ).length;

  const totalTransactionVolume = transactions.reduce(
    (sum, transaction) =>
      transaction.status === "completed"
        ? sum + transaction.amount
        : sum,
    0,
  );

  const transactionColumns: AdminTableColumn<WalletTransaction>[] =
    [
      {
        id: "reference",
        header: "Reference",
        accessor: "reference",
        sortable: true,
        render: (value) => (
          <span className="font-medium text-slate-800">
            {value}
          </span>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        accessor: "customerName",
        sortable: true,
        render: (value) => (
          <span className="text-sm text-slate-700">
            {value}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        accessor: "type",
        sortable: true,
        render: (value) => (
          <div className="flex items-center gap-2">
            {isCreditType(value) ? (
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-slate-500" />
            )}

            <span className="text-sm text-slate-700">
              {getTransactionTypeLabel(value)}
            </span>
          </div>
        ),
      },
      {
        id: "amount",
        header: "Amount",
        accessor: "amount",
        sortable: true,
        align: "right",
        render: (value, transaction) => (
          <span
            className={
              isCreditType(transaction.type)
                ? "font-semibold text-emerald-700"
                : "font-semibold text-slate-900"
            }
          >
            {isCreditType(transaction.type) ? "+" : "-"}
            {formatAmount(value)}
          </span>
        ),
      },
      {
        id: "balance",
        header: "Balance after",
        accessor: "balanceAfter",
        sortable: true,
        align: "right",
        render: (value) => (
          <span className="text-sm text-slate-700">
            {formatAmount(value)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessor: "status",
        sortable: true,
        render: (value) => (
          <Badge
            variant={getTransactionStatusVariant(value)}
          >
            {getTransactionStatusLabel(value)}
          </Badge>
        ),
      },
      {
        id: "created",
        header: "Created",
        accessor: "createdAt",
        sortable: true,
        render: (value) => (
          <span className="whitespace-nowrap text-sm text-slate-600">
            {formatDateTime(value)}
          </span>
        ),
      },
    ];

  return (
    <PageContainer
      title="Wallets"
      description="Monitor customer wallet balances, transactions, deposits, refunds, and withdrawals."
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Customer Wallets
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Wallet balances are controlled by server-side
              financial operations and the ledger.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("");
            }}
          >
            Clear filters
          </Button>
        </div>

        <AdminFilters>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search customer, phone or wallet..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter wallets by status"
          >
            {statusOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </AdminFilters>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Available funds
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatAmount(totalAvailable)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Pending funds
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatAmount(totalPending)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Active wallets
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {activeWalletCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Completed transaction volume
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatAmount(totalTransactionVolume)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

            <div>
              <p className="font-medium text-blue-900">
                Ledger-controlled wallet balances
              </p>

              <p className="mt-1 text-sm text-blue-800">
                Administrators can monitor wallet activity here,
                but financial balances are not changed directly
                from the frontend. Deposits, payments, refunds,
                withdrawals, and adjustments must use authorized
                server-side financial operations.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Wallet Accounts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Customer wallet balances and account status.
            </p>
          </div>

          <AdminTable
            columns={walletColumns}
            data={filteredWallets}
            rowKey={(wallet) => wallet.id}
            getRowActions={getWalletActions}
            emptyTitle="No wallets found"
            emptyDescription="No customer wallets match the current search or filters."
            selectable
            pagination
            pageSize={10}
            stickyHeader
            striped
          />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Wallet Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Deposits, order payments, refunds, withdrawals, and
              other wallet ledger activity.
            </p>
          </div>

          <AdminTable
            columns={transactionColumns}
            data={transactions}
            rowKey={(transaction) => transaction.id}
            emptyTitle="No wallet transactions"
            emptyDescription="There are no wallet transactions to display."
            pagination
            pageSize={10}
            stickyHeader
            striped
          />
        </section>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-500">
            Wallet information shown here is administrative
            monitoring data. The financial ledger remains the
            authoritative source for accounting and reconciliation.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
