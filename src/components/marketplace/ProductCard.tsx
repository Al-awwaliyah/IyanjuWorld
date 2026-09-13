import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import type { ReactNode } from "react";
import Badge from "../ui/Badge";

export interface ProductCardProps {
  id?: string;
  product?: ProductCardProps;
  name: string;
  slug: string;
  businessName: string;
  businessSlug?: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  categoryName?: string | null;
  available?: boolean;
  stock?: number | null;
  featured?: boolean;
  currency?: string;
  onAddToCart?: () => void;
  addingToCart?: boolean;
  actionIcon?: ReactNode;
  className?: string;
}

function formatPrice(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProductCard(props: ProductCardProps) {
  const source = props.product ?? props;
  const {
    product: _product,
    name,
    slug,
    businessName,
    businessSlug,
    price,
    compareAtPrice,
    imageUrl,
    categoryName,
    available = true,
    stock,
    featured = false,
    currency = "NGN",
    onAddToCart,
    addingToCart = false,
    actionIcon,
    className = "",
  } = source;
  const isOutOfStock =
    available === false || (stock !== null && stock !== undefined && stock <= 0);

  const hasDiscount =
    compareAtPrice !== null &&
    compareAtPrice !== undefined &&
    compareAtPrice > price;

  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice as number) - price) / (compareAtPrice as number) * 100)
    : null;

  return (
    <article
      className={[
        "group overflow-hidden rounded-md border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link
        to={`/products/${slug}`}
        className="block"
        aria-label={`View ${name}`}
      >
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ShoppingCart className="h-10 w-10" />
            </div>
          )}

          <div className="absolute left-0 top-0 flex flex-col items-start gap-1">
            {discountPercent !== null && discountPercent > 0 && (
              <span className="rounded-br-md bg-brand-500 px-2 py-1 text-[11px] font-bold text-white">
                -{discountPercent}%
              </span>
            )}

            {featured && (
              <Badge variant="info" size="sm" className="ml-1 mt-1">
                Featured
              </Badge>
            )}
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
                Out of stock
              </span>
            </div>
          )}

          {actionIcon && (
            <div className="absolute right-2 top-2">{actionIcon}</div>
          )}
        </div>
      </Link>

      <div className="p-3">
        {categoryName && (
          <p className="mb-1 truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {categoryName}
          </p>
        )}

        <Link to={`/products/${slug}`} className="block">
          <h3 className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-800 transition-colors group-hover:text-brand-600">
            {name}
          </h3>
        </Link>

        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-base font-bold text-ink-900">
            {formatPrice(price, currency)}
          </p>

          {hasDiscount && (
            <p className="text-xs text-slate-400 line-through">
              {formatPrice(compareAtPrice, currency)}
            </p>
          )}
        </div>

        <div className="mt-1">
          {businessSlug ? (
            <Link
              to={`/businesses/${businessSlug}`}
              className="block truncate text-xs text-slate-500 hover:text-brand-600 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {businessName}
            </Link>
          ) : (
            <p className="truncate text-xs text-slate-500">{businessName}</p>
          )}
        </div>

        {onAddToCart && (
          <button
            type="button"
            disabled={isOutOfStock || addingToCart}
            aria-label={`Add ${name} to cart`}
            onClick={onAddToCart}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-brand-500 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-500 hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {addingToCart ? "Adding..." : "Add to cart"}
          </button>
        )}
      </div>
    </article>
  );
}
