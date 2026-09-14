import { useMemo, useState } from "react";
import {
  Grid2X2,
  List,
  MapPin,
  Search,
  ShoppingBag,
  Truck,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useMarketplaceProducts, useMarketplaceCategories, useMarketplaceBusinesses, useMarketplaceProduct, useMarketplaceBusiness } from "../../services/marketplace";
import PageContainer from "../../components/layout/PageContainer";
import ProductGrid from "../../components/marketplace/ProductGrid";
import MarketplaceFilters from "../../components/marketplace/MarketplaceFilters";
import ProductCard from "../../components/marketplace/ProductCard";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

type Product = {
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
  city: string;
  state: string;
  stock: number;
  available: boolean;
  featured: boolean;
};


const states = [
  {
    value: "",
    label: "All locations",
  },
  {
    value: "Lagos",
    label: "Lagos",
  },
  {
    value: "Oyo",
    label: "Oyo",
  },
  {
    value: "Osun",
    label: "Osun",
  },
  {
    value: "Ondo",
    label: "Ondo",
  },
];

const sortOptions = [
  {
    value: "featured",
    label: "Featured",
  },
  {
    value: "newest",
    label: "Newest",
  },
  {
    value: "price-low",
    label: "Price: Low to high",
  },
  {
    value: "price-high",
    label: "Price: High to low",
  },
  {
    value: "name",
    label: "Name",
  },
];

export default function Explore() {
  const { products, loading } = useMarketplaceProducts({ limit: 1000 });
  const { categories } = useMarketplaceCategories();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [sort, setSort] = useState("featured");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.name,
          product.businessName,
          product.category,
          product.city,
          product.state,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        !category ||
        product.categorySlug === category;

      const matchesState =
        !state ||
        product.state === state;

      const matchesAvailability =
        !availableOnly || product.available;

      const matchesFeatured =
        !featuredOnly || product.featured;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesState &&
        matchesAvailability &&
        matchesFeatured
      );
    });

    return [...result].sort((a, b) => {
      switch (sort) {
        case "price-low":
          return a.price - b.price;

        case "price-high":
          return b.price - a.price;

        case "name":
          return a.name.localeCompare(b.name);

        case "newest":
          return b.id.localeCompare(a.id);

        case "featured":
        default:
          return Number(b.featured) - Number(a.featured);
      }
    });
  }, [
    search,
    category,
    state,
    sort,
    availableOnly,
    featuredOnly,
  ]);

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setState("");
    setSort("featured");
    setAvailableOnly(true);
    setFeaturedOnly(false);
  };

  return (
    <PageContainer>
      <div className="space-y-8 pb-16">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="max-w-3xl">
            <Badge variant="info">
              IyanjuWorld Marketplace
            </Badge>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Explore products from local businesses
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              Search products, discover new businesses and find what you
              need without creating an account just to browse.
            </p>
          </div>

          <div className="mt-6 max-w-3xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products, stores, categories or locations..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                aria-label="Search marketplace"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              "Fashion",
              "Electronics",
              "Food & Groceries",
              "Beauty",
              "Phones",
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  const matching = categories.find(
                    (categoryItem) =>
                      categoryItem.label.toLowerCase() ===
                      item.toLowerCase(),
                  );

                  if (matching) {
                    setCategory(matching.value);
                  }
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <MarketplaceFilters
              categories={categories}
              states={states}
              category={category}
              state={state}
              availableOnly={availableOnly}
              featuredOnly={featuredOnly}
              onCategoryChange={setCategory}
              onStateChange={setState}
              onAvailableChange={setAvailableOnly}
              onFeaturedChange={setFeaturedOnly}
              onReset={resetFilters}
            />
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1
                    ? "product"
                    : "products"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Showing products currently available on the marketplace.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
                  <SlidersHorizontal className="h-4 w-4 text-slate-400" />

                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value)
                    }
                    className="bg-transparent text-sm text-slate-700 outline-none"
                    aria-label="Sort products"
                  >
                    {sortOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

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
                  description="Try a different search term or clear some of your filters."
                  action={
                    <Button
                      variant="outline"
                      onClick={resetFilters}
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
                  <ExploreListItem
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <ExploreBenefit
              icon={MapPin}
              title="Shop local"
              description="Discover products from businesses operating in your city and state."
            />

            <ExploreBenefit
              icon={ShoppingBag}
              title="Order directly"
              description="Choose the product you want and place your order with the business."
            />

            <ExploreBenefit
              icon={Truck}
              title="Get it delivered"
              description="Eligible paid orders can be connected with verified delivery riders."
            />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function ExploreListItem({
  product,
}: {
  product: Product;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          to={`/products/${product.id}`}
          className="block h-32 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-32"
        >
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                to={`/products/${product.id}`}
                className="text-base font-semibold text-slate-900 hover:text-brand-600"
              >
                {product.name}
              </Link>

              <Link
                to={`/businesses/${product.businessSlug}`}
                className="mt-1 block text-sm text-slate-500 hover:text-brand-600"
              >
                {product.businessName}
              </Link>
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

          <div className="mt-3 flex flex-wrap items-center gap-2">
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

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              {product.city}, {product.state}
            </div>

            <Link to={`/products/${product.id}`}>
              <Button size="sm" variant="outline">
                View product
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExploreBenefit({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof MapPin;
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
