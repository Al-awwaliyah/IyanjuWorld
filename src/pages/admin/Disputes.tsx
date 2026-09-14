import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  MessageSquare,
  Search,
  ShieldAlert,
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
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Textarea from "../../components/ui/Textarea";

type DisputeStatus =
  | "open"
  | "under_review"
  | "awaiting_response"
  | "resolved"
  | "rejected"
  | "cancelled";

type DisputePriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

type DisputeReason =
  | "item_not_received"
  | "wrong_item"
  | "damaged_item"
  | "item_not_as_described"
  | "delivery_issue"
  | "payment_issue"
  | "other";

type Dispute = {
  id: string;
  reference: string;
  orderReference: string;
  customerName: string;
  businessName: string;
  riderName: string | null;
  reason: DisputeReason;
  status: DisputeStatus;
  priority: DisputePriority;
  amount: number;
  description: string;
  customerResponse: string | null;
  businessResponse: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

const initialDisputes: Dispute[] = [
  {
    id: "dispute-001",
    reference: "DSP-202609-001",
    orderReference: "ORD-AX1024",
    customerName: "Amina Yusuf",
    businessName: "Amina Fashion Hub",
    riderName: "Sodiq Bello",
    reason: "item_not_as_described",
    status: "under_review",
    priority: "high",
    amount: 28500,
    description:
      "Customer reported that the received product differs materially from the product description and photos.",
    customerResponse:
      "The colour and material are different from what was shown on the product page.",
    businessResponse:
      "The product was packed from the listed stock. We are reviewing the customer's claim.",
    adminNote: null,
    createdAt: "2026-09-10T09:30:00.000Z",
    updatedAt: "2026-09-11T13:20:00.000Z",
  },
  {
    id: "dispute-002",
    reference: "DSP-202609-002",
    orderReference: "ORD-BX2048",
    customerName: "David Adeyemi",
    businessName: "Fresh Basket Market",
    riderName: "Ibrahim Musa",
    reason: "item_not_received",
    status: "open",
    priority: "urgent",
    amount: 18000,
    description:
      "Customer says the order was marked delivered but was not received.",
    customerResponse:
      "I did not receive the package and no one at my address accepted it.",
    businessResponse: null,
    adminNote: null,
    createdAt: "2026-09-11T08:15:00.000Z",
    updatedAt: "2026-09-11T08:15:00.000Z",
  },
  {
    id: "dispute-003",
    reference: "DSP-202609-003",
    orderReference: "ORD-CX3091",
    customerName: "Kemi Balogun",
    businessName: "Urban Tech Store",
    riderName: "Mubarak Ali",
    reason: "damaged_item",
    status: "awaiting_response",
    priority: "normal",
    amount: 65000,
    description:
      "Customer reported that the device arrived damaged and requested resolution.",
    customerResponse:
      "The package arrived with visible damage and the device does not power on.",
    businessResponse:
      "We have requested photographs of the package and device before deciding on the next step.",
    adminNote: "Waiting for supporting evidence.",
    createdAt: "2026-09-08T15:40:00.000Z",
    updatedAt: "2026-09-10T16:05:00.000Z",
  },
  {
    id: "dispute-004",
    reference: "DSP-202609-004",
    orderReference: "ORD-DX4120",
    customerName: "Tunde Ajayi",
    businessName: "Home Essentials NG",
    riderName: "Yusuf Abdullahi",
    reason: "wrong_item",
    status: "resolved",
    priority: "normal",
    amount: 12500,
    description:
      "Customer received a different item from the one ordered.",
    customerResponse:
      "The wrong size was delivered.",
    businessResponse:
      "We confirmed the packing error and agreed to replace the item.",
    adminNote:
      "Business replacement confirmed. No additional customer charge.",
    createdAt: "2026-09-04T11:10:00.000Z",
    updatedAt: "2026-09-06T12:30:00.000Z",
  },
  {
    id: "dispute-005",
    reference: "DSP-202609-005",
    orderReference: "ORD-EX5098",
    customerName: "Sarah Okafor",
    businessName: "Glow Beauty Store",
    riderName: null,
    reason: "payment_issue",
    status: "rejected",
    priority: "low",
    amount: 9000,
    description:
      "Customer reported that an order appeared to have a duplicate payment.",
    customerResponse:
      "I thought I was charged twice for the same order.",
    businessResponse:
      "Only one successful order payment was received.",
    adminNote:
      "Payment records reconciled. No duplicate successful transaction found.",
    createdAt: "2026-09-02T14:20:00.000Z",
    updatedAt: "2026-09-03T10:10:00.000Z",
  },
];

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "under_review", label: "Under review" },
  { value: "awaiting_response", label: "Awaiting response" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const priorityOptions = [
  { value: "", label: "All priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const reasonLabels: Record<DisputeReason, string> = {
  item_not_received: "Item not received",
  wrong_item: "Wrong item",
  damaged_item: "Damaged item",
  item_not_as_described: "Not as described",
  delivery_issue: "Delivery issue",
  payment_issue: "Payment issue",
  other: "Other",
};

const statusLabels: Record<DisputeStatus, string> = {
  open: "Open",
  under_review: "Under review",
  awaiting_response: "Awaiting response",
  resolved: "Resolved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const priorityLabels: Record<DisputePriority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

function formatAmount(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusVariant(status: DisputeStatus) {
  switch (status) {
    case "resolved":
      return "success" as const;
    case "rejected":
    case "cancelled":
      return "default" as const;
    case "under_review":
      return "warning" as const;
    case "awaiting_response":
      return "info" as const;
    default:
      return "danger" as const;
  }
}

function priorityVariant(priority: DisputePriority) {
  switch (priority) {
    case "urgent":
      return "danger" as const;
    case "high":
      return "warning" as const;
    case "low":
      return "default" as const;
    default:
      return "info" as const;
  }
}

export default function Disputes() {
  const [disputes, setDisputes] =
    useState<Dispute[]>(initialDisputes);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const [selectedDispute, setSelectedDispute] =
    useState<Dispute | null>(null);

  const [showDetails, setShowDetails] =
    useState(false);

  const [showResolutionModal, setShowResolutionModal] =
    useState(false);

  const [resolution, setResolution] = useState<
    "resolved" | "rejected"
  >("resolved");

  const [adminNote, setAdminNote] = useState("");

  const filteredDisputes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return disputes.filter((dispute) => {
      const matchesSearch =
        !query ||
        dispute.reference
          .toLowerCase()
          .includes(query) ||
        dispute.orderReference
          .toLowerCase()
          .includes(query) ||
        dispute.customerName
          .toLowerCase()
          .includes(query) ||
        dispute.businessName
          .toLowerCase()
          .includes(query) ||
        reasonLabels[dispute.reason]
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        !status || dispute.status === status;

      const matchesPriority =
        !priority || dispute.priority === priority;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [disputes, search, status, priority]);

  const openDetails = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedDispute(null);
  };

  const openResolution = (
    dispute: Dispute,
    nextResolution: "resolved" | "rejected",
  ) => {
    setSelectedDispute(dispute);
    setResolution(nextResolution);
    setAdminNote(dispute.adminNote || "");
    setShowResolutionModal(true);
  };

  const closeResolution = () => {
    setShowResolutionModal(false);
    setSelectedDispute(null);
    setAdminNote("");
  };

  const saveResolution = () => {
    if (!selectedDispute) {
      return;
    }

    const now = new Date().toISOString();

    setDisputes((current) =>
      current.map((dispute) =>
        dispute.id === selectedDispute.id
          ? {
              ...dispute,
              status: resolution,
              adminNote:
                adminNote.trim() || null,
              updatedAt: now,
            }
          : dispute,
      ),
    );

    closeResolution();
  };

  const moveToReview = (disputeId: string) => {
    setDisputes((current) =>
      current.map((dispute) =>
        dispute.id === disputeId
          ? {
              ...dispute,
              status: "under_review",
              updatedAt: new Date().toISOString(),
            }
          : dispute,
      ),
    );
  };

  const requestResponse = (disputeId: string) => {
    setDisputes((current) =>
      current.map((dispute) =>
        dispute.id === disputeId
          ? {
              ...dispute,
              status: "awaiting_response",
              updatedAt: new Date().toISOString(),
            }
          : dispute,
      ),
    );
  };

  const columns: AdminTableColumn<Dispute>[] = [
    {
      id: "reference",
      header: "Dispute",
      accessor: "reference",
      sortable: true,
      render: (_, dispute) => (
        <div className="min-w-0">
          <div className="font-medium text-slate-900">
            {dispute.reference}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            Order {dispute.orderReference}
          </div>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      accessor: "customerName",
      sortable: true,
      render: (_, dispute) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-800">
            {dispute.customerName}
          </div>

          <div className="truncate text-xs text-slate-500">
            {dispute.businessName}
          </div>
        </div>
      ),
    },
    {
      id: "reason",
      header: "Reason",
      accessor: "reason",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-slate-700">
          {reasonLabels[String(value) as DisputeReason] ?? String(value)}
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
        <span className="font-medium text-slate-800">
          {formatAmount(value)}
        </span>
      ),
    },
    {
      id: "priority",
      header: "Priority",
      accessor: "priority",
      sortable: true,
      render: (value) => (
        <Badge variant={priorityVariant(value)}>
          {priorityLabels[String(value) as DisputePriority] ?? String(value)}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (value) => (
        <Badge variant={statusVariant(value)}>
          {statusLabels[String(value) as DisputeStatus] ?? String(value)}
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
          {formatDate(value)}
        </span>
      ),
    },
  ];

  const getRowActions = (
    dispute: Dispute,
  ): AdminTableRowAction[] => {
    const actions: AdminTableRowAction[] = [
      {
        id: "view",
        label: "View dispute",
        icon: Eye,
        onClick: () => openDetails(dispute),
      },
    ];

    if (
      dispute.status === "open" ||
      dispute.status === "awaiting_response"
    ) {
      actions.push({
        id: "review",
        label: "Move to review",
        icon: ShieldAlert,
        onClick: () => moveToReview(dispute.id),
      });
    }

    if (
      dispute.status === "open" ||
      dispute.status === "under_review"
    ) {
      actions.push({
        id: "request-response",
        label: "Request response",
        icon: MessageSquare,
        onClick: () =>
          requestResponse(dispute.id),
      });
    }

    if (
      dispute.status === "under_review" ||
      dispute.status === "awaiting_response"
    ) {
      actions.push(
        {
          id: "resolve",
          label: "Resolve dispute",
          icon: CheckCircle2,
          onClick: () =>
            openResolution(dispute, "resolved"),
        },
        {
          id: "reject",
          label: "Reject dispute",
          icon: XCircle,
          danger: true,
          onClick: () =>
            openResolution(dispute, "rejected"),
        },
      );
    }

    return actions;
  };

  const openCount = disputes.filter(
    (dispute) => dispute.status === "open",
  ).length;

  const reviewCount = disputes.filter(
    (dispute) =>
      dispute.status === "under_review" ||
      dispute.status === "awaiting_response",
  ).length;

  const resolvedCount = disputes.filter(
    (dispute) => dispute.status === "resolved",
  ).length;

  const urgentCount = disputes.filter(
    (dispute) =>
      dispute.priority === "urgent" &&
      !["resolved", "rejected", "cancelled"].includes(
        dispute.status,
      ),
  ).length;

  return (
    <PageContainer
      title="Disputes"
      description="Review customer and business disputes and manage their resolution."
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Dispute Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Investigate marketplace disputes, collect responses,
            and record administrative decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-slate-500" />

              <div>
                <p className="text-sm text-slate-500">
                  Open
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {openCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600" />

              <div>
                <p className="text-sm text-slate-500">
                  Under attention
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {reviewCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />

              <div>
                <p className="text-sm text-slate-500">
                  Resolved
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {resolvedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />

              <div>
                <p className="text-sm text-red-700">
                  Urgent active
                </p>

                <p className="mt-1 text-2xl font-semibold text-red-900">
                  {urgentCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <AdminFilters>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search disputes, orders, customers..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter disputes by status"
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
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter disputes by priority"
          >
            {priorityOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPriority("");
            }}
          >
            Clear filters
          </Button>
        </AdminFilters>

        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />

            <div>
              <p className="font-medium text-brand-900">
                Financial protection
              </p>

              <p className="mt-1 text-sm leading-6 text-brand-800">
                Dispute decisions do not directly modify customer
                balances or business earnings from the frontend.
                Any approved refund must go through the protected
                wallet-refund workflow and the financial ledger.
              </p>
            </div>
          </div>
        </div>

        <AdminTable
          columns={columns}
          data={filteredDisputes}
          rowKey={(dispute) => dispute.id}
          getRowActions={getRowActions}
          emptyTitle="No disputes found"
          emptyDescription="No disputes match the current search or filters."
          pagination
          pageSize={10}
          stickyHeader
          striped
        />

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-500">
            Showing {filteredDisputes.length} of{" "}
            {disputes.length} disputes
          </p>
        </div>
      </div>

      <Modal
        open={showDetails}
        onClose={closeDetails}
        title={
          selectedDispute
            ? `Dispute ${selectedDispute.reference}`
            : "Dispute details"
        }
      >
        {selectedDispute && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={statusVariant(
                  selectedDispute.status,
                )}
              >
                {statusLabels[selectedDispute.status]}
              </Badge>

              <Badge
                variant={priorityVariant(
                  selectedDispute.priority,
                )}
              >
                {priorityLabels[selectedDispute.priority]}
              </Badge>

              <Badge variant="default">
                {reasonLabels[selectedDispute.reason]}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Order
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  {selectedDispute.orderReference}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Disputed amount
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  {formatAmount(
                    selectedDispute.amount,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Customer
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {selectedDispute.customerName}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Business
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {selectedDispute.businessName}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Rider
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {selectedDispute.riderName ||
                    "Not assigned"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Created
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(
                    selectedDispute.createdAt,
                  )}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Customer description
              </p>

              <div className="mt-2 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {selectedDispute.description}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Customer response
              </p>

              <div className="mt-2 rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                {selectedDispute.customerResponse ||
                  "No customer response recorded."}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Business response
              </p>

              <div className="mt-2 rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                {selectedDispute.businessResponse ||
                  "No business response recorded."}
              </div>
            </div>

            {selectedDispute.adminNote && (
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Admin note
                </p>

                <div className="mt-2 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-900">
                  {selectedDispute.adminNote}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                onClick={closeDetails}
              >
                Close
              </Button>

              {(selectedDispute.status ===
                "under_review" ||
                selectedDispute.status ===
                  "awaiting_response") && (
                <>
                  <Button
                    variant="danger"
                    onClick={() => {
                      closeDetails();
                      openResolution(
                        selectedDispute,
                        "rejected",
                      );
                    }}
                  >
                    Reject
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => {
                      closeDetails();
                      openResolution(
                        selectedDispute,
                        "resolved",
                      );
                    }}
                  >
                    Resolve
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showResolutionModal}
        onClose={closeResolution}
        title={
          resolution === "resolved"
            ? "Resolve dispute"
            : "Reject dispute"
        }
      >
        <div className="space-y-5">
          <div
            className={
              resolution === "resolved"
                ? "rounded-lg border border-emerald-200 bg-emerald-50 p-4"
                : "rounded-lg border border-red-200 bg-red-50 p-4"
            }
          >
            <p
              className={
                resolution === "resolved"
                  ? "font-medium text-emerald-900"
                  : "font-medium text-red-900"
              }
            >
              {resolution === "resolved"
                ? "This dispute will be marked as resolved."
                : "This dispute will be marked as rejected."}
            </p>

            <p
              className={
                resolution === "resolved"
                  ? "mt-1 text-sm leading-5 text-emerald-800"
                  : "mt-1 text-sm leading-5 text-red-800"
              }
            >
              Record the administrative decision clearly so it
              can be reviewed later through the dispute and audit
              history.
            </p>
          </div>

          <Textarea
            label="Admin resolution note"
            value={adminNote}
            onChange={(event) =>
              setAdminNote(event.target.value)
            }
            placeholder="Explain the decision and any relevant action..."
            rows={5}
          />

          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs leading-5 text-slate-600">
              If this decision requires a customer refund, the
              refund should be processed separately through the
              protected wallet-refund workflow. This page does not
              directly modify financial balances.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={closeResolution}
            >
              Cancel
            </Button>

            <Button
              variant={
                resolution === "resolved"
                  ? "primary"
                  : "danger"
              }
              onClick={saveResolution}
            >
              {resolution === "resolved"
                ? "Resolve dispute"
                : "Reject dispute"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
