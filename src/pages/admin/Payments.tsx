import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Eye,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import PageContainer from "../../components/layout/PageContainer";
import AdminFilters from "../../components/admin/AdminFilters";
import AdminTable, {
  type AdminTableColumn,
  type AdminTableRowAction,
} from "../../components/admin/AdminTable";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { formatDateTime, formatPaymentReference } from "../../libs/format";

type PaymentProvider = "flutterwave";

type PaymentMethod =
  | "card"
  | "bank_transfer"
  | "bank_account"
  | "ussd"
  | "opay"
  | "nqr"
  | "enaira"
  | "internet_banking"
  | "other";

type PaymentStatus =
  | "created"
  | "pending"
  | "processing"
  | "successful"
  | "failed"
  | "cancelled"
  | "expired"
  | "refunded"
  | "partially_refunded";

type Payment = {
  id: string;
  paymentReference: string;
  orderReference?: string;
  customerName: string;
  customerPhone: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: "NGN";
  providerTransactionId?: string;
  providerStatus?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
};

const demoPayments: Payment[] = [
  {
    id: "payment-001",
    paymentReference: "PAY-FLW-AX1024",
    orderReference: "ORDER-AX1024",
    customerName: "Customer One",
    customerPhone: "+234 800 000 0001",
    provider: "flutterwave",
    method: "card",
    status: "successful",
    amount: 47500,
    currency: "NGN",
    providerTransactionId: "FLW-TX-100001",
    providerStatus: "successful",
    verified: true,
    createdAt: "2026-09-12T08:22:00.000Z",
    updatedAt: "2026-09-12T08:23:00.000Z",
  },
  {
    id: "payment-002",
    paymentReference: "PAY-FLW-BX2048",
    orderReference: "ORDER-BX2048",
    customerName: "Customer Two",
    customerPhone: "+234 800 000 0002",
    provider: "flutterwave",
    method: "bank_transfer",
    status: "successful",
    amount: 20300,
    currency: "NGN",
    providerTransactionId: "FLW-TX-100002",
    providerStatus: "successful",
    verified: true,
    createdAt: "2026-09-12T09:16:00.000Z",
    updatedAt: "2026-09-12T09:18:00.000Z",
  },
  {
    id: "payment-003",
    paymentReference: "PAY-FLW-CX4096",
    orderReference: "ORDER-CX4096",
    customerName: "Customer Three",
    customerPhone: "+234 800 000 0003",
    provider: "flutterwave",
    method: "opay",
    status: "processing",
    amount: 75000,
    currency: "NGN",
    providerTransactionId: "FLW-TX-100003",
    providerStatus: "processing",
    verified: false,
    createdAt: "2026-09-12T10:05:00.000Z",
    updatedAt: "2026-09-12T10:06:00.000Z",
  },
  {
    id: "payment-004",
    paymentReference: "PAY-FLW-DX8192",
    orderReference: "ORDER-DX8192",
    customerName: "Customer Four",
    customerPhone: "+234 800 000 0004",
    provider: "flutterwave",
    method: "ussd",
    status: "failed",
    amount: 13500,
    currency: "NGN",
    providerTransactionId: "FLW-TX-100004",
    providerStatus: "failed",
    verified: false,
    createdAt: "2026-09-12T10:10:00.000Z",
    updatedAt: "2026-09-12T10:11:00.000Z",
  },
];

const statusOptions = [
  { value: "", label: "All payment statuses" },
  { value: "created", label: "Created" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "successful", label: "Successful" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
  { value: "refunded", label: "Refunded" },
  { value: "partially_refunded", label: "Partially refunded" },
];

const methodOptions = [
  { value: "", label: "All methods" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "bank_account", label: "Bank account" },
  { value: "ussd", label: "USSD" },
  { value: "opay", label: "OPay" },
  { value: "nqr", label: "NQR" },
  { value: "enaira", label: "eNaira" },
  { value: "internet_banking", label: "Internet banking" },
  { value: "other", label: "Other" },
];

function getStatusVariant(
  status: PaymentStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "successful":
      return "success";

    case "pending":
    case "processing":
    case "partially_refunded":
      return "warning";

    case "failed":
    case "cancelled":
    case "expired":
    case "refunded":
      return "danger";

    default:
      return "default";
  }
}

function getStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "created":
      return "Created";
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "successful":
      return "Successful";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    case "refunded":
      return "Refunded";
    case "partially_refunded":
      return "Partially refunded";
    default:
      return status;
  }
}

function getMethodLabel(method: PaymentMethod) {
  switch (method) {
    case "card":
      return "Card";
    case "bank_transfer":
      return "Bank transfer";
    case "bank_account":
      return "Bank account";
    case "ussd":
      return "USSD";
    case "opay":
      return "OPay";
    case "nqr":
      return "NQR";
    case "enaira":
      return "eNaira";
    case "internet_banking":
      return "Internet banking";
    case "other":
      return "Other";
    default:
      return method;
  }
}

