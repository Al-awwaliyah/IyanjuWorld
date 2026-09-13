import { formatNaira, formatPercentage } from "../../libs/format";

export interface ProductPriceProps {
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  discountPercentage?: number | null;
  size?: "sm" | "md" | "lg";
  showDiscount?: boolean;
  className?: string;
}

function formatPrice(amount: number, currency: string) {
  if (currency === "NGN") {
    return formatNaira(amount);
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateDiscountPercentage(
  price: number,
  compareAtPrice?: number | null,
) {
  if (
    compareAtPrice === null ||
    compareAtPrice === undefined ||
    compareAtPrice <= price ||
    compareAtPrice <= 0
  ) {
    return null;
  }

  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

const sizeStyles = {
  sm: {
    price: "text-sm",
    compare: "text-xs",
    discount: "text-[11px]",
  },
  md: {
    price: "text-base",
    compare: "text-sm",
    discount: "text-xs",
  },
  lg: {
    price: "text-xl",
    compare: "text-sm",
    discount: "text-xs",
  },
};

export default function ProductPrice({
  price,
  compareAtPrice,
  currency = "NGN",
  discountPercentage,
  size = "md",
  showDiscount = true,
  className = "",
}: ProductPriceProps) {
  const calculatedDiscount = calculateDiscountPercentage(
    price,
    compareAtPrice,
  );

  const resolvedDiscount =
    discountPercentage !== null &&
    discountPercentage !== undefined &&
    discountPercentage > 0
      ? discountPercentage
      : calculatedDiscount;

  const hasDiscount =
    compareAtPrice !== null &&
    compareAtPrice !== undefined &&
    compareAtPrice > price;

  const styles = sizeStyles[size];

  return (
    <div
      className={[
        "flex flex-wrap items-baseline gap-x-2 gap-y-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={`${styles.price} font-bold text-slate-900`}
      >
        {formatPrice(price, currency)}
      </span>

      {hasDiscount && (
        <span
          className={`${styles.compare} text-slate-400 line-through`}
        >
          {formatPrice(compareAtPrice, currency)}
        </span>
      )}

      {showDiscount &&
        hasDiscount &&
        resolvedDiscount !== null &&
        resolvedDiscount > 0 && (
          <span
            className={`${styles.discount} font-semibold text-emerald-600`}
          >
            {formatPercentage(resolvedDiscount)}
          </span>
        )}
    </div>
  );
}
