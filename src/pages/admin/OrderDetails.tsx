import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Truck,
  User,
  XCircle,
} from "lucide-react";

import PageContainer from "../../components/layout/PageContainer";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import OrderItems from "../../components/orders/OrderItems";
import OrderStatus from "../../components/orders/OrderStatus";
import OrderTimeline from "../../components/orders/OrderTimeline";
import OrderSummary from "../../components/orders/OrderSummary";
import { formatDateTime, formatOrderReference } from "../../libs/format";
import { supabase } from "../../libs/supabase";

type OrderStatusValue =
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

type OrderItem = {
  id: string;
  productName: string;
  sku?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type TimelineEvent = {
  id: string;
  status: OrderStatusValue;
  createdAt: string;
  note?: string;
};

type OrderDetailsData = {
  id: string;
  orderReference: string;
  status: OrderStatusValue;
  paymentStatus: PaymentStatus;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  business: {
    id: string;
    name: string;
    phone: string;
  };
  rider?: {
    id: string;
    name: string;
    phone: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  platformFeeRate: number;
  platformFee: number;
  businessNetAmount: number;
  customerTotal: number;
  deliveryAddress: string;
  deliveryZone?: string;
  deliveryDistanceKm?: number;
  deliveryNote?: string;
  customerNote?: string;
  paymentReference?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
};

const statusOrder: OrderStatusValue[] = [
  "pending_payment",
  "paid",
  "business_confirmed",
  "delivery_requested",
  "rider_assigned",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "completed",
];

function getPaymentVariant(
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

function getPaymentLabel(status: PaymentStatus) {
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

export default function OrderDetails() {
  const { orderId } = useParams();

  const [order, setOrder] = useState<OrderDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoadError("No order was specified.");
      setLoading(false);
      return;
    }

    let mounted = true;
    void Promise.all([
      supabase.from("orders").select(`
        id,order_reference,status,payment_status,customer_id,business_id,
        subtotal,delivery_fee,platform_fee_rate,platform_fee,business_net_amount,
        customer_total,delivery_address_line,delivery_city,delivery_state,
        delivery_country,delivery_notes,customer_note,created_at,updated_at,
        businesses!orders_business_id_fkey(id,name,phone),
        customer:profiles!orders_customer_id_fkey(id,full_name,phone),
        order_items(id,product_name,sku,image_url,quantity,unit_price,line_total)
      `).eq("id", orderId).maybeSingle(),
      supabase.from("order_status_history").select("id,new_status,created_at,note").eq("order_id", orderId).order("created_at", { ascending: true }),
    ]).then(([orderResult, historyResult]) => {
      if (orderResult.error) throw orderResult.error;
      if (historyResult.error) throw historyResult.error;
      if (!orderResult.data || !mounted) return;

      const row: any = orderResult.data;
      setOrder({
        id: row.id,
        orderReference: row.order_reference,
        status: row.status,
        paymentStatus: row.payment_status,
        customer: {
          id: row.customer_id,
          name: row.customer?.full_name ?? "Customer",
          phone: row.customer?.phone ?? "—",
        },
        business: {
          id: row.business_id,
          name: row.businesses?.name ?? "Business",
          phone: row.businesses?.phone ?? "—",
        },
        items: (row.order_items ?? []).map((item: any) => ({
          id: item.id,
          productName: item.product_name,
          sku: item.sku ?? undefined,
          imageUrl: item.image_url ?? undefined,
          quantity: Number(item.quantity ?? 0),
          unitPrice: Number(item.unit_price ?? 0),
          lineTotal: Number(item.line_total ?? 0),
        })),
        subtotal: Number(row.subtotal ?? 0),
        deliveryFee: Number(row.delivery_fee ?? 0),
        platformFeeRate: Number(row.platform_fee_rate ?? 0),
        platformFee: Number(row.platform_fee ?? 0),
        businessNetAmount: Number(row.business_net_amount ?? 0),
        customerTotal: Number(row.customer_total ?? 0),
        deliveryAddress: [row.delivery_address_line, row.delivery_city, row.delivery_state, row.delivery_country].filter(Boolean).join(", "),
        deliveryNote: row.delivery_notes ?? undefined,
        customerNote: row.customer_note ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        timeline: (historyResult.data ?? []).map((event: any) => ({
          id: event.id,
          status: event.new_status,
          createdAt: event.created_at,
          note: event.note ?? undefined,
        })),
      });
    }).catch((error) => {
      if (mounted) setLoadError(error instanceof Error ? error.message : "Unable to load order.");
    }).finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [orderId]);

  const canCancel = useMemo(
    () =>
      ![
        "cancelled",
        "completed",
        "delivered",
        "refunded",
      ].includes(order?.status as OrderStatusValue),
    [order?.status],
  );

  const canRequestDelivery =
    order?.paymentStatus === "paid" &&
    order?.status === "paid";

  const canMarkDelivered =
    order?.status === "out_for_delivery";

  const canComplete =
    order?.status === "delivered";

  const addTimelineEvent = (
    status: OrderStatusValue,
    note?: string,
  ) => {
    setOrder((current) => {
      if (!current) return current;
      return {
      ...current,
      status,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...current.timeline,
        {
          id: `event-${Date.now()}`,
          status,
          createdAt: new Date().toISOString(),
          note,
        },
      ],
    };
    });
  };

  const handleCancel = () => {
    addTimelineEvent(
      "cancelled",
      "Order cancelled by administrator.",
    );
    setCancelDialogOpen(false);
  };

  const handleRequestDelivery = () => {
    addTimelineEvent(
      "delivery_requested",
      "Delivery request created by administrator.",
    );
  };

  const handleMarkDelivered = () => {
    addTimelineEvent(
      "delivered",
      "Delivery marked as completed by administrator.",
    );
  };

  const handleComplete = () => {
    addTimelineEvent(
      "completed",
      "Order marked as completed.",
    );
  };

  if (loading) {
    return <PageContainer><div className="py-16 text-center text-slate-500">Loading order...</div></PageContainer>;
  }

  if (!order) {
    return <PageContainer><div className="py-16 text-center"><h1 className="text-2xl font-bold text-slate-900">Order not found</h1><p className="mt-2 text-slate-500">{loadError || "The order could not be loaded."}</p><Link to="/admin/orders" className="mt-6 inline-flex rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white dark-surface">Back to orders</Link></div></PageContainer>;
  }

  return (
    <PageContainer
      title={formatOrderReference(order.orderReference)}
      description="Review order, payment, delivery, customer, business, and financial information."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/admin/orders"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <OrderStatus status={order.status} />

            <Badge variant={getPaymentVariant(order.paymentStatus)}>
              {getPaymentLabel(order.paymentStatus)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Order items
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Products purchased in this order.
                  </p>
                </div>

                <Package className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-5">
                <OrderItems
                  items={order.items}
                />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Order financial summary
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Customer payment and business settlement
                    breakdown.
                  </p>
                </div>

                <CreditCard className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-5">
                <OrderSummary
                  subtotal={order.subtotal}
                  deliveryFee={order.deliveryFee}
                  total={order.customerTotal}
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">
                    Platform fee
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatAmount(order.platformFee)}
                  </p>

                  <p className="text-xs text-slate-400">
                    {order.platformFeeRate}% of product subtotal
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Business earnings
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatAmount(order.businessNetAmount)}
                  </p>

                  <p className="text-xs text-slate-400">
                    Before payout
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Delivery fee
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatAmount(order.deliveryFee)}
                  </p>

                  <p className="text-xs text-slate-400">
                    Paid by customer
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Order timeline
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Recorded order status changes.
                  </p>
                </div>

                <Clock3 className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-5">
                <OrderTimeline
                  events={order.timeline}
                />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <User className="h-5 w-5 text-slate-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Customer
                  </h2>

                  <p className="text-xs text-slate-500">
                    Order owner
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <p className="text-xs text-slate-500">
                    Name
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {order.customer.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Phone
                  </p>

                  <a
                    href={`tel:${order.customer.phone}`}
                    className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    <Phone className="h-4 w-4" />
                    {order.customer.phone}
                  </a>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Building2 className="h-5 w-5 text-slate-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Business
                  </h2>

                  <p className="text-xs text-slate-500">
                    Order seller
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <p className="text-xs text-slate-500">
                    Business name
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {order.business.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Phone
                  </p>

                  <a
                    href={`tel:${order.business.phone}`}
                    className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    <Phone className="h-4 w-4" />
                    {order.business.phone}
                  </a>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Truck className="h-5 w-5 text-slate-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Delivery
                  </h2>

                  <p className="text-xs text-slate-500">
                    Delivery assignment and destination
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Assigned rider
                  </p>

                  {order.rider ? (
                    <div className="mt-1">
                      <p className="font-medium text-slate-800">
                        {order.rider.name}
                      </p>

                      <a
                        href={`tel:${order.rider.phone}`}
                        className="mt-1 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                      >
                        <Phone className="h-4 w-4" />
                        {order.rider.phone}
                      </a>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      No rider assigned
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Delivery address
                  </p>

                  <div className="mt-1 flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <p className="text-sm leading-6 text-slate-700">
                      {order.deliveryAddress}
                    </p>
                  </div>
                </div>

                {order.deliveryZone && (
                  <div>
                    <p className="text-xs text-slate-500">
                      Delivery zone
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {order.deliveryZone}
                    </p>
                  </div>
                )}

                {typeof order.deliveryDistanceKm ===
                  "number" && (
                  <div>
                    <p className="text-xs text-slate-500">
                      Delivery distance
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {order.deliveryDistanceKm.toFixed(1)} km
                    </p>
                  </div>
                )}

                {order.deliveryNote && (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">
                      Delivery note
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {order.deliveryNote}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-slate-500" />

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Payment
                  </h2>

                  <p className="text-xs text-slate-500">
                    Payment verification details
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Status
                  </span>

                  <Badge
                    variant={getPaymentVariant(
                      order.paymentStatus,
                    )}
                  >
                    {getPaymentLabel(order.paymentStatus)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Method
                  </span>

                  <span className="text-sm font-medium text-slate-800">
                    {order.paymentMethod || "Not available"}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Payment reference
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-slate-800">
                    {order.paymentReference ||
                      "Not available"}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {order.customerNote && (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-slate-500" />

              <div>
                <h2 className="font-semibold text-slate-900">
                  Customer note
                </h2>

                <p className="text-xs text-slate-500">
                  Note attached to this order
                </p>
              </div>
            </div>

            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {order.customerNote}
            </p>
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Administrative actions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current order:{" "}
                <span className="font-medium text-slate-700">
                  {getOrderStatusLabel(order.status)}
                </span>
                {" · "}
                Last updated{" "}
                {formatDateTime(order.updatedAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canRequestDelivery && (
                <Button
                  variant="secondary"
                  onClick={handleRequestDelivery}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Request delivery
                </Button>
              )}

              {canMarkDelivered && (
                <Button
                  variant="secondary"
                  onClick={handleMarkDelivered}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark delivered
                </Button>
              )}

              {canComplete && (
                <Button
                  variant="primary"
                  onClick={handleComplete}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Complete order
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="danger"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel order
                </Button>
              )}
            </div>
          </div>
        </section>

        <ConfirmDialog
          open={cancelDialogOpen}
          title="Cancel this order?"
          description="This will mark the order as cancelled. Financial actions such as refunds should be processed through the dedicated refund workflow."
          confirmLabel="Cancel order"
          cancelLabel="Keep order"
          danger
          onConfirm={handleCancel}
          onCancel={() => setCancelDialogOpen(false)}
        />

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span>
              Order reference:{" "}
              <strong className="text-slate-700">
                {order.orderReference}
              </strong>
            </span>

            <span>
              Customer total:{" "}
              <strong className="text-slate-700">
                {formatAmount(order.customerTotal)}
              </strong>
            </span>

            <span>
              Business earnings:{" "}
              <strong className="text-slate-700">
                {formatAmount(order.businessNetAmount)}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function getOrderStatusLabel(status: OrderStatusValue) {
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
