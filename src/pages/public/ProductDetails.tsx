import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShoppingCart,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useMarketplaceProducts, useMarketplaceCategories, useMarketplaceBusinesses, useMarketplaceProduct, useMarketplaceBusiness } from "../../services/marketplace";
import PageContainer from "../../components/layout/PageContainer";
import ProductGrid from "../../components/marketplace/ProductGrid";
import ProductPrice from "../../components/marketplace/ProductPrice";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { getAuthState } from "../../libs/auth";
import { addToCart, getOrCreateActiveCart } from "../../libs/db";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  description: string;
  imageUrl: string;
  images: string[];
  businessName: string;
  businessSlug: string;
  businessId: string;
  category: string;
  categorySlug: string;
  city: string;
  state: string;
  stock: number;
  available: boolean;
  featured: boolean;
  verifiedBusiness: boolean;
};


export default function ProductDetails() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { product, loading, error } = useMarketplaceProduct(productId);
  const { products: relatedProducts } = useMarketplaceProducts({
    categoryId: product?.categoryId,
    limit: 8,
  });

  const [selectedImage, setSelectedImage] = useState("");
  useEffect(() => {
    setSelectedImage(product?.imageUrl ?? "");
  }, [product?.imageUrl]);

  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  const total = useMemo(
    () => (product?.price ?? 0) * quantity,
    [product?.price, quantity],
  );


  if (loading) {
    return <PageContainer><div className="py-16 text-center text-slate-500">Loading product...</div></PageContainer>;
  }

  if (!product) {
    return <PageContainer><div className="py-16 text-center"><h1 className="text-2xl font-bold text-slate-900">Product not found</h1><p className="mt-2 text-slate-500">{error?.message ?? "This product is no longer available."}</p><Link to="/products" className="mt-6 inline-flex rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white dark-surface">Browse products</Link></div></PageContainer>;
  }


  const increaseQuantity = () => {
    setQuantity((current) =>
      Math.min(current + 1, product.stock),
    );
  };

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(current - 1, 1),
    );
  };

  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const ensureCart = async () => {
    const auth = await getAuthState();
    if (!auth.user || !auth.profile || auth.profile.role !== "customer") {
      navigate("/login", { state: { from: `/products/${product.slug}` } });
      return null;
    }

    const cart = await getOrCreateActiveCart(auth.user.id);
    const cartId = typeof cart === "string" ? cart : (cart as { id?: string } | null)?.id;
    if (!cartId) throw new Error("Unable to create your shopping cart.");
    return cartId;
  };

  const handleAddToCart = async () => {
    if (!product || addingToCart || buyingNow) return;
    setAddingToCart(true);
    setMessage("");
    try {
      const cartId = await ensureCart();
      if (!cartId) return;
      await addToCart(cartId, product.id, quantity);
      setMessage(`${quantity} ${product.name} ${quantity === 1 ? "has" : "have"} been added to your cart.`);
    } catch (error) {
      console.error("ProductDetails: add to cart failed", error);
      setMessage("We couldn't add this product to your cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || addingToCart || buyingNow) return;
    setBuyingNow(true);
    setMessage("");
    try {
      const cartId = await ensureCart();
      if (!cartId) return;
      await addToCart(cartId, product.id, quantity);
      navigate("/customer/checkout");
    } catch (error) {
      console.error("ProductDetails: buy now failed", error);
      setMessage("We couldn't start checkout for this product. Please try again.");
    } finally {
      setBuyingNow(false);
    }
  };

  const handleContact = (
    type: "call" | "whatsapp" | "chat",
  ) => {
    if (type === "call") {
      setMessage(
        "Business calling will use the seller's verified phone number.",
      );
      return;
    }

    if (type === "whatsapp") {
      setMessage(
        "WhatsApp will open the seller's verified business contact.",
      );
      return;
    }

    setMessage(
      "Chat will open the marketplace conversation with this business after authentication.",
    );
  };

  return (
    <PageContainer>
      <div className="space-y-10 pb-16">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            to="/explore"
            className="inline-flex items-center gap-1 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Explore
          </Link>

          <ChevronRight className="h-4 w-4 text-slate-300" />

          <span>{product.category}</span>

          <ChevronRight className="h-4 w-4 text-slate-300" />

          <span className="truncate text-slate-700">
            {product.name}
          </span>
        </div>

        {message && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
            <p className="text-sm leading-6 text-brand-800">
              {message}
            </p>
          </div>
        )}

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="aspect-square w-full sm:aspect-[4/3]">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`aspect-square overflow-hidden rounded-xl border-2 bg-slate-50 transition ${
                    selectedImage === image
                      ? "border-brand-600"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  aria-label={`View product image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">
                {product.category}
              </Badge>

              {product.featured && (
                <Badge variant="info">
                  Featured
                </Badge>
              )}

              {product.available ? (
                <Badge variant="success">
                  In stock
                </Badge>
              ) : (
                <Badge variant="danger">
                  Unavailable
                </Badge>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-5">
              <ProductPrice
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                size="lg"
              />
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              {product.description}
            </p>

            <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <UserRound className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/businesses/${product.businessSlug}`}
                  className="flex items-center gap-1 text-sm font-semibold text-slate-900 hover:text-brand-600"
                >
                  {product.businessName}

                  {product.verifiedBusiness && (
                    <CheckCircle2 className="h-4 w-4 text-brand-600" />
                  )}
                </Link>

                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {product.city}, {product.state}
                </div>
              </div>

              <Link to={`/businesses/${product.businessSlug}`}>
                <Button
                  variant="ghost"
                  size="sm"
                >
                  Store
                </Button>
              </Link>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Quantity
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {product.stock} available
                  </p>
                </div>

                <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="flex h-10 min-w-12 items-center justify-center border-x border-slate-200 px-3 text-sm font-semibold text-slate-900">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock}
                    className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm text-slate-500">
                  Product total
                </span>

                <span className="text-lg font-bold text-slate-950">
                  ₦{total.toLocaleString("en-NG")}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <Button
                size="lg"
                variant="brand"
                onClick={() => void handleAddToCart()}
                disabled={!product.available || product.stock < 1 || addingToCart || buyingNow}
                fullWidth
              >
                <ShoppingCart className="h-5 w-5" />
                Add to cart
              </Button>

              <Button
                size="lg"
                variant="brand-outline"
                onClick={() => void handleBuyNow()}
                disabled={!product.available || product.stock < 1 || addingToCart || buyingNow}
                fullWidth
              >
                Buy Now
              </Button>

              <button
                type="button"
                onClick={() => setSaved((value) => !value)}
                className={`flex h-12 items-center justify-center rounded-lg border px-4 transition ${
                  saved
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                }`}
                aria-label={
                  saved
                    ? "Remove from saved products"
                    : "Save product"
                }
              >
                <Heart
                  className={`h-5 w-5 ${
                    saved ? "fill-current" : ""
                  }`}
                />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <ContactAction
                icon={Phone}
                label="Call"
                onClick={() => handleContact("call")}
              />

              <ContactAction
                icon={MessageCircle}
                label="WhatsApp"
                onClick={() =>
                  handleContact("whatsapp")
                }
              />

              <ContactAction
                icon={MessageCircle}
                label="Chat"
                onClick={() => handleContact("chat")}
              />
            </div>

            <div className="mt-6 space-y-3">
              <InfoRow
                icon={Truck}
                title="Delivery"
                description="Delivery fee is calculated separately according to the delivery area."
              />

              <InfoRow
                icon={ShieldCheck}
                title="Secure marketplace"
                description="Payments are verified server-side before an order is considered paid."
              />

              <InfoRow
                icon={CheckCircle2}
                title="Verified seller"
                description="This seller has a verified marketplace business profile."
              />
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              About this product
            </h2>

            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>{product.description}</p>

              <p>
                Product availability, price and stock are controlled by
                the business. The information shown here represents the
                current marketplace listing and can change when the seller
                updates the product.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-950">
              Buying on IyanjuWorld
            </h2>

            <div className="mt-5 space-y-5">
              <BuyingStep
                number="1"
                title="Choose your quantity"
                description="Select the number of items you want."
              />

              <BuyingStep
                number="2"
                title="Add to cart or buy now"
                description="Continue to checkout when you are ready."
              />

              <BuyingStep
                number="3"
                title="Pay securely"
                description="Your payment is verified before the order proceeds."
              />

              <BuyingStep
                number="4"
                title="Receive your order"
                description="An eligible rider can deliver the paid order to you."
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                You may also like
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Related products
              </h2>
            </div>

            <Link
              to="/explore"
              className="hidden items-center gap-1 text-sm font-semibold text-brand-600 sm:flex"
            >
              Explore more
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <ProductGrid products={relatedProducts.filter((item) => item.id !== product.id)} />
        </section>
      </div>
    </PageContainer>
  );
}

function ContactAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Phone;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function InfoRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Truck;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function BuyingStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white dark-surface">
        {number}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
