import {
  Edit3,
  MapPin,
  Plus,
  Power,
  Trash2,
} from "lucide-react";

import {
  AdminTable,
  type AdminTableAction,
  type AdminTableColumn,
} from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatNaira } from "@/libs/format";

export interface DeliveryZone {
  id: string;
  name: string;

  state?: string;
  city?: string;

  baseFee: number;
  perKmFee: number;
  minimumFee?: number;
  maximumFee?: number;

  freeDeliveryThreshold?: number | null;
  maxDistanceKm?: number | null;

  currency?: string;
  active: boolean;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface DeliveryZoneManagerProps {
  zones: DeliveryZone[];

  loading?: boolean;
  emptyMessage?: string;

  onCreate?: () => void;
  onEdit?: (zone: DeliveryZone) => void;
  onToggleActive?: (zone: DeliveryZone) => void;
  onDelete?: (zone: DeliveryZone) => void;
  onView?: (zone: DeliveryZone) => void;

  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;

  compact?: boolean;
  stickyHeader?: boolean;
  striped?: boolean;
  className?: string;
}

function displayDate(value?: string | Date) {
  if (!value) {
    return "—";
  }

  return formatDate(value);
}

function displayLocation(zone: DeliveryZone) {
  if (zone.city && zone.state) {
    return `${zone.city}, ${zone.state}`;
  }

  return zone.city ?? zone.state ?? "All areas";
}

function getZoneActions(
  zone: DeliveryZone,
  handlers: DeliveryZoneManagerProps,
): AdminTableAction<DeliveryZone>[] {
  const actions: AdminTableAction<DeliveryZone>[] = [];

  if (handlers.onView) {
    actions.push({
      id: "view",
      label: "View zone",
      icon: MapPin,
      onClick: () => handlers.onView?.(zone),
    });
  }

  if (handlers.onEdit) {
    actions.push({
      id: "edit",
      label: "Edit zone",
      icon: Edit3,
      onClick: () => handlers.onEdit?.(zone),
    });
  }

  if (handlers.onToggleActive) {
    actions.push({
      id: "toggle",
      label: zone.active
        ? "Deactivate zone"
        : "Activate zone",
      icon: Power,
      danger: zone.active,
      onClick: () =>
        handlers.onToggleActive?.(zone),
    });
  }

  if (handlers.onDelete) {
    actions.push({
      id: "delete",
      label: "Delete zone",
      icon: Trash2,
      danger: true,
      onClick: () => handlers.onDelete?.(zone),
    });
  }

  return actions;
}

export function DeliveryZoneManager({
  zones,
  loading = false,
  emptyMessage = "No delivery zones configured.",
  onCreate,
  onEdit,
  onToggleActive,
  onDelete,
  onView,
  page,
  pageSize,
  totalItems,
  onPageChange,
  compact = false,
  stickyHeader = true,
  striped = true,
  className = "",
}: DeliveryZoneManagerProps) {
  const columns: AdminTableColumn<DeliveryZone>[] = [
    {
      id: "zone",
      header: "Zone",
      width: "210px",
      sortable: true,
      accessor: (zone) => zone.name,
      render: (zone) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <MapPin className="h-4 w-4 text-slate-500" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {zone.name}
            </p>

            <p className="truncate text-xs text-slate-500">
              {displayLocation(zone)}
            </p>
          </div>
        </div>
      ),
    },

    {
      id: "location",
      header: "Coverage",
      width: "180px",
      render: (zone) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-700">
            {zone.city ?? "All cities"}
          </p>

          <p className="truncate text-xs text-slate-500">
            {zone.state ?? "All states"}
          </p>
        </div>
      ),
    },

    {
      id: "base_fee",
      header: "Base fee",
      width: "120px",
      align: "right",
      sortable: true,
      accessor: (zone) => zone.baseFee,
      render: (zone) => (
        <span className="text-sm font-medium text-slate-700">
          {formatNaira(zone.baseFee)}
        </span>
      ),
    },

    {
      id: "per_km",
      header: "Per km",
      width: "115px",
      align: "right",
      sortable: true,
      accessor: (zone) => zone.perKmFee,
      render: (zone) => (
        <span className="text-sm text-slate-700">
          {formatNaira(zone.perKmFee)}
        </span>
      ),
    },

    {
      id: "minimum",
      header: "Minimum",
      width: "120px",
      align: "right",
      sortable: true,
      accessor: (zone) => zone.minimumFee ?? 0,
      render: (zone) => (
        <span className="text-sm text-slate-700">
          {zone.minimumFee !== undefined
            ? formatNaira(zone.minimumFee)
            : "—"}
        </span>
      ),
    },

    {
      id: "maximum",
      header: "Maximum",
      width: "120px",
      align: "right",
      sortable: true,
      accessor: (zone) => zone.maximumFee ?? 0,
      render: (zone) => (
        <span className="text-sm text-slate-700">
          {zone.maximumFee !== undefined
            ? formatNaira(zone.maximumFee)
            : "—"}
        </span>
      ),
    },

    {
      id: "free_threshold",
      header: "Free delivery",
      width: "140px",
      align: "right",
      sortable: true,
      accessor: (zone) =>
        zone.freeDeliveryThreshold ?? 0,
      render: (zone) => (
        <span className="text-sm text-slate-700">
          {zone.freeDeliveryThreshold != null
            ? formatNaira(
                zone.freeDeliveryThreshold,
              )
            : "Not set"}
        </span>
      ),
    },

    {
      id: "distance",
      header: "Max distance",
      width: "125px",
      align: "right",
      sortable: true,
      accessor: (zone) =>
        zone.maxDistanceKm ?? 0,
      render: (zone) => (
        <span className="text-sm text-slate-700">
          {zone.maxDistanceKm != null
            ? `${zone.maxDistanceKm} km`
            : "Unlimited"}
        </span>
      ),
    },

    {
      id: "status",
      header: "Status",
      width: "105px",
      render: (zone) => (
        <Badge
          variant={
            zone.active ? "success" : "neutral"
          }
          size="sm"
          dot
        >
          {zone.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },

    {
      id: "updated",
      header: "Updated",
      width: "120px",
      sortable: true,
      accessor: (zone) =>
        zone.updatedAt
          ? new Date(zone.updatedAt).getTime()
          : 0,
      render: (zone) => (
        <span className="text-xs text-slate-500">
          {displayDate(zone.updatedAt)}
        </span>
      ),
    },
  ];

  const actions = zones.reduce<
    AdminTableAction<DeliveryZone>[]
  >((result, zone) => {
    const zoneActions = getZoneActions(zone, {
      onView,
      onEdit,
      onToggleActive,
      onDelete,
    });

    zoneActions.forEach((action) => {
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
      {onCreate && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Delivery zones
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure delivery coverage and pricing
              rules for the marketplace.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={onCreate}
          >
            <Plus className="h-4 w-4" />
            Add delivery zone
          </Button>
        </div>
      )}

      <AdminTable
        data={zones}
        columns={columns}
        rowKey={(zone) => zone.id}
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
        ariaLabel="Delivery zones"
      />
    </div>
  );
}

export default DeliveryZoneManager;
