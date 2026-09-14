import {
  ArrowRight,
  ChevronRight,
  Filter,
  Grid2X2,
  List,
  MapPin,
  PackageSearch,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useMarketplaceProducts, useMarketplaceCategories, useMarketplaceBusinesses, useMarketplaceProduct, useMarketplaceBusiness } from "../../services/marketplace";
import { PageContainer } from "../../components/layout/PageContainer";
import { MarketplaceFilters } from "../../components/marketplace/MarketplaceFilters";
import { ProductGrid } from "../../components/marketplace/ProductGrid";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";

type ViewMode = "grid" | "list";
type SortOption = "relevance" | "newest" | "price-low" | "price-high";

type CategoryInfo = {
  slug: string;
  name: string;
  description: string;
  productCount: number;
};

type CategoryProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  businessName: string;
  businessSlug: string;
  category: string;
  categorySlug: string;
  state: string;
  stock: number;
  available: boolean;
  featured: boolean;
};

const stateOptions = [
  "All states",
  "Lagos",
  "Oyo",
  "Osun",
  "Ogun",
  "Ondo",
  "Abuja",
];

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, loading: categoriesLoading } = useMarketplaceCategories();
  const { products, loading: productsLoading } = useMarketplaceProducts({ limit: 1000 });
  const category = categories.find((item) => item.slug === slug);

  const [search, setSearch] = useState("");
  const [state, setState] = useState("All states");
  const [availability, setAvailability] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);

  const categoryProducts = useMemo(() => {
    if (!category) {
      return [];
    }

    return products.filter(
      (product) => product.categorySlug === category.slug,
    );
  }, [category, products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = categoryProducts.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.businessName.toLowerCase().includes(query);

      const matchesState =
        state === "All states" || product.state === state;

      const matchesAvailability =
        availability === "all" ||
        (availability === "available" && product.available) ||
        (availability === "out-of-stock" && !product.available);

      const matchesFeatured = !featuredOnly || product.featured;

      return (
        matchesSearch &&
        matchesState &&
        matchesAvailability &&
        matchesFeatured
      );
    });

    return [...result].sort((a, b) => {
      if (sort === "price-low") {
        return a.price - b.price;
      }

      if (sort === "price-high") {
        return b.price - a.price;
      }

      if (sort === "newest") {
        return b.id.localeCompare(a.id);
      }

      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
  }, [
    categoryProducts,
    search,
    state,
    availability,
    featuredOnly,
    sort,
  ]);

  if (!category) {
    return (
      <div className="min-h-screen bg-white">
        <PageContainer className="py-16 sm:py-24">
          <EmptyState
            icon={<PackageSearch className="h-8 w-8" />}
            title="Category not found"
            description="The category you are looking for does not exist or may have been removed."
            actionLabel="Explore marketplace"
            actionHref="/explore"
          />
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-slate-200 bg-slate-50">
        <PageContainer className="py-8 sm:py-12">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-brand-600">
              Home
            </Link>

            <ChevronRight className="h-4 w-4" />

            <Link to="/explore" className="hover:text-brand-600">
              Explore
            </Link>

            <ChevronRight className="h-4 w-4" />

            <span className="font-medium text-slate-900">
              {category.name}
            </span>
          </nav>

          <div className="mt-8 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">{category.name}</Badge>
              <Badge variant="neutral">
                {category.productCount} products
              </Badge>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {category.name}
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-600">
              {category.description}
            </p>
          </div>

          <div className="mt-8 max-w-2xl">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${category.name.toLowerCase()}...`}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
        </PageContainer>
      </section>

      <PageContainer className="py-8 sm:py-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredProducts.length}
              </span>{" "}
              products in {category.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((value) => !value)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>

            <div className="hidden items-center rounded-lg border border-slate-200 bg-white p-1 sm:flex">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`rounded-md p-2 ${
                  viewMode === "grid"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Grid2X2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`rounded-md p-2 ${
                  viewMode === "list"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as SortOption)
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              aria-label="Sort products"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to high</option>
              <option value="price-high">Price: High to low</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-600" />
              <h2 className="font-semibold text-slate-900">
                Category filters
              </h2>
            </div>

            <MarketplaceFilters
              searchValue={search}
              onSearchChange={setSearch}
              categoryValue={category.slug}
              onCategoryChange={() => undefined}
              stateValue={state}
              onStateChange={setState}
              availabilityValue={availability}
              onAvailabilityChange={setAvailability}
              featuredOnly={featuredOnly}
              onFeaturedChange={setFeaturedOnly}
              categoryOptions={categories.map((item) => ({
                value: item.slug,
                label: item.name,
              }))}
              stateOptions={stateOptions.map((item) => ({
                value: item,
                label: item,
              }))}
            />
          </div>
        )}

        <div className="mt-8">
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="h-8 w-8" />}
              title="No products found"
              description={`There are no products matching your current filters in ${category.name}. Try changing your search or filters.`}
              actionLabel="Clear filters"
              onAction={() => {
                setSearch("");
                setState("All states");
                setAvailability("all");
                setFeaturedOnly(false);
                setSort("relevance");
              }}
            />
          ) : (
            <ProductGrid
              products={filteredProducts}
              viewMode={viewMode}
            />
          )}
        </div>
      </PageContainer>

      <section className="border-t border-slate-200 bg-slate-50">
        <PageContainer className="py-10">
          <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <MapPin className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Looking for more products?
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Explore the wider marketplace to discover products from
                  businesses across different categories and locations.
                </p>
              </div>
            </div>

            <Link to="/explore">
              <Button variant="outline">
                Explore marketplace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
