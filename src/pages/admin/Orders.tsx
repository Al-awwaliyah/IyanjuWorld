import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../libs/supabase";
import {
  Eye,
  Search,
  ShoppingBag,
  Truck,
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

type OrderStatus =
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

type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "partially_refunded"
  | "refunded";

type Order = {
  id: string;
  orderReference: string;
  customerName: string;
  customerPhone: string;
  businessName: string;
  businessId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  customerTotal: number;
  riderName?: string;
  createdAt: string;
};

const statusOptions = [
  { value: "", label: "All order statuses" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "paid", label: "Paid" },
  { value: "business_confirmed", label: "Business confirmed" },
  { value: "delivery_requested", label: "Delivery requested" },
  { value: "rider_assigned", label: "Rider assigned" },
  { value: "picked_up", label: "Picked up" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refund_pending", label: "Refund pending" },
  { value: "refunded", label: "Refunded" },
  { value: "disputed", label: "Disputed" },
];

const paymentOptions = [
  { value: "", label: "All payment statuses" },
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "partially_refunded", label: "Partially refunded" },
  { value: "refunded", label: "Refunded" },
];

function getOrderStatusVariant(
  status: OrderStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "completed":
    case "delivered":
      return "success";

    case "paid":
    case "business_confirmed":
    case "rider_assigned":
    case "picked_up":
    case "out_for_delivery":
      return "warning";

    case "cancelled":
    case "disputed":
      return "danger";

    default:
      return "default";
  }
}

function getOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "pending_payment":
      return "Pending payment";
    case "paid":
      return "Paid";
    case "business_confirmed":
      return "Business confirmed";
    case "delivery_requested":
      return "Delivery requested";
    case "rider_assigned":
      return "Rider assigned";
    case "picked_up":
      return "Picked up";
    case "out_for_delivery":
      return "Out for delivery";
    case "delivered":
      return "Delivered";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "refund_pending":
      return "Refund pending";
    case "refunded":
      return "Refunded";
    case "disputed":
      return "Disputed";
    default:
      return status;
  }
}

function getPaymentStatusVariant(
  status: PaymentStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
    case "partially_refunded":
      return "warning";
    case "failed":
    case "refunded":
      return "danger";
    default:
      return "default";
  }
}

function getPaymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "unpaid":
      return "Unpaid";
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "partially_refunded":
      return "Partially refunded";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

