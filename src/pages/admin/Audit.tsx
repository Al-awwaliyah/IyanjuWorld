import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import PageContainer from "../../components/layout/PageContainer";
import AdminFilters from "../../components/admin/AdminFilters";
import AdminTable, {
  type AdminTableColumn,
  type AdminTableRowAction,
} from "../../components/admin/AdminTable";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";

type AuditSeverity =
  | "info"
  | "success"
  | "warning"
  | "critical";

type AuditStatus =
  | "success"
  | "failed";

type AuditActorRole =
  | "super_admin"
  | "operations"
  | "support"
  | "finance"
  | "compliance"
  | "read_only"
  | "customer"
  | "business_owner"
  | "rider"
  | "system";

type AuditLog = {
  id: string;
  reference: string;
  actorId: string | null;
  actorName: string;
  actorRole: AuditActorRole;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  severity: AuditSeverity;
  status: AuditStatus;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

const initialLogs: AuditLog[] = [
  {
    id: "audit-001",
    reference: "AUD-10001",
    actorId: "admin-001",
    actorName: "Super Admin",
    actorRole: "super_admin",
    action: "platform_fee_updated",
    entityType: "platform_settings",
    entityId: "platform-settings",
    description:
      "Platform commission rate was updated from 5% to 5.5%.",
    severity: "warning",
    status: "success",
    ipAddress: "102.88.14.20",
    userAgent:
      "Chrome / Windows",
    metadata: {
      previous_rate: 5,
      new_rate: 5.5,
      currency: "NGN",
    },
    createdAt: "2026-09-12T12:45:00.000Z",
  },
  {
    id: "audit-002",
    reference: "AUD-10002",
    actorId: "admin-002",
    actorName: "Finance Admin",
    actorRole: "finance",
    action: "wallet_refund_processed",
    entityType: "refund",
    entityId: "refund-001",
    description:
      "Wallet refund was processed for a completed order.",
    severity: "success",
    status: "success",
    ipAddress: "102.89.22.41",
    userAgent:
      "Chrome / Windows",
    metadata: {
      destination: "wallet",
      amount: 25000,
      currency: "NGN",
      reference: "WALLET-REFUND-A8127F3C",
    },
    createdAt: "2026-09-12T11:30:00.000Z",
  },
  {
    id: "audit-003",
    reference: "AUD-10003",
    actorId: "admin-003",
    actorName: "Operations Admin",
    actorRole: "operations",
    action: "rider_verified",
    entityType: "rider",
    entityId: "rider-004",
    description:
      "Rider verification status was changed to verified.",
    severity: "info",
    status: "success",
    ipAddress: "197.210.54.12",
    userAgent:
      "Chrome / Windows",
    metadata: {
      previous_status: "under_review",
      new_status: "verified",
    },
    createdAt: "2026-09-12T10:20:00.000Z",
  },
  {
    id: "audit-004",
    reference: "AUD-10004",
    actorId: "admin-004",
    actorName: "Support Admin",
    actorRole: "support",
    action: "business_suspended",
    entityType: "business",
    entityId: "business-008",
    description:
      "Business account was suspended following an operational review.",
    severity: "critical",
    status: "success",
    ipAddress: "102.90.12.77",
    userAgent:
      "Chrome / Windows",
    metadata: {
      reason: "Repeated customer complaints",
    },
    createdAt: "2026-09-12T09:45:00.000Z",
  },
  {
    id: "audit-005",
    reference: "AUD-10005",
    actorId: null,
    actorName: "System",
    actorRole: "system",
    action: "payment_webhook_processed",
    entityType: "payment_transaction",
    entityId: "payment-1204",
    description:
      "Flutterwave payment webhook was successfully processed.",
    severity: "info",
    status: "success",
    ipAddress: null,
    userAgent: null,
    metadata: {
      provider: "flutterwave",
      payment_status: "successful",
    },
    createdAt: "2026-09-12T09:10:00.000Z",
  },
  {
    id: "audit-006",
    reference: "AUD-10006",
    actorId: "admin-005",
    actorName: "Compliance Admin",
    actorRole: "compliance",
    action: "business_verification_rejected",
    entityType: "business",
    entityId: "business-012",
    description:
      "Business verification was rejected because the submitted information could not be validated.",
    severity: "warning",
    status: "success",
    ipAddress: "105.112.18.42",
    userAgent:
      "Chrome / Windows",
    metadata: {
      reason: "Verification information incomplete",
    },
    createdAt: "2026-09-11T17:35:00.000Z",
  },
  {
    id: "audit-007",
    reference: "AUD-10007",
    actorId: "admin-002",
    actorName: "Finance Admin",
    actorRole: "finance",
    action: "payout_approved",
    entityType: "payout",
    entityId: "payout-441",
    description:
      "Business payout was approved for processing.",
    severity: "success",
    status: "success",
    ipAddress: "102.89.22.41",
    userAgent:
      "Chrome / Windows",
    metadata: {
      amount: 185000,
      currency: "NGN",
    },
    createdAt: "2026-09-11T16:20:00.000Z",
  },
  {
    id: "audit-008",
    reference: "AUD-10008",
    actorId: "admin-006",
    actorName: "Operations Admin",
    actorRole: "operations",
    action: "delivery_zone_updated",
    entityType: "delivery_zone",
    entityId: "zone-003",
    description:
      "Delivery zone pricing configuration was updated.",
    severity: "info",
    status: "success",
    ipAddress: "197.210.11.90",
    userAgent:
      "Chrome / Windows",
    metadata: {
      city: "Ibadan",
      base_fee: 1200,
      per_km_fee: 150,
    },
    createdAt: "2026-09-11T14:05:00.000Z",
  },
  {
    id: "audit-009",
    reference: "AUD-10009",
    actorId: "admin-004",
    actorName: "Support Admin",
    actorRole: "support",
    action: "refund_approval_failed",
    entityType: "refund",
    entityId: "refund-004",
    description:
      "A refund approval attempt was rejected because the administrator did not have the required permission.",
    severity: "critical",
    status: "failed",
    ipAddress: "102.90.12.77",
    userAgent:
      "Chrome / Windows",
    metadata: {
      required_permission: "finance.refund_approve",
    },
    createdAt: "2026-09-11T12:45:00.000Z",
  },
  {
    id: "audit-010",
    reference: "AUD-10010",
    actorId: "customer-100",
    actorName: "Amina Yusuf",
    actorRole: "customer",
    action: "wallet_deposit_completed",
    entityType: "wallet_transaction",
    entityId: "wallet-tx-881",
    description:
      "Customer wallet deposit was completed after payment verification.",
    severity: "success",
    status: "success",
    ipAddress: "105.112.30.18",
    userAgent:
      "Chrome / Android",
    metadata: {
      amount: 50000,
      currency: "NGN",
      provider: "flutterwave",
    },
    createdAt: "2026-09-11T11:20:00.000Z",
  },
];

const actionOptions = [
  { value: "", label: "All actions" },
  {
    value: "platform_fee_updated",
    label: "Platform fee updated",
  },
  {
    value: "wallet_refund_processed",
    label: "Wallet refund processed",
  },
  {
    value: "rider_verified",
    label: "Rider verified",
  },
  {
    value: "business_suspended",
    label: "Business suspended",
  },
  {
    value: "payment_webhook_processed",
    label: "Payment webhook processed",
  },
  {
    value: "business_verification_rejected",
    label: "Business verification rejected",
  },
  {
    value: "payout_approved",
    label: "Payout approved",
  },
  {
    value: "delivery_zone_updated",
    label: "Delivery zone updated",
  },
];

const severityOptions = [
  { value: "", label: "All severities" },
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
];

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];

