import {
  CheckCircle2,
  Eye,
  MoreHorizontal,
  PauseCircle,
  Store,
  XCircle,
} from "lucide-react";

import {
  AdminTable,
  type AdminTableAction,
  type AdminTableColumn,
} from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatNaira, formatNumber } from "@/libs/format";

export type BusinessManagementStatus =
  | "pending"
  | "active"
  | "suspended"
  | "rejected"
  | "closed";

export type BusinessVerificationStatus =
  | "pending"
  | "verified"
  | "rejected";

export interface ManagedBusiness {
  id: string;
  name: string;
  slug?: string;

  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;

  phone?: string;
  email?: string;

  city?: string;
  state?: string;
  country?: string;

  status: BusinessManagementStatus;
  verified?: boolean;
  verificationStatus?: BusinessVerificationStatus;

  productCount?: number;
  orderCount?: number;
  customerCount?: number;

  grossSales?: number;
  platformFees?: number;
  netEarnings?: number;
  pendingAmount?: number;
  availableAmount?: number;
  paidOutAmount?: number;

  createdAt?: string | Date;
  updatedAt?: string | Date;

  logo?: string;
}

export interface BusinessManagementProps {
  businesses: ManagedBusiness[];

  loading?: boolean;
  emptyMessage?: string;

  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;

  onView?: (business: ManagedBusiness) => void;
  onVerify?: (business: ManagedBusiness) => void;
  onReject?: (business: ManagedBusiness) => void;
  onSuspend?: (business: ManagedBusiness) => void;
  onActivate?: (business: ManagedBusiness) => void;
  onClose?: (business: ManagedBusiness) => void;

  onBulkVerify?: (businesses: ManagedBusiness[]) => void;
  onBulkSuspend?: (businesses: ManagedBusiness[]) => void;

  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;

  compact?: boolean;
  stickyHeader?: boolean;
  striped?: boolean;
  className?: string;
}

const statusConfig: Record<
  BusinessManagementStatus,
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
  active: {
    label: "Active",
    variant: "success",
  },
  suspended: {
    label: "Suspended",
    variant: "danger",
  },
  rejected: {
    label: "Rejected",
    variant: "danger",
  },
  closed: {
    label: "Closed",
    variant: "neutral",
  },
};

const verificationConfig: Record<
  BusinessVerificationStatus,
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
    label: "Pending review",
    variant: "warning",
  },
  verified: {
    label: "Verified",
    variant: "success",
  },
  rejected: {
    label: "Rejected",
    variant: "danger",
  },
};

function displayDate(value?: string | Date) {
  if (!value) {
    return "—";
  }

  return formatDate(value);
}

function getVerificationStatus(
  business: ManagedBusiness,
): BusinessVerificationStatus {
  if (business.verificationStatus) {
    return business.verificationStatus;
  }

  if (business.verified) {
    return "verified";
  }

  if (business.status === "rejected") {
    return "rejected";
  }

  return "pending";
}

function getBusinessActions(
  business: ManagedBusiness,
  handlers: BusinessManagementProps,
): AdminTableAction<ManagedBusiness>[] {
  const actions: AdminTableAction<ManagedBusiness>[] = [];

  if (handlers.onView) {
    actions.push({
      id: "view",
      label: "View business",
      icon: Eye,
      onClick: () => handlers.onView?.(business),
    });
  }

  if (
    handlers.onVerify &&
    getVerificationStatus(business) === "pending"
  ) {
    actions.push({
      id: "verify",
      label: "Verify business",
      icon: CheckCircle2,
      onClick: () => handlers.onVerify?.(business),
    });
  }

  if (
    handlers.onReject &&
    getVerificationStatus(business) === "pending"
  ) {
    actions.push({
      id: "reject",
      label: "Reject verification",
      icon: XCircle,
      danger: true,
      onClick: () => handlers.onReject?.(business),
    });
  }

  if (
    handlers.onSuspend &&
    business.status === "active"
  ) {
    actions.push({
      id: "suspend",
      label: "Suspend business",
      icon: PauseCircle,
      danger: true,
      onClick: () => handlers.onSuspend?.(business),
    });
  }

  if (
    handlers.onActivate &&
    (business.status === "pending" ||
      business.status === "suspended")
  ) {
    actions.push({
      id: "activate",
      label: "Activate business",
      icon: CheckCircle2,
      onClick: () => handlers.onActivate?.(business),
    });
  }

  if (
    handlers.onClose &&
    business.status !== "closed"
  ) {
    actions.push({
      id: "close",
      label: "Close business",
      icon: XCircle,
      danger: true,
      onClick: () => handlers.onClose?.(business),
    });
  }

  return actions;
}

