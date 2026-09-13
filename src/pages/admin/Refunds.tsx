import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  RotateCcw,
  Search,
  Wallet,
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
import { formatDateTime, formatOrderReference } from "../../libs/format";

type RefundStatus =
  | "requested"
  | "approved"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "reversed";

type RefundDestination = "wallet";

type Refund = {
  id: string;
  refundReference: string;
  orderReference: string;
  paymentReference: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentAmount: number;
  previouslyRefundedAmount: number;
  remainingRefundableAmount: number;
  currency: "NGN";
  status: RefundStatus;
  destination: RefundDestination;
  reason: string;
  requestedBy?: string;
  approvedBy?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
};

const demoRefunds: Refund[] = [
  {
    id: "refund-001",
    refundReference: "REFUND-AX1001",
    orderReference: "ORDER-AX1024",
    paymentReference: "PAY-FLW-AX1024",
    customerName: "Customer One",
    customerPhone: "+234 800 000 0001",
    amount: 47500,
    paymentAmount: 47500,
    previouslyRefundedAmount: 0,
    remainingRefundableAmount: 47500,
    currency: "NGN",
    status: "requested",
    destination: "wallet",
    reason: "Customer cancelled before fulfillment.",
    requestedBy: "Customer One",
    createdAt: "2026-09-12T08:45:00.000Z",
    updatedAt: "2026-09-12T08:45:00.000Z",
  },
  {
    id: "refund-002",
    refundReference: "REFUND-BX2002",
    orderReference: "ORDER-BX2048",
    paymentReference: "PAY-FLW-BX2048",
    customerName: "Customer Two",
    customerPhone: "+234 800 000 0002",
    amount: 12000,
    paymentAmount: 20300,
    previouslyRefundedAmount: 0,
    remainingRefundableAmount: 20300,
    currency: "NGN",
    status: "approved",
    destination: "wallet",
    reason: "Business could not fulfill part of the order.",
    requestedBy: "Admin",
    approvedBy: "Operations Admin",
    createdAt: "2026-09-12T09:30:00.000Z",
    updatedAt: "2026-09-12T09:45:00.000Z",
  },
  {
    id: "refund-003",
    refundReference: "REFUND-CX3003",
    orderReference: "ORDER-CX4096",
    paymentReference: "PAY-FLW-CX4096",
    customerName: "Customer Three",
    customerPhone: "+234 800 000 0003",
    amount: 75000,
    paymentAmount: 75000,
    previouslyRefundedAmount: 0,
    remainingRefundableAmount: 75000,
    currency: "NGN",
    status: "processing",
    destination: "wallet",
    reason: "Order cancelled after payment.",
    requestedBy: "Support Admin",
    approvedBy: "Finance Admin",
    processedBy: "Finance Admin",
    createdAt: "2026-09-12T10:15:00.000Z",
    updatedAt: "2026-09-12T10:20:00.000Z",
  },
  {
    id: "refund-004",
    refundReference: "REFUND-DX4004",
    orderReference: "ORDER-DX8192",
    paymentReference: "PAY-FLW-DX8192",
    customerName: "Customer Four",
    customerPhone: "+234 800 000 0004",
    amount: 13500,
    paymentAmount: 13500,
    previouslyRefundedAmount: 0,
    remainingRefundableAmount: 13500,
    currency: "NGN",
    status: "completed",
    destination: "wallet",
    reason: "Payment reversal after failed fulfillment.",
    requestedBy: "Support Admin",
    approvedBy: "Finance Admin",
    processedBy: "Finance Admin",
    createdAt: "2026-09-11T13:15:00.000Z",
    updatedAt: "2026-09-11T13:25:00.000Z",
  },
];

const statusOptions = [
  { value: "", label: "All refund statuses" },
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "reversed", label: "Reversed" },
];

function getStatusVariant(
  status: RefundStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "completed":
      return "success";

    case "requested":
    case "approved":
    case "processing":
      return "warning";

    case "failed":
    case "cancelled":
    case "reversed":
      return "danger";

    default:
      return "default";
  }
}

function getStatusLabel(status: RefundStatus) {
  switch (status) {
    case "requested":
      return "Requested";
    case "approved":
      return "Approved";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    case "reversed":
      return "Reversed";
    default:
      return status;
  }
}

