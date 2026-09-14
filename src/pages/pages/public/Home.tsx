import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useMarketplaceProducts, useMarketplaceCategories, useMarketplaceBusinesses, useMarketplaceProduct, useMarketplaceBusiness } from "../../services/marketplace";
import PageContainer from "../../components/layout/PageContainer";
import SearchBar from "../../components/marketplace/SearchBar";
import CategoryGrid from "../../components/marketplace/CategoryGrid";
import ProductGrid from "../../components/marketplace/ProductGrid";
import BusinessCard from "../../components/marketplace/BusinessCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";





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
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600">
            {eyebrow}
          </p>
        )}

        <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
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

export default function Home() {
  const { categories, loading: categoriesLoading } = useMarketplaceCategories();
  const { products, loading: productsLoading } = useMarketplaceProducts({ limit: 100 });
  const { businesses, loading: businessesLoading } = useMarketplaceBusinesses();
  const featuredProducts = products.filter((product) => product.featured).slice(0, 8);
  const popularProducts = products.filter((product) => !product.featured).slice(0, 8);

  return (
    <PageContainer>
      <div className="space-y-16 pb-16">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-brand-700 px-6 py-14 text-white sm:px-10 sm:py-20 lg:px-16">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-brand-400/10 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="max-w-3xl">
              <Badge variant="info" className="bg-brand-500/15 text-brand-200">
                Nigeria&apos;s growing local marketplace
              </Badge>

              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Discover products.
                <span className="block text-brand-400">
                  Buy from local businesses.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                IyanjuWorld connects customers with trusted businesses,
                products and delivery riders in one convenient marketplace.
              </p>

              <div className="mt-8 max-w-2xl">
                <SearchBar
                  placeholder="Search products, categories or stores..."
                />
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
                    className="border-slate-600 bg-transparent text-white hover:bg-white hover:text-slate-950"
                  >
                    Start selling
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Trusted businesses
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Secure payments
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Local delivery
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative mx-auto max-w-md">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
                  <div className="rounded-2xl bg-white p-5 text-slate-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Marketplace
                        </p>

                        <p className="mt-1 text-lg font-bold">
                          Shop local
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {[
                        "Fashion",
                        "Electronics",
                        "Groceries",
                        "Beauty",
                      ].map((item) => (
                        <div
                          key={item}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <p className="text-sm font-semibold text-slate-800">
                            {item}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Explore products
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-950 p-4 text-white">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-brand-400" />

                        <div>
                          <p className="text-sm font-semibold">
                            Delivered to you
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Track your order from pickup to delivery.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Shop by category"
            title="Find what you need"
            description="Explore products from different categories and discover businesses around you."
            href="/explore"
            linkLabel="Explore all"
          />

          <CategoryGrid categories={categories} />
        </section>

        <section>
          <SectionHeader
            eyebrow="Featured"
            title="Featured products"
            description="Discover products selected from businesses on the marketplace."
            href="/explore?featured=true"
          />

          <ProductGrid products={featuredProducts} loading={productsLoading} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-brand-600">
                    Shop locally
                  </p>

                  <h2 className="text-2xl font-bold text-slate-950">
                    Discover businesses near you
                  </h2>
                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
                Find trusted businesses, compare their products and order
                directly from the sellers you choose.
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

        <section>
          <SectionHeader
            eyebrow="Popular now"
            title="Products customers are discovering"
            description="Browse more products available from marketplace businesses."
            href="/explore"
          />

          <ProductGrid products={popularProducts} loading={productsLoading} />
        </section>

        <section>
          <SectionHeader
            eyebrow="Businesses"
            title="Meet marketplace sellers"
            description="Explore trusted businesses and see what they have available."
            href="/businesses"
          />

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <TrustCard
            icon={ShieldCheck}
            title="Built around trust"
            description="Verified businesses, protected transactions and transparent order activity."
          />

          <TrustCard
            icon={Wallet}
            title="Secure payments"
            description="Pay through the marketplace and keep your transaction history in one place."
          />

          <TrustCard
            icon={Truck}
            title="Reliable delivery"
            description="Eligible orders are connected with verified riders for local delivery."
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-3 lg:items-center">
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                Grow with IyanjuWorld
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                Turn your business into a digital storefront.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                List your products, manage orders, reach new customers and
                participate in a growing local commerce network.
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
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-5 text-base font-semibold text-slate-950">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
