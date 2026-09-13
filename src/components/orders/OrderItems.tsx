import { Package } from "lucide-react";
import ProductImage from "../marketplace/ProductImage";
import { formatNaira } from "../../libs/format";

export interface OrderItem {
  id: string;
  productId?: string | null;
  productName: string;
  sku?: string | null;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  metadata?: Record<string, unknown> | null;
}

export interface OrderItemsProps {
  items: OrderItem[];
  currency?: string;
  title?: string;
  showSku?: boolean;
  className?: string;
}

function formatAmount(
  amount: number,
  currency = "NGN",
) {
  if (currency === "NGN") {
    return formatNaira(amount);
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OrderItems({
  items,
  currency = "NGN",
  title = "Order Items",
  showSku = false,
  className = "",
}: OrderItemsProps) {
  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  if (items.length === 0) {
    return (
      <section
        className={[
          "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex items-center gap-2">
          <Package
            className="h-5 w-5 text-slate-600"
            aria-hidden="true"
          />

          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          No items were found for this order.
        </p>
      </section>
    );
  }

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package
            className="h-5 w-5 text-slate-600"
            aria-hidden="true"
          />

          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>
        </div>

        <span className="text-sm text-slate-500">
          {itemCount}{" "}
          {itemCount === 1
            ? "item"
            : "items"}
        </span>
      </div>

      <div className="mt-5 divide-y divide-slate-100">
        {items.map((item) => {
          const lineTotal =
            item.lineTotal ??
            item.unitPrice * item.quantity;

          return (
            <div
              key={item.id}
              className="flex gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4"
            >
              <ProductImage
                src={item.imageUrl}
                alt={item.productName}
                aspectRatio="square"
                className="h-16 w-16 shrink-0 rounded-xl sm:h-20 sm:w-20"
                imageClassName="rounded-xl"
              />

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-900">
                  {item.productName}
                </h3>

                {showSku && item.sku && (
                  <p className="mt-1 text-xs text-slate-400">
                    SKU: {item.sku}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>
                    Quantity: {item.quantity}
                  </span>

                  <span>
                    Unit price:{" "}
                    {formatAmount(
                      item.unitPrice,
                      currency,
                    )}
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-slate-900">
                  {formatAmount(
                    lineTotal,
                    currency,
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
