import { Link } from "react-router-dom";
import { MessageCircle, ShoppingCart, Zap } from "lucide-react";
import Button from "../ui/Button";

export interface ProductActionsProps {
  productSlug: string;
  productName?: string;
  available?: boolean;
  stock?: number | null;
  onAddToCart?: () => void;
  onBuyNow?: () => void;
  onChat?: () => void;
  addingToCart?: boolean;
  buyingNow?: boolean;
  chatting?: boolean;
  showChat?: boolean;
  showBuyNow?: boolean;
  showAddToCart?: boolean;
  className?: string;
}

export default function ProductActions({
  productSlug,
  productName = "product",
  available = true,
  stock,
  onAddToCart,
  onBuyNow,
  onChat,
  addingToCart = false,
  buyingNow = false,
  chatting = false,
  showChat = false,
  showBuyNow = true,
  showAddToCart = true,
  className = "",
}: ProductActionsProps) {
  const isOutOfStock =
    available === false ||
    (stock !== null &&
      stock !== undefined &&
      stock <= 0);

  const disabled =
    isOutOfStock ||
    addingToCart ||
    buyingNow;

  return (
    <div
      className={[
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showAddToCart && onAddToCart && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={disabled}
          loading={addingToCart}
          onClick={onAddToCart}
          className="flex-1"
          aria-label={`Add ${productName} to cart`}
        >
          <ShoppingCart className="h-5 w-5" />
          Add to Cart
        </Button>
      )}

      {showBuyNow && onBuyNow ? (
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={disabled}
          loading={buyingNow}
          onClick={onBuyNow}
          className="flex-1"
          aria-label={`Buy ${productName} now`}
        >
          <Zap className="h-5 w-5" />
          Buy Now
        </Button>
      ) : (
        showBuyNow && (
          <Link
            to={`/products/${productSlug}`}
            className="flex-1"
          >
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={isOutOfStock}
              className="w-full"
              aria-label={`View ${productName}`}
            >
              View Product
            </Button>
          </Link>
        )
      )}

      {showChat && onChat && (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={chatting}
          loading={chatting}
          onClick={onChat}
          aria-label={`Chat about ${productName}`}
          className="sm:w-auto"
        >
          <MessageCircle className="h-5 w-5" />
          Chat
        </Button>
      )}

      {isOutOfStock && (
        <p className="w-full text-sm font-medium text-red-600">
          This product is currently unavailable.
        </p>
      )}
    </div>
  );
}
