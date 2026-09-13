import {
  CheckCircle2,
  Eye,
  MapPin,
  MoreHorizontal,
  PauseCircle,
  ShieldCheck,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";

import {
  AdminTable,
  type AdminTableAction,
  type AdminTableColumn,
} from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  formatDate,
  formatNaira,
  formatNumber,
} from "@/libs/format";

export type RiderManagementVerificationStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "suspended";

export type RiderManagementVisibleStatus =
  | "available"
  | "online"
  | "on_delivery"
  | "offline";

export type RiderManagementVehicle =
  | "bicycle"
  | "motorcycle"
  | "car"
  | "van"
  | "other";

export interface ManagedRider {
  id: string;
  profileId?: string;

  name: string;
  email?: string;
  phone?: string;
  photo?: string;

  vehicleType?: RiderManagementVehicle;
  vehicleNumber?: string;
  operatingArea?: string;

  verificationStatus: RiderManagementVerificationStatus;

  visibleStatus: RiderManagementVisibleStatus;

  online?: boolean;
  availability?: "available" | "unavailable";
  activeDeliveryId?: string | null;
  lastSeenAt?: string | Date;

  deliveryCount?: number;
  completedDeliveryCount?: number;
  cancelledDeliveryCount?: number;

  totalEarnings?: number;
  pendingEarnings?: number;
  availableEarnings?: number;
  paidOutEarnings?: number;

