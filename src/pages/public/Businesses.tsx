import { useMemo, useState } from "react";
import {
  Grid2X2,
  List,
  MapPin,
  Search,
  Store,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useMarketplaceProducts, useMarketplaceCategories, useMarketplaceBusinesses, useMarketplaceProduct, useMarketplaceBusiness } from "../../services/marketplace";
import PageContainer from "../../components/layout/PageContainer";
import BusinessCard from "../../components/marketplace/BusinessCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

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

export default function Businesses() {
  const { businesses, loading } = useMarketplaceBusinesses();
  const { categories } = useMarketplaceCategories();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return businesses.filter((business) => {
      const matchesSearch =
        !query ||
        [
          business.name,
          business.description,
          business.category,
          business.city,
          business.state,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        !category ||
        business.categorySlug === category;

      const matchesState =
        !state ||
        business.state === state;

      const matchesOpen =
        !openOnly || business.open;

      const matchesVerified =
        !verifiedOnly || business.verified;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesState &&
        matchesOpen &&
        matchesVerified
      );
    });
  }, [
    search,
    category,
    state,
    openOnly,
    verifiedOnly,
  ]);

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setState("");
    setOpenOnly(false);
    setVerifiedOnly(true);
  };

  return (
    <PageContainer>
      <div className="space-y-8 pb-16">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="max-w-3xl">
            <Badge variant="info">
              Marketplace businesses
            </Badge>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Discover businesses on IyanjuWorld
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              Browse trusted marketplace sellers, explore their products
              and connect with businesses directly.
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
                placeholder="Search businesses, categories or locations..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-50"
                aria-label="Search businesses"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-50"
                aria-label="Filter businesses by category"
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

              <select
                value={state}
                onChange={(event) =>
                  setState(event.target.value)
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-50"
                aria-label="Filter businesses by location"
              >
                {states.map((item) => (
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
                  checked={openOnly}
                  onChange={(event) =>
                    setOpenOnly(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                Open now
              </label>

              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(event) =>
                    setVerifiedOnly(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                Verified only
              </label>

              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                Clear
              </Button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">
                {filteredBusinesses.length}{" "}
                {filteredBusinesses.length === 1
                  ? "business"
                  : "businesses"}
              </span>

              <div className="flex rounded-lg border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                    view === "grid"
                      ? "bg-ink-900 text-white"
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
                      ? "bg-ink-900 text-white"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {filteredBusinesses.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-12">
            <EmptyState
              title="No businesses found"
              description="Try another search term or clear some of your filters."
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
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
              />
            ))}
          </section>
        ) : (
          <section className="space-y-4">
            {filteredBusinesses.map((business) => (
              <BusinessListItem
                key={business.id}
                business={business}
              />
            ))}
          </section>
        )}

        <section className="rounded-2xl border border-brand-100 bg-brand-50 p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
              <Store className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Own a business?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Create your marketplace storefront, list your products and
                reach more customers through IyanjuWorld.
              </p>
            </div>

            <Link to="/register">
              <Button>
                Become a seller
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function BusinessListItem({
  business,
}: {
  business: Business;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-48">
          <img
            src={business.coverImage}
            alt={business.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-950">
                  {business.name}
                </h2>

                {business.verified && (
                  <Badge variant="success">
                    Verified
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
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {business.description}
              </p>
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

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {business.city}, {business.state}
            </span>

            <span>
              {business.category}
            </span>

            <span>
              {business.productCount} products
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