export function BusinessManagement({
  businesses,
  loading = false,
  emptyMessage = "No businesses found.",
  selectedIds = [],
  onSelectionChange,
  onView,
  onVerify,
  onReject,
  onSuspend,
  onActivate,
  onClose,
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
}: BusinessManagementProps) {
  const columns: AdminTableColumn<ManagedBusiness>[] = [
    {
      id: "business",
      header: "Business",
      width: "220px",
      sortable: true,
      accessor: (business) => business.name,
      render: (business) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Store className="h-4 w-4 text-slate-400" />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {business.name}
            </p>

            {business.slug && (
              <p className="truncate font-mono text-xs text-slate-500">
                /{business.slug}
              </p>
            )}
          </div>
        </div>
      ),
    },

    {
      id: "owner",
      header: "Owner",
      width: "190px",
      sortable: true,
      accessor: (business) => business.ownerName ?? "",
      render: (business) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">
            {business.ownerName ?? "—"}
          </p>

          {business.ownerEmail && (
            <p className="truncate text-xs text-slate-500">
              {business.ownerEmail}
            </p>
          )}
        </div>
      ),
    },

    {
      id: "location",
      header: "Location",
      width: "160px",
      render: (business) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-700">
            {business.city ?? "—"}
          </p>

          {business.state && (
            <p className="truncate text-xs text-slate-500">
              {business.state}
            </p>
          )}
        </div>
      ),
    },

    {
      id: "verification",
      header: "Verification",
      width: "145px",
      render: (business) => {
        const verification =
          verificationConfig[
            getVerificationStatus(business)
          ];

        return (
          <Badge variant={verification.variant} size="sm">
            {verification.label}
          </Badge>
        );
      },
    },

    {
      id: "status",
      header: "Status",
      width: "125px",
      render: (business) => {
        const status = statusConfig[business.status];

        return (
          <Badge variant={status.variant} size="sm">
            {status.label}
          </Badge>
        );
      },
    },

    {
      id: "products",
      header: "Products",
      width: "100px",
      align: "right",
      sortable: true,
      accessor: (business) => business.productCount ?? 0,
      render: (business) => (
        <span className="text-sm font-medium text-slate-700">
          {formatNumber(business.productCount ?? 0)}
        </span>
      ),
    },

    {
      id: "orders",
      header: "Orders",
      width: "100px",
      align: "right",
      sortable: true,
      accessor: (business) => business.orderCount ?? 0,
      render: (business) => (
        <span className="text-sm font-medium text-slate-700">
          {formatNumber(business.orderCount ?? 0)}
        </span>
      ),
    },

    {
      id: "earnings",
      header: "Net earnings",
      width: "145px",
      align: "right",
      sortable: true,
      accessor: (business) => business.netEarnings ?? 0,
      render: (business) => (
        <span className="text-sm font-semibold text-slate-900">
          {formatNaira(business.netEarnings ?? 0)}
        </span>
      ),
    },

    {
      id: "created",
      header: "Joined",
      width: "125px",
      sortable: true,
      accessor: (business) =>
        business.createdAt
          ? new Date(business.createdAt).getTime()
          : 0,
      render: (business) => (
        <span className="text-xs text-slate-500">
          {displayDate(business.createdAt)}
        </span>
      ),
    },
  ];

  const actions = businesses.reduce<
    AdminTableAction<ManagedBusiness>[]
  >((result, business) => {
    const businessActions = getBusinessActions(
      business,
      {
        onView,
        onVerify,
        onReject,
        onSuspend,
        onActivate,
        onClose,
      },
    );

    businessActions.forEach((action) => {
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
        data={businesses}
        columns={columns}
        rowKey={(business) => business.id}
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
        ariaLabel="Admin businesses"
      />

      {selectedIds.length > 0 &&
        (onBulkVerify || onBulkSuspend) && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {selectedIds.length}
              </span>{" "}
              business
              {selectedIds.length === 1 ? "" : "es"} selected
            </p>

            <div className="flex flex-wrap gap-2">
              {onBulkVerify && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    onBulkVerify(
                      businesses.filter((business) =>
                        selectedIds.includes(
                          business.id,
                        ),
                      ),
                    )
                  }
                  disabled={loading}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Verify selected
                </Button>
              )}

              {onBulkSuspend && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    onBulkSuspend(
                      businesses.filter((business) =>
                        selectedIds.includes(
                          business.id,
                        ),
                      ),
                    )
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

export default BusinessManagement;
