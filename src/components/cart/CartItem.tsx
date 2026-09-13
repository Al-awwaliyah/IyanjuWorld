import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import ProductImage from "../marketplace/ProductImage";
import ProductPrice from "../marketplace/ProductPrice";

export interface CartItemProps {
  id: string;
  productId?: string | null;
  productSlug: string;
  productName: string;
  businessName: string;
  businessSlug?: string | null;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  compareAtPrice?: number | null;
  available?: boolean;
  stock?: number | null;
  onIncrease?: () => void;
  onDecrease?: () => void;
  onRemove?: () => void;
  updating?: boolean;
  removing?: boolean;
  className?: string;
}

export default function CartItem({
  productSlug,
  productName,
  businessName,
  businessSlug,
  imageUrl,
  quantity,
  unitPrice,
  compareAtPrice,
  available = true,
  stock,
  onIncrease,
  onDecrease,
  onRemove,
  updating = false,
  removing = false,
  className = "",
}: CartItemProps) {
  const isOutOfStock =
    available === false ||
    (stock !== null &&
      stock !== undefined &&
      stock <= 0);

  const cannotIncrease =
    isOutOfStock ||
    (stock !== null &&
      stock !== undefined &&
      quantity >= stock);

  const itemTotal = unitPrice * quantity;

  return (
    <article
      className={[
        "flex gap-4 border-b border-slate-200 py-4 last:border-b-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link
        to={`/products/${productSlug}`}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28"
        aria-label={`View ${productName}`}
      >
        <ProductImage
          src={imageUrl}
          alt={productName}
          aspectRatio="square"
          className="h-full w-full"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/products/${productSlug}`}
              className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-slate-600"
            >
              {productName}
            </Link>

            {businessSlug ? (
              <Link
                to={`/businesses/${businessSlug}`}
                className="mt-1 block truncate text-xs text-slate-500 hover:text-slate-900 hover:underline"
              >
                {businessName}
              </Link>
            ) : (
              <p className="mt-1 truncate text-xs text-slate-500">
                {businessName}
              </p>
            )}
          </div>

          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={removing}
              loading={removing}
              onClick={onRemove}
              aria-label={`Remove ${productName} from cart`}
              className="shrink-0 px-2 text-slate-400 hover:text-red-600"
            >
              {!removing && (
                <Trash2
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              )}
            </Button>
          )}
        </div>

        <div className="mt-2">
          <ProductPrice
            price={unitPrice}
            compareAtPrice={compareAtPrice}
            size="sm"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200"
            aria-label={`Quantity: ${quantity}`}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={
                updating ||
                quantity <= 1
              }
              onClick={onDecrease}
              aria-label={`Decrease quantity of ${productName}`}
              className="h-9 w-9 rounded-none px-0"
            >
              <Minus
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Button>

            <span className="flex h-9 min-w-10 items-center justify-center border-x border-slate-200 px-2 text-sm font-semibold text-slate-900">
              {quantity}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={
                updating ||
                cannotIncrease
              }
              onClick={onIncrease}
              aria-label={`Increase quantity of ${productName}`}
              className="h-9 w-9 rounded-none px-0"
            >
              <Plus
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Button>
          </div>

          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">
              <ProductPrice
                price={itemTotal}
                size="sm"
                showDiscount={false}
              />
            </p>

            {isOutOfStock && (
              <p className="mt-1 text-xs font-medium text-red-600">
                Currently unavailable
              </p>
            )}

            {!isOutOfStock &&
              stock !== null &&
              stock !== undefined &&
              stock > 0 &&
              stock <= 5 && (
                <p className="mt-1 text-xs font-medium text-amber-600">
                  Only {stock} left
                </p>
              )}
          </div>
        </div>
      </div>
    </article>
  );
}
