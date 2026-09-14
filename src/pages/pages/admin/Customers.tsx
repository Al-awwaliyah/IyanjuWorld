import {
  Ban,
  CheckCircle2,
  Eye,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AdminFilters } from "@/components/admin/AdminFilters";
import {
  AdminTable,
  type AdminTableAction,
  type AdminTableColumn,
} from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  formatDate,
  formatDateTime,
  formatNaira,
  formatNumber,
} from "@/libs/format";

export type CustomerManagementStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "blocked";

export interface ManagedCustomer {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  avatar?: string;

  status: CustomerManagementStatus;

  walletBalance?: number;
  pendingWalletBalance?: number;

  orderCount?: number;
  completedOrderCount?: number;
  cancelledOrderCount?: number;

  totalSpent?: number;

  city?: string;
  state?: string;

  createdAt?: string | Date;
  lastSeenAt?: string | Date;
}

interface CustomersPageProps {
  customers?: ManagedCustomer[];
  loading?: boolean;

  onRefresh?: () => void;

  onView?: (customer: ManagedCustomer) => void;
  onActivate?: (customer: ManagedCustomer) => void;
  onSuspend?: (customer: ManagedCustomer) => void;
  onBlock?: (customer: ManagedCustomer) => void;
  onUnblock?: (customer: ManagedCustomer) => void;

  onSearch?: (value: string) => void;
  onStatusChange?: (value: string) => void;

  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

const defaultCustomers: ManagedCustomer[] = [];

const statusConfig: Record<
  CustomerManagementStatus,
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
  active: {
    label: "Active",
    variant: "success",
  },
  inactive: {
    label: "Inactive",
    variant: "neutral",
  },
  suspended: {
    label: "Suspended",
    variant: "warning",
  },
  blocked: {
    label: "Blocked",
    variant: "danger",
  },
};

function displayDate(value?: string | Date) {
  if (!value) {
    return "—";
  }

  return formatDate(value);
}

function displayDateTime(value?: string | Date) {
  if (!value) {
    return "Never";
  }

  return formatDateTime(value);
}

