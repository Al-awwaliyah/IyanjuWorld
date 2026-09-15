import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Search,
  ShieldCheck,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  useMarketplaceBusinesses,
  useMarketplaceCategories,
  useMarketplaceProducts,
  type MarketplaceProduct,
} from "../../services/marketplace";
import PageContainer from "../../components/layout/PageContainer";
import SearchBar from "../../components/marketplace/SearchBar";
import ProductGrid from "../../components/marketplace/ProductGrid";
import BusinessCard from "../../components/marketplace/BusinessCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-sm leading-6 text-slate-500 sm:text-base">
            {description}
          </p>
        )}
      </div>

      {href && (
        <Link
          to={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          {linkLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function CategoryProductSection({
  category,
  products,
}: {
  category: { id: string; name: string; slug: string; description?: string };
  products: MarketplaceProduct[];
}) {
  const categoryProducts = products
    .filter((product) => product.categoryId === category.id)
    .slice(0, 2);

  if (categoryProducts.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-ink-950 sm:text-xl">
            {category.name}
          </h2>
          {category.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
              {category.description}
            </p>
          )}
        </div>
        <Link
          to={`/category/${category.slug}`}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Explore all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <ProductGrid
        products={categoryProducts}
        columns={2}
        className="lg:grid-cols-2"
        emptyState={null}
      />
    </section>
  );
}

export default function Home() {
  const { categories, loading: categoriesLoading } = useMarketplaceCategories();
  const { products, loading: productsLoading } = useMarketplaceProducts({ limit: 100 });
  const { businesses, loading: businessesLoading } = useMarketplaceBusinesses();

  const featuredProducts = products.filter((product) => product.featured).slice(0, 8);
  const discountedProducts = products
    .filter(
      (product) =>
        product.compareAtPrice !== null &&
        product.compareAtPrice !== undefined &&
        product.compareAtPrice > product.price,
    )
    .slice(0, 8);

  const categorySections = categories
    .filter((category) => products.some((product) => product.categoryId === category.id))
    .slice(0, 6);

  const visibleBusinesses = businesses.filter((business) => business.productCount > 0).slice(0, 6);

  return (
    <PageContainer>
      <div className="space-y-10 pb-16 sm:space-y-12">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-brand-700 px-5 py-10 text-white dark-surface sm:px-10 sm:py-14 lg:px-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-brand-400/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="max-w-3xl">
              <Badge variant="info" className="bg-brand-500/15 text-brand-200">
                IyanjuWorld Marketplace
              </Badge>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Discover products.
                <span className="block text-brand-400">Buy from local businesses.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Browse real products published by businesses on IyanjuWorld and order from the sellers you choose.
              </p>
              <div className="mt-7 max-w-2xl">
                <SearchBar placeholder="Search products, categories or stores..." />
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/explore">
                  <Button size="lg" variant="brand" fullWidth>
                    Explore products
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="lg"
                    variant="outline"
                    fullWidth
                    className="border-white/30 bg-transparent text-white hover:bg-white hover:text-ink-950"
                  >
                    Start selling
                  </Button>
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Business-published products
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Secure payments
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Local delivery
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
                <div className="rounded-2xl bg-white p-5 text-ink-950">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
                    Live marketplace
                  </p>
                  <p className="mt-1 text-xl font-bold">Real businesses. Real products.</p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <StatTile label="Products" value={products.length} loading={productsLoading} />
                    <StatTile label="Categories" value={categories.length} loading={categoriesLoading} />
                    <StatTile label="Businesses" value={businesses.length} loading={businessesLoading} />
                    <StatTile label="Featured" value={featuredProducts.length} loading={productsLoading} />
                  </div>
                  <div className="mt-4 rounded-xl bg-ink-950 p-4 text-white dark-surface">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-brand-400" />
                      <div>
                        <p className="text-sm font-semibold">From seller to customer</p>
                        <p className="mt-1 text-xs text-slate-300">Products shown here come from the marketplace database.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {categorySections.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Shop by category"
              title="Browse products by category"
              description="Each section shows products currently published by marketplace businesses."
              href="/explore"
              linkLabel="Explore all"
            />
            <div className="grid gap-5 lg:grid-cols-2">
              {categorySections.map((category) => (
                <CategoryProductSection
                  key={category.id}
                  category={category}
                  products={products}
                />
              ))}
            </div>
          </section>
        )}

        {discountedProducts.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Deals"
              title="Flash deals"
              description="Products with a real compare-at price lower than the current selling price."
              href="/explore?deals=true"
            />
            <ProductGrid products={discountedProducts} columns={5} loading={productsLoading} />
          </section>
        )}

        {featuredProducts.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Featured"
              title="Featured products"
              description="Products businesses have marked as featured in the marketplace."
              href="/explore?featured=true"
            />
            <ProductGrid products={featuredProducts} columns={5} loading={productsLoading} />
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-600">Shop locally</p>
                  <h2 className="text-2xl font-bold text-ink-950">Discover marketplace businesses</h2>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Visit seller storefronts, compare their published products and order directly through IyanjuWorld.
              </p>
            </div>
            <Link to="/businesses">
              <Button variant="brand-outline">
                Browse businesses
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {visibleBusinesses.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Businesses"
              title="Meet marketplace sellers"
              description="Explore businesses that currently have products available in the marketplace."
              href="/businesses"
            />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visibleBusinesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </section>
        )}

        {!productsLoading && products.length === 0 && (
          <EmptyState
            title="The marketplace is waiting for its first products"
            description="Products will appear here automatically after a business owner publishes them."
            icon={<Store className="h-6 w-6" />}
          />
        )}

        <section className="grid gap-5 md:grid-cols-3">
          <TrustCard icon={ShieldCheck} title="Built around trust" description="Browse products published by registered marketplace businesses." />
          <TrustCard icon={Wallet} title="Secure payments" description="Pay through the marketplace and keep your transaction history in one place." />
          <TrustCard icon={Truck} title="Reliable delivery" description="Eligible orders can be connected with verified riders for local delivery." />
        </section>

        <section className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 p-5 sm:p-7">
          <div className="grid gap-7 lg:grid-cols-3 lg:items-center">
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Grow with IyanjuWorld</p>
              <h2 className="mt-2 text-2xl font-bold text-ink-950 sm:text-3xl">Turn your business into a digital storefront.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Publish your products, manage orders and reach customers through the marketplace.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link to="/register">
                <Button variant="brand" fullWidth>
                  Create a business account
                  <Store className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" fullWidth>
                  Continue shopping
                  <Search className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function StatTile({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink-950">{loading ? "—" : value.toLocaleString()}</p>
    </div>
  );
}

function TrustCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-ink-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