function formatAmount(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
        id,order_reference,customer_id,business_id,status,payment_status,
        subtotal,delivery_fee,platform_fee,customer_total,created_at,
        businesses!orders_business_id_fkey(name),
        customer:profiles!orders_customer_id_fkey(full_name,phone)
      `)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;
        if (!mounted) return;
        setOrders((data ?? []).map((row: any) => ({
          id: row.id,
          orderReference: row.order_reference,
          customerName: row.customer?.full_name ?? "Customer",
          customerPhone: row.customer?.phone ?? "—",
          businessName: row.businesses?.name ?? "Business",
          businessId: row.business_id,
          status: row.status,
          paymentStatus: row.payment_status,
          subtotal: Number(row.subtotal ?? 0),
          deliveryFee: Number(row.delivery_fee ?? 0),
          platformFee: Number(row.platform_fee ?? 0),
          customerTotal: Number(row.customer_total ?? 0),
          createdAt: row.created_at,
        })));
      } catch (error: unknown) {
        console.error("Failed to load admin orders", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => { mounted = false; };
  }, []);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.orderReference.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.toLowerCase().includes(query) ||
        order.businessName.toLowerCase().includes(query) ||
        order.riderName?.toLowerCase().includes(query);

      const matchesStatus =
        !status || order.status === status;

      const matchesPayment =
        !paymentStatus ||
        order.paymentStatus === paymentStatus;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [orders, search, status, paymentStatus]);

  const updateOrderStatus = (
    orderId: string,
    nextStatus: OrderStatus,
  ) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: nextStatus,
            }
          : order,
      ),
    );
  };

  const columns: AdminTableColumn<Order>[] = [
    {
      id: "order",
      header: "Order",
      accessor: "orderReference",
      sortable: true,
      render: (_, order) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <ShoppingBag className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">
              {formatOrderReference(order.orderReference)}
            </div>

            <div className="truncate text-xs text-slate-500">
              {formatDateTime(order.createdAt)}
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
      render: (_, order) => (
        <div>
          <div className="font-medium text-slate-800">
            {order.customerName}
          </div>
          <div className="text-xs text-slate-500">
            {order.customerPhone}
          </div>
        </div>
      ),
    },
    {
      id: "business",
      header: "Business",
      accessor: "businessName",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-slate-700">
          {value}
        </span>
      ),
    },
    {
      id: "total",
      header: "Customer total",
      accessor: "customerTotal",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="font-semibold text-slate-900">
          {formatAmount(value)}
        </span>
      ),
    },
    {
      id: "delivery",
      header: "Delivery",
      accessor: "deliveryFee",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="text-sm text-slate-700">
          {formatAmount(value)}
        </span>
      ),
    },
    {
      id: "orderStatus",
      header: "Order status",
      accessor: "status",
      sortable: true,
      render: (value) => (
        <Badge variant={getOrderStatusVariant(value)}>
          {getOrderStatusLabel(value)}
        </Badge>
      ),
    },
    {
      id: "paymentStatus",
      header: "Payment",
      accessor: "paymentStatus",
      sortable: true,
      render: (value) => (
        <Badge variant={getPaymentStatusVariant(value)}>
          {getPaymentStatusLabel(value)}
        </Badge>
      ),
    },
    {
      id: "rider",
      header: "Rider",
      accessor: "riderName",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-700">
            {value || "Not assigned"}
          </span>
        </div>
      ),
    },
  ];

  const getRowActions = (
    order: Order,
  ): AdminTableRowAction[] => {
    const actions: AdminTableRowAction[] = [
      {
        id: "view",
        label: "View order",
        icon: Eye,
        onClick: () => {
          window.location.href = `/admin/orders/${order.id}`;
        },
      },
    ];

    if (
      order.status !== "cancelled" &&
      order.status !== "completed" &&
      order.status !== "refunded"
    ) {
      actions.push({
        id: "cancel",
        label: "Cancel order",
        icon: XCircle,
        danger: true,
        onClick: () =>
          updateOrderStatus(order.id, "cancelled"),
      });
    }

    if (
      order.paymentStatus === "paid" &&
      order.status === "paid"
    ) {
      actions.push({
        id: "request-delivery",
        label: "Request delivery",
        icon: Truck,
        onClick: () =>
          updateOrderStatus(
            order.id,
            "delivery_requested",
          ),
      });
    }

    return actions;
  };

  const totalValue = orders.reduce(
    (sum, order) => sum + order.customerTotal,
    0,
  );

  const paidOrders = orders.filter(
    (order) => order.paymentStatus === "paid",
  ).length;

  const activeOrders = orders.filter(
    (order) =>
      !["completed", "cancelled", "refunded"].includes(
        order.status,
      ),
  ).length;

  const deliveryOrders = orders.filter(
    (order) =>
      [
        "delivery_requested",
        "rider_assigned",
        "picked_up",
        "out_for_delivery",
      ].includes(order.status),
  ).length;

  return (
    <PageContainer
      title="Orders"
      description="Monitor marketplace orders, payments, delivery progress, and order status."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Order Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track the complete order lifecycle across the
              marketplace.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPaymentStatus("");
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
              placeholder="Search order, customer, business or rider..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter orders by status"
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
            value={paymentStatus}
            onChange={(event) =>
              setPaymentStatus(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter orders by payment status"
          >
            {paymentOptions.map((option) => (
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
              Total orders
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {orders.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Active orders
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {activeOrders}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Paid orders
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {paidOrders}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Order value
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatAmount(totalValue)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-slate-500" />
              <span className="text-slate-500">
                In delivery network:
              </span>
              <span className="font-semibold text-slate-900">
                {deliveryOrders}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <span className="text-slate-500">
              Platform fee is charged to the business and is
              not added to the customer total.
            </span>
          </div>
        </div>

        <AdminTable
          columns={columns}
          data={filteredOrders}
          rowKey={(order) => order.id}
          getRowActions={getRowActions}
          emptyTitle="No orders found"
          emptyDescription="No orders match the current search or filters."
          selectable
          pagination
          pageSize={10}
          stickyHeader
          striped
        />

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {filteredOrders.length} of {orders.length}{" "}
            orders
          </p>

          <p className="text-xs text-slate-400">
            Customer total = product subtotal + delivery fee.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
