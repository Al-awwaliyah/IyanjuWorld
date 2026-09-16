import { useCallback, useEffect, useMemo, useState } from "react";
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
import { supabase } from "../../libs/supabase";
import { getSafeErrorMessage } from "../../libs/errors";

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
    value: "rider_verification_changed",
    label: "Rider verification changed",
  },
  {
    value: "business_verified",
    label: "Business verified",
  },
  {
    value: "business_unverified",
    label: "Business unverified",
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
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const { data, error: queryError } = await supabase
        .from("audit_logs")
        .select("id, actor_id, action, entity_type, entity_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(250);
      if (queryError) throw queryError;
      const rows = data ?? [];
      const actorIds = [...new Set(rows.map((row) => row.actor_id).filter(Boolean))];
      let actorMap = new Map<string, { full_name: string | null; role: string | null; phone: string | null }>();
      if (actorIds.length) {
        const { data: profiles, error: profileError } = await supabase.from("profiles").select("id, full_name, role, phone").in("id", actorIds);
        if (profileError) throw profileError;
        actorMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      }
      setLogs(rows.map((row) => {
        const actor = row.actor_id ? actorMap.get(row.actor_id) : null;
        const metadata = (row.metadata ?? {}) as Record<string, unknown>;
        const severity = String(metadata.severity ?? (String(row.action).includes("reject") || String(row.action).includes("fail") ? "critical" : "info")) as AuditSeverity;
        // Domain status values such as "verified" or "pending" are not
        // audit outcomes. Only explicit outcome values may mark an event failed.
        const auditOutcome = metadata.outcome ?? metadata.audit_status;
        const status: AuditStatus =
          auditOutcome === "failed" || auditOutcome === "failure"
            ? "failed"
            : "success";
        return {
          id: row.id, reference: `AUD-${row.id.slice(0, 8).toUpperCase()}`, actorId: row.actor_id,
          actorName: actor?.full_name ?? (row.actor_id ? "Administrator" : "System"), actorRole: (actor?.role ?? "system") as AuditActorRole,
          action: row.action, entityType: row.entity_type ?? "platform", entityId: row.entity_id,
          description: String(metadata.description ?? `${String(row.action).replace(/_/g, " ")} recorded for ${String(row.entity_type ?? "platform").replace(/_/g, " ")}.`),
          severity, status, ipAddress: typeof metadata.ip_address === "string" ? metadata.ip_address : null,
          userAgent: typeof metadata.user_agent === "string" ? metadata.user_agent : null, metadata, createdAt: row.created_at,
        };
      }));
    } catch (err) { setError(getSafeErrorMessage(err)); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadLogs(); }, [loadLogs]);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");

  const [selectedLog, setSelectedLog] =
    useState<AuditLog | null>(null);

  if (error && logs.length === 0) {
    return <PageContainer size="full"><EmptyState title="Audit log unavailable" description={error} actionLabel="Try again" onAction={() => void loadLogs()} /></PageContainer>;
  }

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

        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />

            <div>
              <p className="font-medium text-brand-900">
                Audit trail protection
              </p>

              <p className="mt-1 text-sm leading-6 text-brand-800">
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
          loading={loading}
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