function formatAmount(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function Refunds() {
  const [refunds, setRefunds] = useState<Refund[]>(demoRefunds);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filteredRefunds = useMemo(() => {
    const query = search.trim().toLowerCase();

    return refunds.filter((refund) => {
      const matchesSearch =
        !query ||
        refund.refundReference
          .toLowerCase()
          .includes(query) ||
        refund.orderReference
          .toLowerCase()
          .includes(query) ||
        refund.paymentReference
          .toLowerCase()
          .includes(query) ||
        refund.customerName
          .toLowerCase()
          .includes(query) ||
        refund.customerPhone
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        !status || refund.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [refunds, search, status]);

  const approveRefund = (refundId: string) => {
    setRefunds((current) =>
      current.map((refund) =>
        refund.id === refundId
          ? {
              ...refund,
              status: "approved",
              approvedBy: "Current Admin",
              updatedAt: new Date().toISOString(),
            }
          : refund,
      ),
    );
  };

  const processRefund = (refundId: string) => {
    setRefunds((current) =>
      current.map((refund) =>
        refund.id === refundId
          ? {
              ...refund,
              status: "completed",
              processedBy: "Current Admin",
              updatedAt: new Date().toISOString(),
            }
          : refund,
      ),
    );
  };

  const cancelRefund = (refundId: string) => {
    setRefunds((current) =>
      current.map((refund) =>
        refund.id === refundId
          ? {
              ...refund,
              status: "cancelled",
              updatedAt: new Date().toISOString(),
            }
          : refund,
      ),
    );
  };

  const columns: AdminTableColumn<Refund>[] = [
    {
      id: "reference",
      header: "Refund",
      accessor: "refundReference",
      sortable: true,
      render: (_, refund) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <RotateCcw className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">
              {refund.refundReference}
            </div>

            <div className="truncate text-xs text-slate-500">
              {formatOrderReference(refund.orderReference)}
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
      render: (_, refund) => (
        <div>
          <div className="font-medium text-slate-800">
            {refund.customerName}
          </div>

          <div className="text-xs text-slate-500">
            {refund.customerPhone}
          </div>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Refund amount",
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
      id: "remaining",
      header: "Remaining refundable",
      accessor: "remainingRefundableAmount",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="text-sm text-slate-700">
          {formatAmount(value)}
        </span>
      ),
    },
    {
      id: "destination",
      header: "Destination",
      accessor: "destination",
      render: () => (
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Wallet className="h-4 w-4 text-slate-500" />
          <span>Wallet</span>
        </div>
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
    refund: Refund,
  ): AdminTableRowAction[] => {
    const actions: AdminTableRowAction[] = [
      {
        id: "view",
        label: "View refund",
        icon: Eye,
        onClick: () => {
          window.location.href = `/admin/refunds/${refund.id}`;
        },
      },
    ];

    if (refund.status === "requested") {
      actions.push({
        id: "approve",
        label: "Approve refund",
        icon: CheckCircle2,
        onClick: () => approveRefund(refund.id),
      });

      actions.push({
        id: "cancel",
        label: "Cancel refund",
        icon: XCircle,
        danger: true,
        onClick: () => cancelRefund(refund.id),
      });
    }

    if (refund.status === "approved") {
      actions.push({
        id: "process",
        label: "Process wallet refund",
        icon: Wallet,
        onClick: () => processRefund(refund.id),
      });

      actions.push({
        id: "cancel",
        label: "Cancel refund",
        icon: XCircle,
        danger: true,
        onClick: () => cancelRefund(refund.id),
      });
    }

    if (refund.status === "processing") {
      actions.push({
        id: "complete",
        label: "Complete wallet refund",
        icon: CheckCircle2,
        onClick: () => processRefund(refund.id),
      });
    }

    if (refund.status === "completed") {
      actions.push({
        id: "completed",
        label: "Refund completed",
        icon: CheckCircle2,
        disabled: true,
        onClick: () => undefined,
      });
    }

    return actions;
  };

  const totalRequested = refunds
    .filter((refund) => refund.status === "requested")
    .reduce((sum, refund) => sum + refund.amount, 0);

  const totalProcessing = refunds
    .filter(
      (refund) =>
        refund.status === "approved" ||
        refund.status === "processing",
    )
    .reduce((sum, refund) => sum + refund.amount, 0);

  const totalCompleted = refunds
    .filter((refund) => refund.status === "completed")
    .reduce((sum, refund) => sum + refund.amount, 0);

  const completedCount = refunds.filter(
    (refund) => refund.status === "completed",
  ).length;

  return (
    <PageContainer
      title="Refunds"
      description="Manage customer refund requests and wallet-based refund processing."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Refund Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review, approve, and process customer refunds.
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
              placeholder="Search refund, order, payment or customer..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter refunds by status"
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
              Requested
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatAmount(totalRequested)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Approved / processing
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatAmount(totalProcessing)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Completed refunds
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatAmount(totalCompleted)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Completed count
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {completedCount}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

            <div>
              <p className="font-medium text-amber-900">
                Wallet-only refund architecture
              </p>

              <p className="mt-1 text-sm text-amber-800">
                Approved refunds are credited to the customer&apos;s
                IyanjuWorld wallet. This administrative workflow
                does not initiate direct Flutterwave refunds.
              </p>
            </div>
          </div>
        </div>

        <AdminTable
          columns={columns}
          data={filteredRefunds}
          rowKey={(refund) => refund.id}
          getRowActions={getRowActions}
          emptyTitle="No refunds found"
          emptyDescription="No refund records match the current search or filters."
          selectable
          pagination
          pageSize={10}
          stickyHeader
          striped
        />

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-500">
            Showing {filteredRefunds.length} of{" "}
            {refunds.length} refunds
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