function formatAmount(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function Payments() {
  const [payments, setPayments] =
    useState<Payment[]>(demoPayments);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        payment.paymentReference
          .toLowerCase()
          .includes(query) ||
        payment.orderReference
          ?.toLowerCase()
          .includes(query) ||
        payment.customerName
          .toLowerCase()
          .includes(query) ||
        payment.customerPhone
          .toLowerCase()
          .includes(query) ||
        payment.providerTransactionId
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        !status || payment.status === status;

      const matchesMethod =
        !method || payment.method === method;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod
      );
    });
  }, [payments, search, status, method]);

  const markVerified = (paymentId: string) => {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === paymentId
          ? {
              ...payment,
              verified: true,
              status:
                payment.status === "processing" ||
                payment.status === "pending"
                  ? "successful"
                  : payment.status,
              providerStatus: "successful",
              updatedAt: new Date().toISOString(),
            }
          : payment,
      ),
    );
  };

  const markFailed = (paymentId: string) => {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === paymentId
          ? {
              ...payment,
              verified: false,
              status: "failed",
              providerStatus: "failed",
              updatedAt: new Date().toISOString(),
            }
          : payment,
      ),
    );
  };

  const columns: AdminTableColumn<Payment>[] = [
    {
      id: "reference",
      header: "Payment",
      accessor: "paymentReference",
      sortable: true,
      render: (_, payment) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <CreditCard className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">
              {formatPaymentReference(
                payment.paymentReference,
              )}
            </div>

            <div className="truncate text-xs text-slate-500">
              {payment.orderReference || "Wallet transaction"}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      accessor: "customerName",
      sortable: true,
      render: (_, payment) => (
        <div>
          <div className="font-medium text-slate-800">
            {payment.customerName}
          </div>

          <div className="text-xs text-slate-500">
            {payment.customerPhone}
          </div>
        </div>
      ),
    },
    {
      id: "method",
      header: "Method",
      accessor: "method",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-slate-700">
          {getMethodLabel(value)}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      accessor: "amount",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="font-semibold text-slate-900">
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
        <Badge variant={getStatusVariant(value)}>
          {getStatusLabel(value)}
        </Badge>
      ),
    },
    {
      id: "verification",
      header: "Verification",
      accessor: "verified",
      render: (value) => (
        <Badge variant={value ? "success" : "warning"}>
          {value ? "Verified" : "Unverified"}
        </Badge>
      ),
    },
    {
      id: "provider",
      header: "Provider",
      accessor: "provider",
      render: (value) => (
        <span className="text-sm capitalize text-slate-700">
          {value}
        </span>
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

  const getRowActions = (
    payment: Payment,
  ): AdminTableRowAction[] => {
    const actions: AdminTableRowAction[] = [
      {
        id: "view",
        label: "View payment",
        icon: Eye,
        onClick: () => {
          window.location.href = `/admin/payments/${payment.id}`;
        },
      },
    ];

    if (
      !payment.verified &&
      ["pending", "processing"].includes(payment.status)
    ) {
      actions.push({
        id: "verify",
        label: "Mark as verified",
        icon: ShieldCheck,
        onClick: () => markVerified(payment.id),
      });
    }

    if (
      ["created", "pending", "processing"].includes(
        payment.status,
      )
    ) {
      actions.push({
        id: "fail",
        label: "Mark as failed",
        icon: XCircle,
        danger: true,
        onClick: () => markFailed(payment.id),
      });
    }

    if (
      payment.status === "successful" &&
      payment.verified
    ) {
      actions.push({
        id: "verified",
        label: "Payment verified",
        icon: CheckCircle2,
        disabled: true,
        onClick: () => undefined,
      });
    }

    return actions;
  };

  const totalVolume = payments.reduce(
    (sum, payment) =>
      payment.status === "successful"
        ? sum + payment.amount
        : sum,
    0,
  );

  const successfulCount = payments.filter(
    (payment) => payment.status === "successful",
  ).length;

  const pendingCount = payments.filter(
    (payment) =>
      payment.status === "pending" ||
      payment.status === "processing",
  ).length;

  const failedCount = payments.filter(
    (payment) =>
      payment.status === "failed" ||
      payment.status === "cancelled" ||
      payment.status === "expired",
  ).length;

  return (
    <PageContainer
      title="Payments"
      description="Monitor payment transactions, verification status, methods, and payment failures."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Payment Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Verify marketplace payments and monitor transaction
              activity.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("");
              setMethod("");
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
              placeholder="Search payment, order, customer or transaction ID..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter payments by status"
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

          <select
            value={method}
            onChange={(event) =>
              setMethod(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter payments by method"
          >
            {methodOptions.map((option) => (
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
              Successful volume
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatAmount(totalVolume)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Successful payments
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {successfulCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Pending / processing
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Failed
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {failedCount}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <ShieldCheck className="h-4 w-4 text-slate-500" />

            <span className="text-slate-600">
              Payments must be verified server-side before an
              order is considered successfully paid.
            </span>
          </div>
        </div>

        <AdminTable
          columns={columns}
          data={filteredPayments}
          rowKey={(payment) => payment.id}
          getRowActions={getRowActions}
          emptyTitle="No payments found"
          emptyDescription="No payment transactions match the current search or filters."
          selectable
          pagination
          pageSize={10}
          stickyHeader
          striped
        />

        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {filteredPayments.length} of{" "}
            {payments.length} payments
          </p>

          <p className="text-xs text-slate-400">
            Provider transaction details are administrative
            records and are not exposed in the customer UI.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
