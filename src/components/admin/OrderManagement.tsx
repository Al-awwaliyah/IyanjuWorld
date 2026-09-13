import {
  CheckCircle2,
  Eye,
  MoreHorizontal,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";

import { AdminTable, type AdminTableColumn, type AdminTableAction } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatNaira } from "@/libs/format";

export type AdminOrderStatus =
  | "pending_payment"
  | "paid"
  | "business_confirmed"
  | "delivery_requested"
  | "rider_assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refund_pending"
  | "refunded"
  | "disputed";

export type AdminOrderPaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "partially_refunded"
  | "refunded";

export interface AdminOrder {
  id: string;
  orderReference: string;

  customerName?: string;
  customerEmail?: string;

  businessName?: string;
  riderName?: string;

  status: AdminOrderStatus;
  paymentStatus: AdminOrderPaymentStatus;

  subtotal: number;
  deliveryFee: number;
  platformFee?: number;
  customerTotal: number;
  businessNetAmount?: number;
  refundedAmount?: number;

  itemCount?: number;

  deliveryCity?: string;
  deliveryState?: string;

  createdAt?: string | Date;
  paidAt?: string | Date;
  deliveredAt?: string | Date;
  completedAt?: string | Date;

  disputed?: boolean;
}

export interface OrderManagementProps {
  orders: AdminOrder[];

  loading?: boolean;
  emptyMessage?: string;

  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;

  onView?: (order: AdminOrder) => void;
  onConfirmBusiness?: (order: AdminOrder) => void;
  onRequestDelivery?: (order: AdminOrder) => void;
  onAssignRider?: (order: AdminOrder) => void;
  onMarkPickedUp?: (order: AdminOrder) => void;
  onMarkOutForDelivery?: (order: AdminOrder) => void;
  onMarkDelivered?: (order: AdminOrder) => void;
  onComplete?: (order: AdminOrder) => void;
  onCancel?: (order: AdminOrder) => void;
  onRefund?: (order: AdminOrder) => void;
  onResolveDispute?: (order: AdminOrder) => void;

  onBulkCancel?: (orders: AdminOrder[]) => void;
  onBulkRefund?: (orders: AdminOrder[]) => void;

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
  AdminOrderStatus,
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
  pending_payment: {
    label: "Pending payment",
    variant: "warning",
  },
  paid: {
    label: "Paid",
    variant: "info",
  },
  business_confirmed: {
    label: "Business confirmed",
    variant: "info",
  },
  delivery_requested: {
    label: "Delivery requested",
    variant: "warning",
  },
  rider_assigned: {
    label: "Rider assigned",
    variant: "info",
  },
  picked_up: {
    label: "Picked up",
    variant: "info",
  },
  out_for_delivery: {
    label: "Out for delivery",
    variant: "info",
  },
  delivered: {
    label: "Delivered",
    variant: "success",
  },
  completed: {
    label: "Completed",
    variant: "success",
  },
  cancelled: {
    label: "Cancelled",
    variant: "neutral",
  },
  refund_pending: {
    label: "Refund pending",
    variant: "warning",
  },
  refunded: {
    label: "Refunded",
    variant: "info",
  },
  disputed: {
    label: "Disputed",
    variant: "danger",
  },
};

const paymentStatusConfig: Record<
  AdminOrderPaymentStatus,
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
  unpaid: {
    label: "Unpaid",
    variant: "warning",
  },
  pending: {
    label: "Pending",
    variant: "warning",
  },
  paid: {
    label: "Paid",
    variant: "success",
  },
  failed: {
    label: "Failed",
    variant: "danger",
  },
  partially_refunded: {
    label: "Partially refunded",
    variant: "info",
  },
  refunded: {
    label: "Refunded",
    variant: "info",
  },
};

function displayDate(value?: string | Date) {
  if (!value) {
    return "—";
  }

  return formatDateTime(value);
}

