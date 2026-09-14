import { useMemo, useState } from "react";
import { Grid2X2, List, Search as SearchIcon, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { useMarketplaceProducts, useMarketplaceCategories, useMarketplaceBusinesses, useMarketplaceProduct, useMarketplaceBusiness } from "../../services/marketplace";
import PageContainer from "../../components/layout/PageContainer";
import ProductGrid from "../../components/marketplace/ProductGrid";
import MarketplaceFilters from "../../components/marketplace/MarketplaceFilters";
import BusinessCard from "../../components/marketplace/BusinessCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

type SearchProduct = {
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

type SearchBusiness = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  category: string;
  city: string;
  state: string;
  verified: boolean;
  open: boolean;
  productCount: number;
};


const states = [
  { value: "", label: "All locations" },
  { value: "Lagos", label: "Lagos" },
  { value: "Oyo", label: "Oyo" },
  { value: "Osun", label: "Osun" },
  { value: "Ondo", label: "Ondo" },
];

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to high" },
  { value: "price-high", label: "Price: High to low" },
  { value: "name", label: "Name" },
];

export default function Search() {
  const { products, loading: productsLoading } = useMarketplaceProducts({ limit: 1000 });
  const { businesses, loading: businessesLoading } = useMarketplaceBusinesses();
  const { categories } = useMarketplaceCategories();

  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(
    searchParams.get("category") ?? "",
  );
  const [state, setState] = useState(
    searchParams.get("state") ?? "",
  );
  const [sort, setSort] = useState(
    searchParams.get("sort") ?? "relevance",
  );
  const [availableOnly, setAvailableOnly] = useState(true);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const searchableText = [
        product.name,
        product.businessName,
        product.category,
        product.city,
        product.state,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !normalizedQuery ||
        searchableText.includes(normalizedQuery);

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
        matchesQuery &&
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

        case "featured":
          return Number(b.featured) - Number(a.featured);

        case "relevance":
        default: {
          if (!normalizedQuery) {
            return Number(b.featured) - Number(a.featured);
          }

          const score = (product: SearchProduct) => {
            const name = product.name.toLowerCase();
            const business =
              product.businessName.toLowerCase();
            const productCategory =
              product.category.toLowerCase();

            let value = 0;

            if (name === normalizedQuery) value += 100;
            if (name.startsWith(normalizedQuery)) value += 60;
            if (name.includes(normalizedQuery)) value += 40;
            if (business.includes(normalizedQuery)) value += 25;
            if (productCategory.includes(normalizedQuery))
              value += 15;
            if (product.featured) value += 5;

            return value;
          };

          return score(b) - score(a);
        }
      }
    });
  }, [
    normalizedQuery,
    category,
    state,
    sort,
    availableOnly,
    featuredOnly,
  ]);

  const filteredBusinesses = useMemo(() => {
    if (!normalizedQuery && !category && !state) {
      return [];
    }

    return businesses.filter((business) => {
      const searchableText = [
        business.name,
        business.description,
        business.category,
        business.city,
        business.state,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !normalizedQuery ||
        searchableText.includes(normalizedQuery);

      const matchesCategory =
        !category ||
        business.category.toLowerCase() ===
          categories
            .find((item) => item.value === category)
            ?.label.toLowerCase();

      const matchesState =
        !state ||
        business.state === state;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesState
      );
    });
  }, [normalizedQuery, category, state]);

  const updateSearchUrl = (
    nextQuery: string,
    nextCategory = category,
    nextState = state,
    nextSort = sort,
  ) => {
    const params = new URLSearchParams();

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    }

    if (nextCategory) {
      params.set("category", nextCategory);
    }

    if (nextState) {
      params.set("state", nextState);
    }

    if (nextSort && nextSort !== "relevance") {
      params.set("sort", nextSort);
    }

    setSearchParams(params);
  };

  const handleSearch = () => {
    updateSearchUrl(query);
  };

  const clearSearch = () => {
    setQuery("");
    setCategory("");
    setState("");
    setSort("relevance");
    setAvailableOnly(true);
    setFeaturedOnly(false);
    setSearchParams({});
  };

  const removeQuery = () => {
    setQuery("");
    updateSearchUrl("", category, state, sort);
  };

  const hasActiveFilters =
    Boolean(normalizedQuery) ||
    Boolean(category) ||
    Boolean(state) ||
    sort !== "relevance" ||
    !availableOnly ||
    featuredOnly;

  const totalResults =
    filteredProducts.length +
    filteredBusinesses.length;

  return (
    <PageContainer>
      <div className="space-y-8 pb-16">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="max-w-3xl">
            <Badge variant="info">
              IyanjuWorld Search
            </Badge>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Search the marketplace
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              Search products, businesses, categories and
              locations across IyanjuWorld.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
            className="mt-6 flex max-w-4xl flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="What are you looking for?"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                aria-label="Search marketplace"
              />

              {query && (
                <button
                  type="button"
                  onClick={removeQuery}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label="Clear search query"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button type="submit" size="lg">
              Search
            </Button>
          </form>
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
              onCategoryChange={(value) => {
                setCategory(value);
                updateSearchUrl(
                  query,
                  value,
                  state,
                  sort,
                );
              }}
              onStateChange={(value) => {
                setState(value);
                updateSearchUrl(
                  query,
                  category,
                  value,
                  sort,
                );
              }}
              onAvailableChange={setAvailableOnly}
              onFeaturedChange={setFeaturedOnly}
              onReset={clearSearch}
            />
          </aside>

          <div className="min-w-0 space-y-8">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {normalizedQuery
                    ? `Results for "${query.trim()}"`
                    : "Marketplace results"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {totalResults}{" "}
                  {totalResults === 1
                    ? "result"
                    : "results"}{" "}
                  found
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={sort}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSort(value);
                    updateSearchUrl(
                      query,
                      category,
                      state,
                      value,
                    );
                  }}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-50"
                  aria-label="Sort search results"
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

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {query.trim() && (
                  <FilterChip
                    label={`Search: ${query.trim()}`}
                    onRemove={removeQuery}
                  />
                )}

                {category && (
                  <FilterChip
                    label={
                      categories.find(
                        (item) =>
                          item.value === category,
                      )?.label ?? category
                    }
                    onRemove={() => {
                      setCategory("");
                      updateSearchUrl(
                        query,
                        "",
                        state,
                        sort,
                      );
                    }}
                  />
                )}

                {state && (
                  <FilterChip
                    label={state}
                    onRemove={() => {
                      setState("");
                      updateSearchUrl(
                        query,
                        category,
                        "",
                        sort,
                      );
                    }}
                  />
                )}

                {featuredOnly && (
                  <FilterChip
                    label="Featured"
                    onRemove={() =>
                      setFeaturedOnly(false)
                    }
                  />
                )}

                {!availableOnly && (
                  <FilterChip
                    label="Including unavailable"
                    onRemove={() =>
                      setAvailableOnly(true)
                    }
                  />
                )}

                <button
                  type="button"
                  onClick={clearSearch}
                  className="ml-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Clear all
                </button>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">
                      Products
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Products are shown first so customers
                      can shop directly.
                    </p>
                  </div>

                  <Link
                    to="/products"
                    className="hidden text-sm font-semibold text-brand-600 hover:text-brand-700 sm:block"
                  >
                    Browse all
                  </Link>
                </div>

                {view === "grid" ? (
                  <ProductGrid
                    products={filteredProducts}
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredProducts.map((product) => (
                      <SearchProductListItem
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {filteredBusinesses.length > 0 && (
              <section>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-950">
                    Businesses
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Businesses matching your search.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {filteredBusinesses.map((business) => (
                    <BusinessResultCard
                      key={business.id}
                      business={business}
                    />
                  ))}
                </div>
              </section>
            )}

            {filteredProducts.length === 0 &&
              filteredBusinesses.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white py-12">
                  <EmptyState
                    title="No matching results"
                    description="Try a different product name, business, category or location."
                    action={
                      <Button
                        variant="outline"
                        onClick={clearSearch}
                      >
                        Clear search
                      </Button>
                    }
                  />
                </div>
              )}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span>{label}</span>
      <X className="h-3.5 w-3.5 text-slate-400" />
    </button>
  );
}

function SearchProductListItem({
  product,
}: {
  product: SearchProduct;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          to={`/products/${product.id}`}
          className="h-32 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-32"
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

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="neutral">
              {product.category}
            </Badge>

            <Badge
              variant={
                product.available
                  ? "success"
                  : "danger"
              }
            >
              {product.available
                ? "In stock"
                : "Unavailable"}
            </Badge>

            {product.featured && (
              <Badge variant="info">
                Featured
              </Badge>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {product.city}, {product.state}
            </p>

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

function BusinessResultCard({
  business,
}: {
  business: SearchBusiness;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300">
      <div className="flex gap-4">
        <img
          src={business.logoUrl}
          alt={business.name}
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link
                to={`/businesses/${business.slug}`}
                className="font-semibold text-slate-900 hover:text-brand-600"
              >
                {business.name}
              </Link>

              <p className="mt-1 text-xs text-slate-500">
                {business.city}, {business.state}
              </p>
            </div>

            {business.verified && (
              <Badge variant="success">
                Verified
              </Badge>
            )}
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
            {business.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{business.category}</span>
              <span>•</span>
              <span>
                {business.productCount} products
              </span>
            </div>

            <Link to={`/businesses/${business.slug}`}>
              <Button
                variant="outline"
                size="sm"
              >
                Visit store
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
