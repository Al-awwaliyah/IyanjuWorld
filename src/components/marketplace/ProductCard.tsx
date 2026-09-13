import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import type { ReactNode } from "react";
import Button from "../ui/Button";
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

function formatPrice(
  amount: number,
  currency = "NGN",
) {
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

  return (
    <article
      className={[
        "group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
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
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <ShoppingCart className="h-10 w-10" />
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {featured && (
              <Badge variant="info" size="sm">
                Featured
              </Badge>
            )}

            {hasDiscount && (
              <Badge variant="danger" size="sm">
                Sale
              </Badge>
            )}

            {isOutOfStock && (
              <Badge variant="neutral" size="sm">
                Out of stock
              </Badge>
            )}
          </div>

          {actionIcon && (
            <div className="absolute right-3 top-3">
              {actionIcon}
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {categoryName && (
          <p className="mb-1 truncate text-xs font-medium text-slate-400">
            {categoryName}
          </p>
        )}

        <Link
          to={`/products/${slug}`}
          className="block"
        >
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900 transition-colors group-hover:text-slate-700">
            {name}
          </h3>
        </Link>

        <div className="mt-2">
          {businessSlug ? (
            <Link
              to={`/businesses/${businessSlug}`}
              className="block truncate text-xs text-slate-500 hover:text-slate-900 hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {businessName}
            </Link>
          ) : (
            <p className="truncate text-xs text-slate-500">
              {businessName}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold text-slate-900">
              {formatPrice(price, currency)}
            </p>

            {hasDiscount && (
              <p className="mt-0.5 text-xs text-slate-400 line-through">
                {formatPrice(compareAtPrice, currency)}
              </p>
            )}
          </div>

          {onAddToCart && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={addingToCart}
              disabled={isOutOfStock}
              aria-label={`Add ${name} to cart`}
              onClick={onAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">
                Add
              </span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
