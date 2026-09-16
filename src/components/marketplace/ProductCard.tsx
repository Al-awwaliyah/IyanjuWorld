import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import Badge from "../ui/Badge";
import { getAuthState } from "../../libs/auth";
import { addToCart, getOrCreateActiveCart } from "../../libs/db";

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
  const navigate = useNavigate();
  const [localAdding, setLocalAdding] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
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

  async function handleCartClick() {
    if (isOutOfStock || localAdding) return;

    setLocalAdding(true);
    setLocalMessage("");

    try {
      const auth = await getAuthState();
      if (!auth.user || !auth.profile || auth.profile.role !== "customer") {
        navigate("/login", { state: { from: `/products/${slug}` } });
        return;
      }

      const cart = await getOrCreateActiveCart(auth.user.id);
      const cartId = typeof cart === "string" ? cart : (cart as { id?: string } | null)?.id;
      if (!cartId) throw new Error("Unable to create your shopping cart.");

      await addToCart(cartId, String(id), 1);
      setLocalMessage("Added to cart");
      window.setTimeout(() => setLocalMessage(""), 1800);
    } catch (error) {
      console.error("ProductCard: add to cart failed", error);
      setLocalMessage("Could not add to cart");
    } finally {
      setLocalAdding(false);
    }
  }

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
              <span className="rounded-full bg-ink-900/80 px-3 py-1 text-xs font-semibold text-white dark-surface">
                Out of stock
              </span>
            </div>
          )}

          <button
            type="button"
            disabled={isOutOfStock || localAdding}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void handleCartClick();
            }}
            aria-label={`Add ${name} to cart`}
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600 shadow-md ring-1 ring-slate-200 transition hover:bg-brand-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>

          {actionIcon && (
            <div className="absolute right-2 top-12">{actionIcon}</div>
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

        <button
          type="button"
          disabled={isOutOfStock || addingToCart || localAdding}
          aria-label={`Add ${name} to cart`}
          onClick={() => void (onAddToCart ? onAddToCart() : handleCartClick())}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-brand-500 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-500 hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {addingToCart || localAdding ? "Adding..." : "Add to cart"}
        </button>
        {localMessage && (
          <p className={`mt-1 text-center text-[11px] font-medium ${localMessage === "Added to cart" ? "text-emerald-600" : "text-red-600"}`}>
            {localMessage}
          </p>
        )}
      </div>
    </article>
  );
}
