import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  ShieldAlert,
} from "lucide-react";

import {
  AdminTable,
  type AdminTableAction,
  type AdminTableColumn,
} from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/libs/format";

export type AuditLogSeverity =
  | "info"
  | "success"
  | "warning"
  | "danger";

export interface AuditLogEntry {
  id: string;

  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;

  action: string;
  resourceType?: string;
  resourceId?: string;

  description?: string;

  severity?: AuditLogSeverity;

  ipAddress?: string;
  userAgent?: string;

  metadata?: Record<string, unknown> | null;

  createdAt: string | Date;
}

export interface AuditLogTableProps {
  logs: AuditLogEntry[];

  loading?: boolean;
  emptyMessage?: string;

  onView?: (log: AuditLogEntry) => void;

  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;

  compact?: boolean;
  stickyHeader?: boolean;
  striped?: boolean;
  className?: string;
}

const severityConfig: Record<
  AuditLogSeverity,
  {
    label: string;
    variant:
      | "default"
      | "success"
      | "warning"
      | "danger"
      | "info"
      | "neutral";
    icon: typeof CheckCircle2;
  }
> = {
  info: {
    label: "Info",
    variant: "info",
    icon: FileText,
  },
  success: {
    label: "Success",
    variant: "success",
    icon: CheckCircle2,
  },
  warning: {
    label: "Warning",
    variant: "warning",
    icon: AlertTriangle,
  },
  danger: {
    label: "Critical",
    variant: "danger",
    icon: ShieldAlert,
  },
};

function getSeverity(
  log: AuditLogEntry,
): AuditLogSeverity {
  if (log.severity) {
    return log.severity;
  }

  const action = log.action.toLowerCase();

  if (
    action.includes("delete") ||
    action.includes("suspend") ||
    action.includes("reject") ||
    action.includes("failed") ||
    action.includes("disable") ||
    action.includes("security")
  ) {
    return "danger";
  }

  if (
    action.includes("warning") ||
    action.includes("cancel") ||
    action.includes("refund") ||
    action.includes("withdraw")
  ) {
    return "warning";
  }

  if (
    action.includes("create") ||
    action.includes("approve") ||
    action.includes("verify") ||
    action.includes("complete") ||
    action.includes("activate")
  ) {
    return "success";
  }

  return "info";
}

function formatActor(log: AuditLogEntry) {
  return (
    log.actorName ??
    log.actorEmail ??
    log.actorId ??
    "System"
  );
}

function formatResourceType(
  resourceType?: string,
) {
  if (!resourceType) {
    return "—";
  }

  return resourceType
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatAction(action: string) {
  return action
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function getActions(
  log: AuditLogEntry,
  onView?: (log: AuditLogEntry) => void,
): AdminTableAction<AuditLogEntry>[] {
  if (!onView) {
    return [];
  }

  return [
    {
      id: "view",
      label: "View audit event",
      icon: Eye,
      onClick: () => onView(log),
    },
  ];
}

export function AuditLogTable({
  logs,
  loading = false,
  emptyMessage = "No audit events found.",
  onView,
  page,
  pageSize,
  totalItems,
  onPageChange,
  compact = false,
  stickyHeader = true,
  striped = true,
  className = "",
}: AuditLogTableProps) {
  const columns: AdminTableColumn<AuditLogEntry>[] = [
    {
      id: "timestamp",
      header: "Time",
      width: "175px",
      sortable: true,
      accessor: (log) =>
        new Date(log.createdAt).getTime(),
      render: (log) => (
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />

          <span className="text-xs text-slate-600">
            {formatDateTime(log.createdAt)}
          </span>
        </div>
      ),
    },

    {
      id: "actor",
      header: "Actor",
      width: "190px",
      sortable: true,
      accessor: (log) => formatActor(log),
      render: (log) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">
            {formatActor(log)}
          </p>

          {log.actorRole && (
            <p className="truncate text-xs text-slate-500">
              {log.actorRole}
            </p>
          )}
        </div>
      ),
    },

    {
      id: "action",
      header: "Action",
      width: "180px",
      sortable: true,
      accessor: (log) => log.action,
      render: (log) => {
        const severity = getSeverity(log);
        const config = severityConfig[severity];

        return (
          <div className="flex min-w-0 items-center gap-2">
            <config.icon
              className={[
                "h-4 w-4 shrink-0",
                severity === "danger"
                  ? "text-red-500"
                  : severity === "warning"
                    ? "text-amber-500"
                    : severity === "success"
                      ? "text-emerald-500"
                      : "text-blue-500",
              ].join(" ")}
            />

            <span className="truncate text-sm font-medium text-slate-700">
              {formatAction(log.action)}
            </span>
          </div>
        );
      },
    },

    {
      id: "resource",
      header: "Resource",
      width: "175px",
      render: (log) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-700">
            {formatResourceType(log.resourceType)}
          </p>

          {log.resourceId && (
            <p className="truncate font-mono text-xs text-slate-500">
              {log.resourceId}
            </p>
          )}
        </div>
      ),
    },

    {
      id: "description",
      header: "Description",
      width: "280px",
      render: (log) => (
        <p className="max-w-[280px] truncate text-sm text-slate-600">
          {log.description ?? "—"}
        </p>
      ),
    },

    {
      id: "severity",
      header: "Severity",
      width: "115px",
      render: (log) => {
        const severity = getSeverity(log);
        const config = severityConfig[severity];

        return (
          <Badge
            variant={config.variant}
            size="sm"
          >
            {config.label}
          </Badge>
        );
      },
    },
  ];

  const actions = logs.reduce<
    AdminTableAction<AuditLogEntry>[]
  >((result, log) => {
    const logActions = getActions(
      log,
      onView,
    );

    logActions.forEach((action) => {
      if (
        !result.some(
          (item) => item.id === action.id,
        )
      ) {
        result.push(action);
      }
    });

    return result;
  }, []);

  return (
    <div
      className={[
        "w-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <AdminTable
        data={logs}
        columns={columns}
        rowKey={(log) => log.id}
        actions={actions}
        loading={loading}
        emptyMessage={emptyMessage}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        stickyHeader={stickyHeader}
        striped={striped}
        compact={compact}
        onRowClick={onView}
        ariaLabel="Audit logs"
      />
    </div>
  );
}

export default AuditLogTable;