function getOrderActions(
  order: AdminOrder,
  handlers: OrderManagementProps,
): AdminTableAction<AdminOrder>[] {
  const actions: AdminTableAction<AdminOrder>[] = [];

  if (handlers.onView) {
    actions.push({
      id: "view",
      label: "View order",
      icon: Eye,
      onClick: () => handlers.onView?.(order),
    });
  }

  if (
    handlers.onConfirmBusiness &&
    order.status === "paid"
  ) {
    actions.push({
      id: "confirm-business",
      label: "Confirm business",
      icon: CheckCircle2,
      onClick: () => handlers.onConfirmBusiness?.(order),
    });
  }

  if (
    handlers.onRequestDelivery &&
    order.status === "business_confirmed"
  ) {
    actions.push({
      id: "request-delivery",
      label: "Request delivery",
      icon: Truck,
      onClick: () => handlers.onRequestDelivery?.(order),
    });
  }

  if (
    handlers.onAssignRider &&
    order.status === "delivery_requested"
  ) {
    actions.push({
      id: "assign-rider",
      label: "Assign rider",
      icon: Truck,
      onClick: () => handlers.onAssignRider?.(order),
    });
  }

  if (
    handlers.onMarkPickedUp &&
    order.status === "rider_assigned"
  ) {
    actions.push({
      id: "mark-picked-up",
      label: "Mark picked up",
      icon: PackageCheck,
      onClick: () => handlers.onMarkPickedUp?.(order),
    });
  }

  if (
    handlers.onMarkOutForDelivery &&
    order.status === "picked_up"
  ) {
    actions.push({
      id: "out-for-delivery",
      label: "Mark out for delivery",
      icon: Truck,
      onClick: () => handlers.onMarkOutForDelivery?.(order),
    });
  }

  if (
    handlers.onMarkDelivered &&
    order.status === "out_for_delivery"
  ) {
    actions.push({
      id: "mark-delivered",
      label: "Mark delivered",
      icon: CheckCircle2,
      onClick: () => handlers.onMarkDelivered?.(order),
    });
  }

  if (
    handlers.onComplete &&
    order.status === "delivered"
  ) {
    actions.push({
      id: "complete",
      label: "Complete order",
      icon: CheckCircle2,
      onClick: () => handlers.onComplete?.(order),
    });
  }

  if (
    handlers.onRefund &&
    (order.status === "cancelled" ||
      order.status === "delivered" ||
      order.status === "completed" ||
      order.status === "disputed")
  ) {
    actions.push({
      id: "refund",
      label: "Process refund",
      icon: CheckCircle2,
      onClick: () => handlers.onRefund?.(order),
    });
  }

  if (
    handlers.onResolveDispute &&
    order.status === "disputed"
  ) {
    actions.push({
      id: "resolve-dispute",
      label: "Resolve dispute",
      icon: CheckCircle2,
      onClick: () => handlers.onResolveDispute?.(order),
    });
  }

  if (
    handlers.onCancel &&
    order.status !== "cancelled" &&
    order.status !== "completed" &&
    order.status !== "refunded"
  ) {
    actions.push({
      id: "cancel",
      label: "Cancel order",
      icon: XCircle,
      danger: true,
      onClick: () => handlers.onCancel?.(order),
    });
  }

  return actions;
}

