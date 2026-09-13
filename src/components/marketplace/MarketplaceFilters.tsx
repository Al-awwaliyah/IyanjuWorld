import { Filter, RotateCcw, Search } from "lucide-react";
import Button from "../ui/Button";
import Select, { type SelectOption } from "../ui/Select";
import Input from "../ui/Input";

export interface MarketplaceFiltersProps {
  search?: string;
  category?: string;
  business?: string;
  sort?: string;
  availability?: string;
  categoryOptions?: SelectOption[];
  businessOptions?: SelectOption[];
  sortOptions?: SelectOption[];
  availabilityOptions?: SelectOption[];
  onSearchChange?: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onBusinessChange?: (value: string) => void;
  onSortChange?: (value: string) => void;
  onAvailabilityChange?: (value: string) => void;
  onApply?: () => void;
  onReset?: () => void;
  loading?: boolean;
  showBusinessFilter?: boolean;
  showAvailabilityFilter?: boolean;
  className?: string;
}

const defaultSortOptions: SelectOption[] = [
  {
    value: "featured",
    label: "Featured",
  },
  {
    value: "newest",
    label: "Newest",
  },
  {
    value: "price_low",
    label: "Price: Low to High",
  },
  {
    value: "price_high",
    label: "Price: High to Low",
  },
  {
    value: "name",
    label: "Name: A-Z",
  },
];

const defaultAvailabilityOptions: SelectOption[] = [
  {
    value: "all",
    label: "All products",
  },
  {
    value: "available",
    label: "Available",
  },
  {
    value: "out_of_stock",
    label: "Out of stock",
  },
];

export default function MarketplaceFilters({
  search = "",
  category = "",
  business = "",
  sort = "featured",
  availability = "all",
  categoryOptions = [],
  businessOptions = [],
  sortOptions = defaultSortOptions,
  availabilityOptions = defaultAvailabilityOptions,
  onSearchChange,
  onCategoryChange,
  onBusinessChange,
  onSortChange,
  onAvailabilityChange,
  onApply,
  onReset,
  loading = false,
  showBusinessFilter = true,
  showAvailabilityFilter = true,
  className = "",
}: MarketplaceFiltersProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Marketplace filters"
    >
      <div className="mb-4 flex items-center gap-2">
        <Filter
          className="h-5 w-5 text-slate-700"
          aria-hidden="true"
        />

        <h2 className="text-sm font-semibold text-slate-900">
          Filter products
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2 lg:col-span-4">
          <Input
            label="Search"
            value={search}
            onChange={(event) =>
              onSearchChange?.(event.target.value)
            }
            placeholder="Search products..."
            leftIcon={
              <Search
                className="h-4 w-4"
                aria-hidden="true"
              />
            }
            disabled={loading}
          />
        </div>

        <Select
          label="Category"
          value={category}
          onChange={(event) =>
            onCategoryChange?.(event.target.value)
          }
          options={categoryOptions}
          placeholder="All categories"
          disabled={loading}
        />

        {showBusinessFilter && (
          <Select
            label="Business"
            value={business}
            onChange={(event) =>
              onBusinessChange?.(event.target.value)
            }
            options={businessOptions}
            placeholder="All businesses"
            disabled={loading}
          />
        )}

        <Select
          label="Sort by"
          value={sort}
          onChange={(event) =>
            onSortChange?.(event.target.value)
          }
          options={sortOptions}
          disabled={loading}
        />

        {showAvailabilityFilter && (
          <Select
            label="Availability"
            value={availability}
            onChange={(event) =>
              onAvailabilityChange?.(event.target.value)
            }
            options={availabilityOptions}
            disabled={loading}
          />
        )}
      </div>

      {(onApply || onReset) && (
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {onReset && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={loading}
              onClick={onReset}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}

          {onApply && (
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={loading}
              disabled={loading}
              onClick={onApply}
            >
              Apply Filters
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
