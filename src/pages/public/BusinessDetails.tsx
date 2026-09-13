import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Grid2X2,
  List,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShoppingBag,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import PageContainer from "../../components/layout/PageContainer";
import ProductGrid from "../../components/marketplace/ProductGrid";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string;
  businessName: string;
  businessSlug: string;
  category: string;
  categorySlug: string;
  stock: number;
  available: boolean;
  featured: boolean;
};

type Business = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  coverImage: string;
  description: string;
  category: string;
  categorySlug: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  verified: boolean;
  open: boolean;
  productCount: number;
  products: StoreProduct[];
};

const businessCatalog: Business[] = [
  {
    id: "business-001",
    name: "Aderonke Fabrics",
    slug: "aderonke-fabrics",
    logo: "/images/businesses/aderonke-fabrics.jpg",
    coverImage: "/images/businesses/aderonke-cover.jpg",
    description:
      "Aderonke Fabrics provides quality Ankara, lace and premium fabrics for customers looking for beautiful materials for everyday wear, events and special occasions.",
    category: "Fashion",
    categorySlug: "fashion",
    city: "Ibadan",
    state: "Oyo",
    country: "Nigeria",
    phone: "+234 801 234 5678",
    whatsapp: "+234 801 234 5678",
    email: "hello@aderonkefabrics.com",
    address: "Bodija, Ibadan, Oyo State",
    verified: true,
    open: true,
    productCount: 48,
    products: [
      {
        id: "product-001",
        name: "Premium Ankara Fabric",
        slug: "premium-ankara-fabric",
        price: 18500,
        compareAtPrice: 22000,
        imageUrl: "/images/products/ankara.jpg",
        businessName: "Aderonke Fabrics",
        businessSlug: "aderonke-fabrics",
        category: "Fashion",
        categorySlug: "fashion",
        stock: 18,
        available: true,
        featured: true,
      },
      {
        id: "store-product-002",
        name: "Premium Lace Fabric",
        slug: "premium-lace-fabric",
        price: 42000,
        compareAtPrice: 47000,
        imageUrl: "/images/products/lace.jpg",
        businessName: "Aderonke Fabrics",
        businessSlug: "aderonke-fabrics",
        category: "Fashion",
        categorySlug: "fashion",
        stock: 8,
        available: true,
        featured: true,
      },
      {
        id: "store-product-003",
        name: "Plain Senator Fabric",
        slug: "plain-senator-fabric",
        price: 28000,
        compareAtPrice: null,
        imageUrl: "/images/products/senator.jpg",
        businessName: "Aderonke Fabrics",
        businessSlug: "aderonke-fabrics",
        category: "Fashion",
        categorySlug: "fashion",
        stock: 15,
        available: true,
        featured: false,
      },
      {
        id: "store-product-004",
        name: "Traditional Print Fabric",
        slug: "traditional-print-fabric",
        price: 16000,
        compareAtPrice: 19000,
        imageUrl: "/images/products/traditional-print.jpg",
        businessName: "Aderonke Fabrics",
        businessSlug: "aderonke-fabrics",
        category: "Fashion",
        categorySlug: "fashion",
        stock: 24,
        available: true,
        featured: false,
      },
      {
        id: "store-product-005",
        name: "Premium Cotton Fabric",
        slug: "premium-cotton-fabric",
        price: 14500,
        compareAtPrice: null,
        imageUrl: "/images/products/cotton.jpg",
        businessName: "Aderonke Fabrics",
        businessSlug: "aderonke-fabrics",
        category: "Fashion",
        categorySlug: "fashion",
        stock: 20,
        available: true,
        featured: false,
      },
      {
        id: "store-product-006",
        name: "Event Collection Ankara",
        slug: "event-collection-ankara",
        price: 22000,
        compareAtPrice: 25000,
        imageUrl: "/images/products/event-ankara.jpg",
        businessName: "Aderonke Fabrics",
        businessSlug: "aderonke-fabrics",
        category: "Fashion",
        categorySlug: "fashion",
        stock: 12,
        available: true,
        featured: true,
      },
    ],
  },
  {
    id: "business-002",
    name: "TechPoint Store",
    slug: "techpoint-store",
    logo: "/images/businesses/techpoint.jpg",
    coverImage: "/images/businesses/techpoint-cover.jpg",
    description:
      "TechPoint Store provides phones, accessories and everyday technology products for customers across the marketplace.",
    category: "Electronics",
    categorySlug: "electronics",
    city: "Ibadan",
    state: "Oyo",
    country: "Nigeria",
    phone: "+234 802 345 6789",
    whatsapp: "+234 802 345 6789",
    email: "sales@techpointstore.com",
    address: "Ring Road, Ibadan, Oyo State",
    verified: true,
    open: true,
    productCount: 72,
    products: [
      {
        id: "product-002",
        name: "Wireless Bluetooth Headset",
        slug: "wireless-bluetooth-headset",
        price: 12500,
        compareAtPrice: 15000,
        imageUrl: "/images/products/headset.jpg",
        businessName: "TechPoint Store",
        businessSlug: "techpoint-store",
        category: "Electronics",
        categorySlug: "electronics",
        stock: 25,
        available: true,
        featured: true,
      },
      {
        id: "tech-product-002",
        name: "Fast Charging Adapter",
        slug: "fast-charging-adapter",
        price: 7500,
        compareAtPrice: 9000,
        imageUrl: "/images/products/charger.jpg",
        businessName: "TechPoint Store",
        businessSlug: "techpoint-store",
        category: "Electronics",
        categorySlug: "electronics",
        stock: 31,
        available: true,
        featured: false,
      },
      {
        id: "tech-product-003",
        name: "USB-C Cable",
        slug: "usb-c-cable",
        price: 4500,
        compareAtPrice: null,
        imageUrl: "/images/products/usb-c.jpg",
        businessName: "TechPoint Store",
        businessSlug: "techpoint-store",
        category: "Electronics",
        categorySlug: "electronics",
        stock: 45,
        available: true,
        featured: false,
      },
      {
        id: "tech-product-004",
        name: "Portable Power Bank",
        slug: "portable-power-bank",
        price: 18500,
        compareAtPrice: 21000,
        imageUrl: "/images/products/power-bank.jpg",
        businessName: "TechPoint Store",
        businessSlug: "techpoint-store",
        category: "Electronics",
        categorySlug: "electronics",
        stock: 16,
        available: true,
        featured: true,
      },
    ],
  },
  {
    id: "business-003",
    name: "Elegance Collections",
    slug: "elegance-collections",
    logo: "/images/businesses/elegance.jpg",
    coverImage: "/images/businesses/elegance-cover.jpg",
    description:
      "Elegance Collections offers handbags, fashion accessories and stylish everyday essentials.",
    category: "Fashion",
    categorySlug: "fashion",
    city: "Osogbo",
    state: "Osun",
    country: "Nigeria",
    phone: "+234 803 456 7890",
    whatsapp: "+234 803 456 7890",
    email: "hello@elegancecollections.com",
    address: "Oke-Fia, Osogbo, Osun State",
    verified: true,
    open: true,
    productCount: 36,
    products: [
      {
        id: "product-003",
        name: "Ladies Leather Handbag",
        slug: "ladies-leather-handbag",
        price: 28000,
        compareAtPrice: 32000,
        imageUrl: "/images/products/handbag.jpg",
        businessName: "Elegance Collections",
        businessSlug: "elegance-collections",
        category: "Fashion",
        categorySlug: "fashion",
        stock: 9,
        available: true,
        featured: true,
      },
      {
        id: "elegance-product-002",
        name: "Classic Shoulder Bag",
        slug: "classic-shoulder-bag",
        price: 22000,
        compareAtPrice: null,
        imageUrl: "/images/products/shoulder-bag.jpg",
        businessName: "Elegance Collections",
        businessSlug: "elegance-collections",
        category: "Fashion",
        categorySlug: "fashion",
        stock: 13,
        available: true,
        featured: false,
      },
      {
        id: "elegance-product-003",
        name: "Women's Purse",
        slug: "womens-purse",
        price: 9500,
        compareAtPrice: 12000,
        imageUrl: "/images/products/purse.jpg",
        businessName: "Elegance Collections",
        businessSlug: "elegance-collections",
        category: "Fashion",
        categorySlug: "fashion",
        stock: 18,
        available: true,
        featured: false,
      },
    ],
  },
];