  rating?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface RiderManagementProps {
  riders: ManagedRider[];

  loading?: boolean;
  emptyMessage?: string;

  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;

  onView?: (rider: ManagedRider) => void;
  onVerify?: (rider: ManagedRider) => void;
  onReject?: (rider: ManagedRider) => void;
  onSuspend?: (rider: ManagedRider) => void;
  onActivate?: (rider: ManagedRider) => void;
  onSetOnline?: (rider: ManagedRider) => void;
  onSetOffline?: (rider: ManagedRider) => void;

  onBulkVerify?: (riders: ManagedRider[]) => void;
  onBulkSuspend?: (riders: ManagedRider[]) => void;

  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;

  compact?: boolean;
  stickyHeader?: boolean;
  striped?: boolean;
  className?: string;
}

const verificationConfig: Record<
  RiderManagementVerificationStatus,
  {
    label: string;
    variant:
      | "default"
      | "success"
      | "warning"
      | "danger"
      | "info"
      | "neutral";
  }
> = {
  pending: {
    label: "Pending",
    variant: "warning",
  },
  under_review: {
    label: "Under review",
    variant: "info",
  },
  verified: {
    label: "Verified",
    variant: "success",
  },
  rejected: {
    label: "Rejected",
    variant: "danger",
  },
  suspended: {
    label: "Suspended",
    variant: "danger",
  },
};

const visibleStatusConfig: Record<
  RiderManagementVisibleStatus,
  {
    label: string;
    variant:
      | "default"
      | "success"
      | "warning"
      | "danger"
      | "info"
      | "neutral";
  }
> = {
  available: {
    label: "Available",
    variant: "success",
  },
  online: {
    label: "Online",
    variant: "info",
  },
  on_delivery: {
    label: "On delivery",
    variant: "warning",
  },
  offline: {
    label: "Offline",
    variant: "neutral",
  },
};

const vehicleLabels: Record<
  RiderManagementVehicle,
  string
> = {
  bicycle: "Bicycle",
  motorcycle: "Motorcycle",
  car: "Car",
  van: "Van",
  other: "Other",
};

function displayDate(value?: string | Date) {
  if (!value) {
    return "—";
  }

  return formatDate(value);
}

function getRiderActions(
  rider: ManagedRider,
  handlers: RiderManagementProps,
): AdminTableAction<ManagedRider>[] {
  const actions: AdminTableAction<ManagedRider>[] = [];

  if (handlers.onView) {
    actions.push({
      id: "view",
      label: "View rider",
      icon: Eye,
      onClick: () => handlers.onView?.(rider),
    });
  }

  if (
    handlers.onVerify &&
    (rider.verificationStatus === "pending" ||
      rider.verificationStatus === "under_review")
  ) {
    actions.push({
      id: "verify",
      label: "Verify rider",
      icon: ShieldCheck,
      onClick: () => handlers.onVerify?.(rider),
    });
  }

  if (
    handlers.onReject &&
    (rider.verificationStatus === "pending" ||
      rider.verificationStatus === "under_review")
  ) {
    actions.push({
      id: "reject",
      label: "Reject rider",
      icon: XCircle,
      danger: true,
      onClick: () => handlers.onReject?.(rider),
    });
  }

  if (
    handlers.onSuspend &&
    rider.verificationStatus === "verified"
  ) {
    actions.push({
      id: "suspend",
      label: "Suspend rider",
      icon: PauseCircle,
      danger: true,
      onClick: () => handlers.onSuspend?.(rider),
    });
  }

  if (
    handlers.onActivate &&
    rider.verificationStatus === "suspended"
  ) {
    actions.push({
      id: "activate",
      label: "Activate rider",
      icon: UserCheck,
      onClick: () => handlers.onActivate?.(rider),
    });
  }

  if (
    handlers.onSetOnline &&
    rider.verificationStatus === "verified" &&
    rider.visibleStatus === "offline"
  ) {
    actions.push({
      id: "set_online",
      label: "Set online",
      icon: CheckCircle2,
      onClick: () => handlers.onSetOnline?.(rider),
    });
  }

  if (
    handlers.onSetOffline &&
    rider.visibleStatus !== "offline" &&
    !rider.activeDeliveryId
  ) {
    actions.push({
      id: "set_offline",
      label: "Set offline",
      icon: UserX,
      danger: true,
      onClick: () => handlers.onSetOffline?.(rider),
    });
  }

  return actions;
}

export function RiderManagement({
  riders,
  loading = false,
  emptyMessage = "No riders found.",
  selectedIds = [],
  onSelectionChange,
  onView,
  onVerify,
  onReject,
  onSuspend,
  onActivate,
  onSetOnline,
  onSetOffline,
  onBulkVerify,
  onBulkSuspend,
  page,
  pageSize,
  totalItems,
  onPageChange,
  compact = false,
  stickyHeader = true,
  striped = true,
  className = "",
}: RiderManagementProps) {
  const columns: AdminTableColumn<ManagedRider>[] = [
    {
      id: "rider",
      header: "Rider",
      width: "220px",
      sortable: true,
      accessor: (rider) => rider.name,
      render: (rider) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
            {rider.photo ? (
              <img
                src={rider.photo}
                alt={rider.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-slate-500">
                {rider.name
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part.charAt(0))
                  .join("")
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {rider.name}
            </p>

            {rider.phone && (
              <p className="truncate text-xs text-slate-500">
                {rider.phone}
              </p>
            )}
          </div>
        </div>
      ),
    },

    {
      id: "verification",
      header: "Verification",
      width: "140px",
      render: (rider) => {
        const status =
          verificationConfig[rider.verificationStatus];

        return (
          <Badge variant={status.variant} size="sm">
            {status.label}
          </Badge>
        );
      },
    },

    {
      id: "status",
      header: "Live status",
      width: "135px",
      render: (rider) => {
        const status =
          visibleStatusConfig[rider.visibleStatus];

        return (
          <Badge
            variant={status.variant}
            size="sm"
            dot
          >
            {status.label}
          </Badge>
        );
      },
    },

    {
      id: "vehicle",
      header: "Vehicle",
      width: "145px",
      render: (rider) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-700">
            {rider.vehicleType
              ? vehicleLabels[rider.vehicleType]
              : "—"}
          </p>

          {rider.vehicleNumber && (
            <p className="truncate text-xs text-slate-500">
              {rider.vehicleNumber}
            </p>
          )}
        </div>
      ),
    },

    {
      id: "area",
      header: "Operating area",
      width: "175px",
      render: (rider) => (
        <div className="flex min-w-0 items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />

          <span className="truncate text-sm text-slate-700">
            {rider.operatingArea ?? "—"}
          </span>
        </div>
      ),
    },

    {
      id: "deliveries",
      header: "Deliveries",
      width: "105px",
      align: "right",
      sortable: true,
      accessor: (rider) => rider.deliveryCount ?? 0,
      render: (rider) => (
        <span className="text-sm font-medium text-slate-700">
          {formatNumber(rider.deliveryCount ?? 0)}
        </span>
      ),
    },

    {
      id: "earnings",
      header: "Earnings",
      width: "135px",
      align: "right",
      sortable: true,
      accessor: (rider) => rider.totalEarnings ?? 0,
      render: (rider) => (
        <span className="text-sm font-semibold text-slate-900">
          {formatNaira(rider.totalEarnings ?? 0)}
        </span>
      ),
    },

    {
      id: "rating",
      header: "Rating",
      width: "90px",
      align: "right",
      sortable: true,
      accessor: (rider) => rider.rating ?? 0,
      render: (rider) => (
        <span className="text-sm font-medium text-slate-700">
          {typeof rider.rating === "number"
            ? rider.rating.toFixed(1)
            : "—"}
        </span>
      ),
    },

    {
      id: "joined",
      header: "Joined",
      width: "120px",
      sortable: true,
      accessor: (rider) =>
        rider.createdAt
          ? new Date(rider.createdAt).getTime()
          : 0,
      render: (rider) => (
        <span className="text-xs text-slate-500">
          {displayDate(rider.createdAt)}
        </span>
      ),
    },
  ];

  const actions = riders.reduce<
    AdminTableAction<ManagedRider>[]
  >((result, rider) => {
    const riderActions = getRiderActions(rider, {
      onView,
      onVerify,
      onReject,
      onSuspend,
      onActivate,
      onSetOnline,
      onSetOffline,
    });

    riderActions.forEach((action) => {
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

  const selectedRiders = riders.filter((rider) =>
    selectedIds.includes(rider.id),
  );

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
        data={riders}
        columns={columns}
        rowKey={(rider) => rider.id}
        actions={actions}
        loading={loading}
        emptyMessage={emptyMessage}
        selectable={Boolean(onSelectionChange)}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        stickyHeader={stickyHeader}
        striped={striped}
        compact={compact}
        onRowClick={onView}
        ariaLabel="Admin riders"
      />

      {selectedRiders.length > 0 &&
        (onBulkVerify || onBulkSuspend) && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {selectedRiders.length}
              </span>{" "}
              rider
              {selectedRiders.length === 1 ? "" : "s"}{" "}
              selected
            </p>

            <div className="flex flex-wrap gap-2">
              {onBulkVerify && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    onBulkVerify(selectedRiders)
                  }
                  disabled={loading}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Verify selected
                </Button>
              )}

              {onBulkSuspend && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    onBulkSuspend(selectedRiders)
                  }
                  disabled={loading}
                >
                  <PauseCircle className="h-4 w-4" />
                  Suspend selected
                </Button>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default RiderManagement;
