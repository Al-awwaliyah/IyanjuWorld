import {
  CheckCircle2,
  Circle,
  Clock3,
  Package,
  Truck,
  XCircle,
} from "lucide-react";

export interface OrderTimelineItem {
  id: string;
  status: string;
  label?: string;
  description?: string | null;
  createdAt?: string | null;
  completed?: boolean;
  current?: boolean;
}

export interface OrderTimelineProps {
  items?: OrderTimelineItem[];
  events?: OrderTimelineItem[];
  className?: string;
  showDates?: boolean;
}

const statusIcons: Record<
  string,
  typeof Circle
> = {
  pending_payment: Clock3,
  paid: CheckCircle2,
  business_confirmed: CheckCircle2,
  delivery_requested: Truck,
  rider_assigned: Truck,
  picked_up: Package,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  completed: CheckCircle2,
  cancelled: XCircle,
  refund_pending: Clock3,
  refunded: CheckCircle2,
  disputed: Clock3,
};

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function OrderTimeline({
  items: providedItems,
  events,
  className = "",
  showDates = true,
}: OrderTimelineProps) {
  const items = providedItems ?? events ?? [];
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
        <p className="text-sm text-slate-500">
          No order activity has been recorded yet.
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
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">
          Order Timeline
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Track the progress of your order.
        </p>
      </div>

      <ol className="relative">
        {items.map((item, index) => {
          const Icon =
            statusIcons[item.status] || Circle;

          const isLast =
            index === items.length - 1;

          const isComplete =
            item.completed ||
            (!item.current && !isLast);

          const isCurrent =
            item.current || isLast;

          return (
            <li
              key={item.id}
              className={[
                "relative flex gap-4",
                !isLast ? "pb-7" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {!isLast && (
                <span
                  className={[
                    "absolute left-[15px] top-8 h-[calc(100%-8px)] w-px",
                    isComplete
                      ? "bg-slate-300"
                      : "bg-slate-200",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}

              <div
                className={[
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                  isCurrent
                    ? "border-slate-900 bg-ink-900 text-white"
                    : isComplete
                      ? "border-slate-300 bg-slate-100 text-slate-700"
                      : "border-slate-200 bg-white text-slate-400",
                ].join(" ")}
              >
                <Icon
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <h3
                    className={[
                      "text-sm font-semibold",
                      isCurrent
                        ? "text-slate-900"
                        : "text-slate-700",
                    ].join(" ")}
                  >
                    {item.label ||
                      formatStatus(item.status)}
                  </h3>

                  {showDates &&
                    item.createdAt && (
                      <time className="text-xs text-slate-400">
                        {formatDate(
                          item.createdAt,
                        )}
                      </time>
                    )}
                </div>

                {item.description && (
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {item.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