const roleOptions = [
  { value: "", label: "All actor roles" },
  { value: "super_admin", label: "Super Admin" },
  { value: "operations", label: "Operations" },
  { value: "support", label: "Support" },
  { value: "finance", label: "Finance" },
  { value: "compliance", label: "Compliance" },
  { value: "read_only", label: "Read Only" },
  { value: "customer", label: "Customer" },
  { value: "business_owner", label: "Business Owner" },
  { value: "rider", label: "Rider" },
  { value: "system", label: "System" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatJsonValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (value === null || value === undefined) {
    return "—";
  }

  return JSON.stringify(value);
}

function roleLabel(role: AuditActorRole) {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "operations":
      return "Operations";
    case "support":
      return "Support";
    case "finance":
      return "Finance";
    case "compliance":
      return "Compliance";
    case "read_only":
      return "Read Only";
    case "business_owner":
      return "Business Owner";
    case "customer":
      return "Customer";
    case "rider":
      return "Rider";
    case "system":
      return "System";
    default:
      return role;
  }
}

function severityVariant(severity: AuditSeverity) {
  switch (severity) {
    case "success":
      return "success" as const;
    case "warning":
      return "warning" as const;
    case "critical":
      return "danger" as const;
    default:
      return "info" as const;
  }
}

function statusVariant(status: AuditStatus) {
  return status === "success"
    ? ("success" as const)
    : ("danger" as const);
}