export function OrderManagement({
  orders,
  loading = false,
  emptyMessage = "No orders found.",
  selectedIds = [],
  onSelectionChange,
  onView,
  onConfirmBusiness,
  onRequestDelivery,
  onAssignRider,
  onMarkPickedUp,
  onMarkOutForDelivery,
  onMarkDelivered,
  onComplete,
  onCancel,
  onRefund,
  onResolveDispute,
  onBulkCancel,
  onBulkRefund,
  page,
  pageSize,
  totalItems,
  onPageChange,
  compact = false,
  stickyHeader = true,
  striped = true,
  className = "",
}: OrderManagementProps) {
  const columns: AdminTableColumn<AdminOrder>[] = [
    {
      id: "order",
      header: "Order",
      width: "180px",
      sortable: true,
      accessor: (order) => order.orderReference,
      render: (order) => (
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold text-slate-800">
            {order.orderReference}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {order.itemCount !== undefined
              ? `${order.itemCount} item${order.itemCount === 1 ? "" : "s"}`
              : "—"}
          </p>
        </div>
      ),
    },

    {
      id: "customer",
      header: "Customer",
      width: "180px",
      sortable: true,
      accessor: (order) => order.customerName ?? "",
      render: (order) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">
            {order.customerName ?? "—"}
          </p>

          {order.customerEmail && (
            <p className="truncate text-xs text-slate-500">
              {order.customerEmail}
            </p>
          )}
        </div>
      ),
    },

    {
      id: "business",
      header: "Business",
      width: "170px",
      sortable: true,
      accessor: (order) => order.businessName ?? "",
      render: (order) => (
        <p className="truncate text-sm text-slate-700">
          {order.businessName ?? "—"}
        </p>
      ),
    },

    {
      id: "amount",
      header: "Total",
      width: "130px",
      align: "right",
      sortable: true,
      accessor: (order) => order.customerTotal,
      render: (order) => (
        <div className="text-right">
          <p className="font-semibold text-slate-900">
            {formatNaira(order.customerTotal)}
          </p>

          {order.deliveryFee > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Delivery {formatNaira(order.deliveryFee)}
            </p>
          )}
        </div>
      ),
    },

    {
      id: "payment",
      header: "Payment",
      width: "140px",
      render: (order) => {
        const config = paymentStatusConfig[order.paymentStatus];

        return (
          <Badge variant={config.variant} size="sm">
            {config.label}
          </Badge>
        );
      },
    },

    {
      id: "status",
      header: "Status",
      width: "170px",
      render: (order) => {
        const config = statusConfig[order.status];

        return (
          <Badge variant={config.variant} size="sm">
            {config.label}
          </Badge>
        );
      },
    },

    {
      id: "rider",
      header: "Rider",
      width: "150px",
      render: (order) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-700">
            {order.riderName ?? "Not assigned"}
          </p>
        </div>
      ),
    },

    {
      id: "created",
      header: "Created",
      width: "165px",
      sortable: true,
      accessor: (order) =>
        order.createdAt
          ? new Date(order.createdAt).getTime()
          : 0,
      render: (order) => (
        <span className="text-xs text-slate-500">
          {displayDate(order.createdAt)}
        </span>
      ),
    },
  ];

  const actions = orders.reduce<
    AdminTableAction<AdminOrder>[]
  >((result, order) => {
    const orderActions = getOrderActions(order, {
      onView,
      onConfirmBusiness,
      onRequestDelivery,
      onAssignRider,
      onMarkPickedUp,
      onMarkOutForDelivery,
      onMarkDelivered,
      onComplete,
      onCancel,
      onRefund,
      onResolveDispute,
    });

    orderActions.forEach((action) => {
      if (!result.some((item) => item.id === action.id)) {
        result.push(action);
      }
    });

    return result;
  }, []);

  const bulkActions: AdminTableAction<AdminOrder>[] = [];

  if (onBulkCancel) {
    bulkActions.push({
      id: "bulk-cancel",
      label: "Cancel selected",
      icon: XCircle,
      danger: true,
      onClick: (order) => onBulkCancel([order]),
    });
  }

  if (onBulkRefund) {
    bulkActions.push({
      id: "bulk-refund",
      label: "Refund selected",
      icon: CheckCircle2,
      onClick: (order) => onBulkRefund([order]),
    });
  }

  const mergedActions =
    actions.length > 0 ? actions : bulkActions;

  return (
    <div
      className={[
        "w-full",
        className,
      ].filter(Boolean).join(" ")}
    >
      <AdminTable
        data={orders}
        columns={columns}
        rowKey={(order) => order.id}
        actions={mergedActions}
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
        ariaLabel="Admin orders"
      />

      {selectedIds.length > 0 &&
        (onBulkCancel || onBulkRefund) && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {selectedIds.length}
              </span>{" "}
              order{selectedIds.length === 1 ? "" : "s"} selected
            </p>

            <div className="flex flex-wrap gap-2">
              {onBulkRefund && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    onBulkRefund(
                      orders.filter((order) =>
                        selectedIds.includes(order.id),
                      ),
                    )
                  }
                  disabled={loading}
                >
                  Refund selected
                </Button>
              )}

              {onBulkCancel && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    onBulkCancel(
                      orders.filter((order) =>
                        selectedIds.includes(order.id),
                      ),
                    )
                  }
                  disabled={loading}
                >
                  Cancel selected
                </Button>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default OrderManagement;