function getInitials(name?: string) {
  if (!name?.trim()) {
    return "C";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getCustomerActions(
  customer: ManagedCustomer,
  props: CustomersPageProps,
): AdminTableAction<ManagedCustomer>[] {
  const actions: AdminTableAction<ManagedCustomer>[] = [];

  if (props.onView) {
    actions.push({
      id: "view",
      label: "View customer",
      icon: Eye,
      onClick: () => props.onView?.(customer),
    });
  }

  if (
    props.onActivate &&
    (customer.status === "inactive" ||
      customer.status === "suspended")
  ) {
    actions.push({
      id: "activate",
      label: "Activate customer",
      icon: UserCheck,
      onClick: () => props.onActivate?.(customer),
    });
  }

  if (
    props.onSuspend &&
    customer.status === "active"
  ) {
    actions.push({
      id: "suspend",
      label: "Suspend customer",
      icon: UserX,
      danger: true,
      onClick: () => props.onSuspend?.(customer),
    });
  }

  if (
    props.onBlock &&
    customer.status !== "blocked"
  ) {
    actions.push({
      id: "block",
      label: "Block customer",
      icon: Ban,
      danger: true,
      onClick: () => props.onBlock?.(customer),
    });
  }

  if (
    props.onUnblock &&
    customer.status === "blocked"
  ) {
    actions.push({
      id: "unblock",
      label: "Unblock customer",
      icon: CheckCircle2,
      onClick: () => props.onUnblock?.(customer),
    });
  }

  return actions;
}

export default function Customers({
  customers = defaultCustomers,
  loading = false,
  onRefresh,
  onView,
  onActivate,
  onSuspend,
  onBlock,
  onUnblock,
  onSearch,
  onStatusChange,
  page,
  pageSize,
  totalItems,
  onPageChange,
}: CustomersPageProps) {
  const columns: AdminTableColumn<ManagedCustomer>[] = [
    {
      id: "customer",
      header: "Customer",
      width: "235px",
      sortable: true,
      accessor: (customer) =>
        customer.fullName ?? "",
      render: (_, customer) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
            {customer.avatar ? (
              <img
                src={customer.avatar}
                alt={customer.fullName ?? "Customer"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-slate-500">
                {getInitials(customer.fullName)}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {customer.fullName ?? "Unnamed customer"}
            </p>

            {customer.email && (
              <p className="truncate text-xs text-slate-500">
                {customer.email}
              </p>
            )}
          </div>
        </div>
      ),
    },

    {
      id: "phone",
      header: "Phone",
      width: "145px",
      sortable: true,
      accessor: (customer) =>
        customer.phone ?? "",
      render: (_, customer) => (
        <span className="text-sm text-slate-700">
          {customer.phone ?? "—"}
        </span>
      ),
    },

    {
      id: "location",
      header: "Location",
      width: "160px",
      render: (_, customer) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-700">
            {customer.city ?? "—"}
          </p>

          {customer.state && (
            <p className="truncate text-xs text-slate-500">
              {customer.state}
            </p>
          )}
        </div>
      ),
    },

    {
      id: "status",
      header: "Status",
      width: "120px",
      render: (_, customer) => {
        const status =
          statusConfig[customer.status];

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
      id: "orders",
      header: "Orders",
      width: "100px",
      align: "right",
      sortable: true,
      accessor: (customer) =>
        customer.orderCount ?? 0,
      render: (_, customer) => (
        <span className="text-sm font-medium text-slate-700">
          {formatNumber(customer.orderCount ?? 0)}
        </span>
      ),
    },

    {
      id: "spent",
      header: "Total spent",
      width: "140px",
      align: "right",
      sortable: true,
      accessor: (customer) =>
        customer.totalSpent ?? 0,
      render: (_, customer) => (
        <span className="text-sm font-semibold text-slate-900">
          {formatNaira(customer.totalSpent ?? 0)}
        </span>
      ),
    },

    {
      id: "wallet",
      header: "Wallet",
      width: "135px",
      align: "right",
      sortable: true,
      accessor: (customer) =>
        customer.walletBalance ?? 0,
      render: (_, customer) => (
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">
            {formatNaira(
              customer.walletBalance ?? 0,
            )}
          </p>

          {(customer.pendingWalletBalance ?? 0) >
            0 && (
            <p className="text-xs text-slate-500">
              {formatNaira(
                customer.pendingWalletBalance ?? 0,
              )}{" "}
              pending
            </p>
          )}
        </div>
      ),
    },

    {
      id: "last_seen",
      header: "Last seen",
      width: "145px",
      sortable: true,
      accessor: (customer) =>
        customer.lastSeenAt
          ? new Date(
              customer.lastSeenAt,
            ).getTime()
          : 0,
      render: (_, customer) => (
        <span className="text-xs text-slate-500">
          {displayDateTime(customer.lastSeenAt)}
        </span>
      ),
    },

    {
      id: "joined",
      header: "Joined",
      width: "120px",
      sortable: true,
      accessor: (customer) =>
        customer.createdAt
          ? new Date(customer.createdAt).getTime()
          : 0,
      render: (_, customer) => (
        <span className="text-xs text-slate-500">
          {displayDate(customer.createdAt)}
        </span>
      ),
    },
  ];

  const actions = customers.reduce<
    AdminTableAction<ManagedCustomer>[]
  >((result, customer) => {
    const customerActions = getCustomerActions(
      customer,
      {
        onView,
        onActivate,
        onSuspend,
        onBlock,
        onUnblock,
      },
    );

    customerActions.forEach((action) => {
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
    <PageContainer size="full">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Customers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage customer accounts, activity,
              wallet balances, and account status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/wallets"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ShieldAlert className="h-4 w-4" />
              Wallets
            </Link>

            {onRefresh && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                loading={loading}
              >
                Refresh
              </Button>
            )}
          </div>
        </div>

        <AdminFilters
          searchValue=""
          onSearchChange={onSearch ?? (() => {})}
          searchPlaceholder="Search customers by name, email or phone..."
          filters={[
            {
              id: "status",
              label: "Status",
              value: "",
              options: [
                {
                  value: "",
                  label: "All statuses",
                },
                {
                  value: "active",
                  label: "Active",
                },
                {
                  value: "inactive",
                  label: "Inactive",
                },
                {
                  value: "suspended",
                  label: "Suspended",
                },
                {
                  value: "blocked",
                  label: "Blocked",
                },
              ],
              onChange:
                onStatusChange ??
                (() => {}),
            },
          ]}
          loading={loading}
        />

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Customer accounts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review customer activity and account
                status.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              {totalItems !== undefined
                ? `${formatNumber(totalItems)} customers`
                : `${formatNumber(customers.length)} shown`}
            </div>
          </div>

          <AdminTable
            data={customers}
            columns={columns}
            rowKey={(customer) => customer.id}
            actions={actions}
            loading={loading}
            emptyMessage="No customers found."
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={onPageChange}
            stickyHeader
            striped
            onRowClick={onView}
            ariaLabel="Customers"
          />
        </div>
      </div>
    </PageContainer>
  );
}
