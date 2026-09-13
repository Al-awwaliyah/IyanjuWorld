import { MapPin, Truck } from "lucide-react";
import Spinner from "../ui/Spinner";

export interface DeliveryFeeProps {
  fee: number;
  currency?: string;
  zoneName?: string | null;
  distanceKm?: number | null;
  loading?: boolean;
  calculated?: boolean;
  message?: string | null;
  className?: string;
}

function formatCurrency(
  amount: number,
  currency = "NGN",
) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DeliveryFee({
  fee,
  currency = "NGN",
  zoneName,
  distanceKm,
  loading = false,
  calculated = false,
  message,
  className = "",
}: DeliveryFeeProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Truck
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Delivery Fee
            </h2>

            {loading ? (
              <Spinner
                size="sm"
                label="Calculating delivery fee"
              />
            ) : calculated ? (
              <span className="text-base font-bold text-slate-900">
                {formatCurrency(fee, currency)}
              </span>
            ) : (
              <span className="text-sm font-medium text-slate-500">
                Not calculated
              </span>
            )}
          </div>

          {calculated && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {zoneName && (
                <span className="inline-flex items-center gap-1">
                  <MapPin
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  {zoneName}
                </span>
              )}

              {distanceKm !== null &&
                distanceKm !== undefined && (
                  <span>
                    {distanceKm.toFixed(1)} km
                  </span>
                )}
            </div>
          )}

          {message && (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
