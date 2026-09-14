import { useMemo, useState } from "react";
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
import { Link, useParams } from "react-router-dom";

import PageContainer from "../../components/layout/PageContainer";
import ProductGrid from "../../components/marketplace/ProductGrid";
import ProductPrice from "../../components/marketplace/ProductPrice";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

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

const productCatalog: Product[] = [
  {
    id: "product-001",
    name: "Premium Ankara Fabric",
    slug: "premium-ankara-fabric",
    price: 18500,
    compareAtPrice: 22000,
    description:
      "Premium-quality Ankara fabric suitable for native wear, dresses, family outfits and special occasions. The fabric is carefully selected for customers looking for durable material and vibrant patterns.",
    imageUrl: "/images/products/ankara.jpg",
    images: [
      "/images/products/ankara.jpg",
      "/images/products/ankara-2.jpg",
      "/images/products/ankara-3.jpg",
    ],
    businessName: "Aderonke Fabrics",
    businessSlug: "aderonke-fabrics",
    businessId: "business-001",
    category: "Fashion",
    categorySlug: "fashion",
    city: "Ibadan",
    state: "Oyo",
    stock: 18,
    available: true,
    featured: true,
    verifiedBusiness: true,
  },
  {
    id: "product-002",
    name: "Wireless Bluetooth Headset",
    slug: "wireless-bluetooth-headset",
    price: 12500,
    compareAtPrice: 15000,
    description:
      "A compact wireless Bluetooth headset designed for calls, music and everyday use. Comfortable, portable and suitable for customers who need dependable wireless audio.",
    imageUrl: "/images/products/headset.jpg",
    images: [
      "/images/products/headset.jpg",
      "/images/products/headset-2.jpg",
    ],
    businessName: "TechPoint Store",
    businessSlug: "techpoint-store",
    businessId: "business-002",
    category: "Electronics",
    categorySlug: "electronics",
    city: "Ibadan",
    state: "Oyo",
    stock: 25,
    available: true,
    featured: true,
    verifiedBusiness: true,
  },
  {
    id: "product-003",
    name: "Ladies Leather Handbag",
    slug: "ladies-leather-handbag",
    price: 28000,
    compareAtPrice: 32000,
    description:
      "Stylish leather handbag designed for everyday use, work, outings and special occasions. Spacious enough for essential personal items while maintaining a clean and elegant appearance.",
    imageUrl: "/images/products/handbag.jpg",
    images: [
      "/images/products/handbag.jpg",
      "/images/products/handbag-2.jpg",
    ],
    businessName: "Elegance Collections",
    businessSlug: "elegance-collections",
    businessId: "business-003",
    category: "Fashion",
    categorySlug: "fashion",
    city: "Osogbo",
    state: "Osun",
    stock: 9,
    available: true,
    featured: true,
    verifiedBusiness: true,
  },
  {
    id: "product-004",
    name: "Organic Black Soap",
    slug: "organic-black-soap",
    price: 6500,
    compareAtPrice: 8000,
    description:
      "Naturally inspired black soap prepared for everyday personal-care routines. A simple option for customers looking for locally produced personal-care products.",
    imageUrl: "/images/products/black-soap.jpg",
    images: [
      "/images/products/black-soap.jpg",
      "/images/products/black-soap-2.jpg",
    ],
    businessName: "PureGlow Naturals",
    businessSlug: "pureglow-naturals",
    businessId: "business-004",
    category: "Beauty & Personal Care",
    categorySlug: "beauty-personal-care",
    city: "Akure",
    state: "Ondo",
    stock: 32,
    available: true,
    featured: true,
    verifiedBusiness: true,
  },
];

const relatedProducts = [
  {
    id: "product-005",
    name: "Classic Sneakers",
    slug: "classic-sneakers",
    price: 24000,
    compareAtPrice: null,
    imageUrl: "/images/products/sneakers.jpg",
    businessName: "Urban Steps",
    businessSlug: "urban-steps",
    stock: 14,
    available: true,
    featured: false,
  },
  {
    id: "product-007",
    name: "Men's Native Wear",
    slug: "mens-native-wear",
    price: 35000,
    compareAtPrice: 40000,
    imageUrl: "/images/products/native-wear.jpg",
    businessName: "Royal Stitch",
    businessSlug: "royal-stitch",
    stock: 7,
    available: true,
    featured: false,
  },
  {
    id: "product-012",
    name: "Men's Leather Belt",
    slug: "mens-leather-belt",
    price: 7500,
    compareAtPrice: null,
    imageUrl: "/images/products/leather-belt.jpg",
    businessName: "Gentleman's Hub",
    businessSlug: "gentlemans-hub",
    stock: 30,
    available: true,
    featured: false,
  },
];

function findProduct(productId?: string) {
  if (!productId) {
    return productCatalog[0];
  }

  return (
    productCatalog.find(
      (product) =>
        product.id === productId ||
        product.slug === productId,
    ) ?? productCatalog[0]
  );
}

export default function ProductDetails() {
  const { productId } = useParams();
  const product = findProduct(productId);

  const [selectedImage, setSelectedImage] = useState(
    product.imageUrl,
  );
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  const total = useMemo(
    () => product.price * quantity,
    [product.price, quantity],
  );

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

  const handleAddToCart = () => {
    setMessage(
      "This product will be added to your cart after customer authentication is connected.",
    );
  };

  const handleBuyNow = () => {
    setMessage(
      "Buy Now will continue to customer authentication and checkout once the transactional flow is connected.",
    );
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
                onClick={handleAddToCart}
                disabled={!product.available || product.stock < 1}
                fullWidth
              >
                <ShoppingCart className="h-5 w-5" />
                Add to cart
              </Button>

              <Button
                size="lg"
                variant="brand-outline"
                onClick={handleBuyNow}
                disabled={!product.available || product.stock < 1}
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

          <ProductGrid products={relatedProducts} />
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
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
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