export default function Audit() {
  const [logs] = useState<AuditLog[]>(initialLogs);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");

  const [selectedLog, setSelectedLog] =
    useState<AuditLog | null>(null);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const searchable = [
        log.reference,
        log.actorName,
        log.actorRole,
        log.action,
        log.entityType,
        log.entityId,
        log.description,
        log.ipAddress,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      const matchesAction =
        !action || log.action === action;

      const matchesSeverity =
        !severity || log.severity === severity;

      const matchesStatus =
        !status || log.status === status;

      const matchesRole =
        !role || log.actorRole === role;

      return (
        matchesSearch &&
        matchesAction &&
        matchesSeverity &&
        matchesStatus &&
        matchesRole
      );
    });
  }, [
    logs,
    search,
    action,
    severity,
    status,
    role,
  ]);

  const successfulCount = logs.filter(
    (log) => log.status === "success",
  ).length;

  const failedCount = logs.filter(
    (log) => log.status === "failed",
  ).length;

  const criticalCount = logs.filter(
    (log) => log.severity === "critical",
  ).length;

  const todayCount = logs.filter((log) => {
    const created = new Date(log.createdAt);
    const now = new Date();

    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    );
  }).length;

  const columns: AdminTableColumn<AuditLog>[] = [
    {
      id: "reference",
      header: "Event",
      accessor: "reference",
      sortable: true,
      render: (_, log) => (
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              log.severity === "critical"
                ? "bg-red-50 text-red-600"
                : log.severity === "warning"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            <Activity className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="font-medium text-slate-900">
              {log.reference}
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
              {log.action}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "actor",
      header: "Actor",
      accessor: "actorName",
      sortable: true,
      render: (_, log) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">
            {log.actorName}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {roleLabel(log.actorRole)}
          </p>
        </div>
      ),
    },
    {
      id: "entity",
      header: "Entity",
      accessor: "entityType",
      sortable: true,
      render: (_, log) => (
        <div>
          <p className="text-sm capitalize text-slate-700">
            {log.entityType.replaceAll("_", " ")}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {log.entityId || "—"}
          </p>
        </div>
      ),
    },
    {
      id: "description",
      header: "Description",
      accessor: "description",
      render: (value) => (
        <p className="max-w-md text-sm leading-5 text-slate-600">
          {value}
        </p>
      ),
    },
    {
      id: "severity",
      header: "Severity",
      accessor: "severity",
      sortable: true,
      render: (value) => (
        <Badge variant={severityVariant(value)}>
          {value}
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
          {value === "success"
            ? "Success"
            : "Failed"}
        </Badge>
      ),
    },
    {
      id: "createdAt",
      header: "Timestamp",
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
    log: AuditLog,
  ): AdminTableRowAction[] => [
    {
      id: "view",
      label: "View event details",
      icon: Eye,
      onClick: () => setSelectedLog(log),
    },
  ];

  return (
    <PageContainer
      title="Audit Logs"
      description="Review security-sensitive and operational activity across IyanjuWorld."
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Audit Logs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Every important administrative, financial, security, and
            system action should be recorded for accountability and
            troubleshooting.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AuditStat
            icon={Activity}
            label="Total events"
            value={logs.length}
          />

          <AuditStat
            icon={CheckCircle2}
            label="Successful"
            value={successfulCount}
          />

          <AuditStat
            icon={AlertTriangle}
            label="Failed"
            value={failedCount}
            danger={failedCount > 0}
          />

          <AuditStat
            icon={ShieldAlert}
            label="Critical"
            value={criticalCount}
            danger={criticalCount > 0}
          />
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

            <div>
              <p className="font-medium text-blue-900">
                Audit trail protection
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                Audit records should be append-only from the application
                layer. Sensitive financial events, authentication
                events, role changes, refunds, payouts, platform
                configuration changes, and security events should be
                recorded server-side.
              </p>
            </div>
          </div>
        </div>

        <AdminFilters>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Filter className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search audit events..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              aria-label="Search audit events"
            />
          </div>

          <select
            value={action}
            onChange={(event) =>
              setAction(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter audit events by action"
          >
            {actionOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={severity}
            onChange={(event) =>
              setSeverity(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter audit events by severity"
          >
            {severityOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter audit events by status"
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
            value={role}
            onChange={(event) =>
              setRole(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter audit events by actor role"
          >
            {roleOptions.map((option) => (
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
              setAction("");
              setSeverity("");
              setStatus("");
              setRole("");
            }}
          >
            Clear filters
          </Button>
        </AdminFilters>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-slate-400" />

            <span className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredLogs.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">
                {logs.length}
              </span>{" "}
              audit events
            </span>
          </div>

          <span className="hidden text-xs text-slate-400 sm:block">
            {todayCount} event
            {todayCount === 1 ? "" : "s"} today
          </span>
        </div>

        <AdminTable
          columns={columns}
          data={filteredLogs}
          rowKey={(log) => log.id}
          getRowActions={getRowActions}
          emptyTitle="No audit events found"
          emptyDescription="No audit events match the current search or filters."
          pagination
          pageSize={10}
          stickyHeader
          striped
        />

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

            <div>
              <p className="text-sm font-medium text-slate-900">
                Recommended server-side audit coverage
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Authentication and role changes, business and rider
                verification, order status changes, payment events,
                wallet transactions, refunds, payouts, fee changes,
                delivery pricing changes, disputes, announcements,
                notification delivery failures, and other privileged
                operations should produce audit events.
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectedLog && (
        <AuditDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </PageContainer>
  );
}

function AuditStat({
  icon: Icon,
  label,
  value,
  danger = false,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            danger
              ? "bg-red-50 text-red-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p
            className={`mt-1 text-2xl font-semibold ${
              danger
                ? "text-red-700"
                : "text-slate-900"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function AuditDetailsModal({
  log,
  onClose,
}: {
  log: AuditLog;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Audit Event Details"
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {log.reference}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {formatDate(log.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={severityVariant(log.severity)}
            >
              {log.severity}
            </Badge>

            <Badge
              variant={statusVariant(log.status)}
            >
              {log.status}
            </Badge>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Event
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem
              label="Action"
              value={log.action}
            />

            <DetailItem
              label="Entity type"
              value={log.entityType}
            />

            <DetailItem
              label="Entity ID"
              value={log.entityId || "—"}
            />

            <DetailItem
              label="Actor"
              value={log.actorName}
            />

            <DetailItem
              label="Actor role"
              value={roleLabel(log.actorRole)}
            />

            <DetailItem
              label="Actor ID"
              value={log.actorId || "System"}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Description
          </h3>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm leading-6 text-slate-700">
              {log.description}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Request metadata
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem
              label="IP address"
              value={log.ipAddress || "System generated"}
            />

            <DetailItem
              label="User agent"
              value={log.userAgent || "System generated"}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Event metadata
          </h3>

          {Object.keys(log.metadata).length === 0 ? (
            <EmptyState
              title="No metadata"
              description="This event does not contain additional metadata."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="divide-y divide-slate-100">
                {Object.entries(log.metadata).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)]"
                    >
                      <span className="text-sm font-medium text-slate-600">
                        {key.replaceAll("_", " ")}
                      </span>

                      <span className="break-words text-sm text-slate-800">
                        {formatJsonValue(value)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

            <div>
              <p className="text-sm font-medium text-amber-900">
                Audit records are not an operational action control
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Viewing an audit event must not mutate the underlying
                order, wallet, payment, refund, payout, or account.
                Any administrative action should go through its own
                protected workflow.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-slate-800">
        {value}
      </p>
    </div>
  );
}