function findBusiness(slug?: string) {
  if (!slug) {
    return businessCatalog[0];
  }

  return (
    businessCatalog.find(
      (business) => business.slug === slug,
    ) ?? businessCatalog[0]
  );
}

export default function BusinessDetails() {
  const { slug } = useParams();
  const business = findBusiness(slug);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [message, setMessage] = useState("");

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(
        business.products.map(
          (product) => product.category,
        ),
      ),
    );

    return [
      {
        value: "",
        label: "All products",
      },
      ...values.map((value) => ({
        value,
        label: value,
      })),
    ];
  }, [business.products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return business.products.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.name,
          product.category,
          business.name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        !category ||
        product.category === category;

      const matchesAvailability =
        !availableOnly || product.available;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability
      );
    });
  }, [
    business.name,
    business.products,
    search,
    category,
    availableOnly,
  ]);

  const featuredProducts = business.products.filter(
    (product) =>
      product.featured &&
      product.available,
  );

  const handleContact = (
    type: "call" | "whatsapp" | "chat",
  ) => {
    if (type === "call") {
      setMessage(
        `Call ${business.name} using the seller's verified business phone number.`,
      );
      return;
    }

    if (type === "whatsapp") {
      setMessage(
        `WhatsApp will open the verified WhatsApp contact for ${business.name}.`,
      );
      return;
    }

    setMessage(
      `Chat with ${business.name} will open through the marketplace messaging system after authentication.`,
    );
  };

  return (
    <PageContainer>
      <div className="space-y-8 pb-16">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="relative h-52 bg-slate-100 sm:h-64">
            <img
              src={business.coverImage}
              alt={business.name}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md sm:h-28 sm:w-28">
                  <img
                    src={business.logo}
                    alt={`${business.name} logo`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                      {business.name}
                    </h1>

                    {business.verified && (
                      <CheckCircle2 className="h-5 w-5 text-brand-600" />
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {business.verified && (
                      <Badge variant="success">
                        Verified business
                      </Badge>
                    )}

                    {business.open ? (
                      <Badge variant="info">
                        Open
                      </Badge>
                    ) : (
                      <Badge variant="neutral">
                        Closed
                      </Badge>
                    )}

                    <Badge variant="neutral">
                      {business.category}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleContact("call")}
                >
                  <Phone className="h-4 w-4" />
                  Call
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleContact("whatsapp")}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleContact("chat")}
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <p className="text-sm leading-7 text-slate-600">
                  {business.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {business.address}
                  </span>

                  <span>
                    {business.city}, {business.state}
                  </span>

                  <span>
                    {business.productCount} products
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Store information
                </p>

                <div className="mt-4 space-y-4">
                  <StoreInfo
                    label="Category"
                    value={business.category}
                  />

                  <StoreInfo
                    label="Location"
                    value={`${business.city}, ${business.state}`}
                  />

                  <StoreInfo
                    label="Products"
                    value={`${business.productCount} listed`}
                  />

                  <StoreInfo
                    label="Status"
                    value={
                      business.open
                        ? "Currently open"
                        : "Currently closed"
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
            <p className="text-sm leading-6 text-brand-800">
              {message}
            </p>
          </div>
        )}

        {featuredProducts.length > 0 && (
          <section>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                  From this store
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  Featured products
                </h2>
              </div>

              <span className="hidden text-sm text-slate-500 sm:block">
                {featuredProducts.length} featured
              </span>
            </div>

            <ProductGrid products={featuredProducts} />
          </section>
        )}

        <section>
          <div className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                All products
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Browse everything currently listed by {business.name}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search this store..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-50 sm:w-56"
                  aria-label="Search products in this store"
                />
              </div>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-50"
                aria-label="Filter store products by category"
              >
                {categories.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>

              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(event) =>
                    setAvailableOnly(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                Available only
              </label>

              <div className="flex rounded-lg border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                    view === "grid"
                      ? "bg-slate-900 text-white"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  aria-label="Grid view"
                >
                  <Grid2X2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                    view === "list"
                      ? "bg-slate-900 text-white"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-12">
              <EmptyState
                title="No products found"
                description="This store does not have products matching your current search or filters."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setCategory("");
                      setAvailableOnly(true);
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : view === "grid" ? (
            <ProductGrid products={filteredProducts} />
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <StoreProductListItem
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <StoreBenefit
              icon={CheckCircle2}
              title="Verified business"
              description="Business identity and marketplace status are managed through the platform."
            />

            <StoreBenefit
              icon={ShoppingBag}
              title="Buy directly"
              description="Choose products from this storefront and continue through the marketplace checkout."
            />

            <StoreBenefit
              icon={MapPin}
              title="Local delivery"
              description="Delivery fees are calculated separately based on the customer's delivery area."
            />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function StoreProductListItem({
  product,
}: {
  product: StoreProduct;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          to={`/products/${product.id}`}
          className="h-28 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-28"
        >
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                to={`/products/${product.id}`}
                className="text-base font-semibold text-slate-900 hover:text-brand-600"
              >
                {product.name}
              </Link>

              <div className="mt-2 flex flex-wrap gap-2">
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
            </div>

            <div className="sm:text-right">
              <p className="text-lg font-bold text-slate-950">
                ₦{product.price.toLocaleString("en-NG")}
              </p>

              {product.compareAtPrice && (
                <p className="text-xs text-slate-400 line-through">
                  ₦
                  {product.compareAtPrice.toLocaleString(
                    "en-NG",
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {product.stock} available
            </span>

            <Link to={`/products/${product.id}`}>
              <Button
                variant="outline"
                size="sm"
              >
                View product
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-medium text-slate-800">
        {value}
      </span>
    </div>
  );
}

function StoreBenefit({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
