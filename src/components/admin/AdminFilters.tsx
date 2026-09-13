import {
  useMemo,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { CalendarDays, Filter, RotateCcw, Search, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";

export interface AdminFilterOption {
  label: string;
  value: string;
}

export interface AdminSelectFilter {
  id: string;
  label: string;
  value: string;
  options: SelectOption[] | AdminFilterOption[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
}

export interface AdminFiltersProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  filters?: AdminSelectFilter[];

  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  showDateRange?: boolean;
  dateFromLabel?: string;
  dateToLabel?: string;

  activeFilterCount?: number;

  onApply?: () => void;
  onReset?: () => void;

  applyLabel?: string;
  resetLabel?: string;

  loading?: boolean;
  disabled?: boolean;
  showApplyButton?: boolean;
  showResetButton?: boolean;

  header?: ReactNode;
  footer?: ReactNode;

  compact?: boolean;
  className?: string;
}

function normalizeOptions(
  options: SelectOption[] | AdminFilterOption[],
): SelectOption[] {
  return options.map((option) => ({
    label: option.label,
    value: option.value,
  }));
}

function getInputValue(
  event: ChangeEvent<HTMLInputElement>,
): string {
  return event.target.value;
}

export function AdminFilters({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  dateFrom = "",
  dateTo = "",
  onDateFromChange,
  onDateToChange,
  showDateRange = false,
  dateFromLabel = "From date",
  dateToLabel = "To date",
  activeFilterCount = 0,
  onApply,
  onReset,
  applyLabel = "Apply filters",
  resetLabel = "Reset",
  loading = false,
  disabled = false,
  showApplyButton = true,
  showResetButton = true,
  header,
  footer,
  compact = false,
  className = "",
}: AdminFiltersProps) {
  const hasSearch = typeof onSearchChange === "function";
  const hasSelectFilters = filters.length > 0;
  const hasDateRange =
    showDateRange &&
    (typeof onDateFromChange === "function" ||
      typeof onDateToChange === "function");

  const hasControls = hasSearch || hasSelectFilters || hasDateRange;

  const computedActiveFilterCount = useMemo(() => {
    if (activeFilterCount > 0) {
      return activeFilterCount;
    }

    let count = 0;

    if (searchValue.trim()) {
      count += 1;
    }

    filters.forEach((filter) => {
      if (filter.value) {
        count += 1;
      }
    });

    if (dateFrom) {
      count += 1;
    }

    if (dateTo) {
      count += 1;
    }

    return count;
  }, [
    activeFilterCount,
    searchValue,
    filters,
    dateFrom,
    dateTo,
  ]);

  if (!hasControls && !header && !footer) {
    return null;
  }

  return (
    <section
      className={[
        "w-full rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Admin filters"
    >
      <div
        className={[
          compact ? "p-3" : "p-4",
          "space-y-4",
        ].join(" ")}
      >
        {(header || computedActiveFilterCount > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {header ?? (
                <>
                  <Filter className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-900">
                    Filters
                  </span>
                </>
              )}

              {computedActiveFilterCount > 0 && (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {computedActiveFilterCount}
                </span>
              )}
            </div>

            {showResetButton && onReset && computedActiveFilterCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                disabled={loading || disabled}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {resetLabel}
              </button>
            )}
          </div>
        )}

        {hasControls && (
          <div
            className={[
              "grid gap-3",
              hasSearch
                ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
            ].join(" ")}
          >
            {hasSearch && (
              <div className="min-w-0 md:col-span-2">
                <Input
                  label="Search"
                  value={searchValue}
                  onChange={(event) =>
                    onSearchChange?.(getInputValue(event))
                  }
                  placeholder={searchPlaceholder}
                  leftIcon={<Search className="h-4 w-4" />}
                  rightIcon={
                    searchValue ? (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => onSearchChange?.("")}
                        disabled={loading || disabled}
                        className="rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : undefined
                  }
                  disabled={loading || disabled}
                  fullWidth
                />
              </div>
            )}

            {filters.map((filter) => (
              <div
                key={filter.id}
                className={[
                  "min-w-0",
                  filter.className ?? "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Select
                  label={filter.label}
                  value={filter.value}
                  onChange={(event) =>
                    filter.onChange(event.target.value)
                  }
                  options={normalizeOptions(filter.options)}
                  placeholder={filter.placeholder ?? `All ${filter.label}`}
                  disabled={
                    loading ||
                    disabled ||
                    Boolean(filter.disabled)
                  }
                  fullWidth
                />
              </div>
            ))}

            {hasDateRange && (
              <>
                {onDateFromChange && (
                  <div className="min-w-0">
                    <Input
                      label={dateFromLabel}
                      type="date"
                      value={dateFrom}
                      onChange={(event) =>
                        onDateFromChange(getInputValue(event))
                      }
                      disabled={loading || disabled}
                      leftIcon={
                        <CalendarDays className="h-4 w-4" />
                      }
                      fullWidth
                    />
                  </div>
                )}

                {onDateToChange && (
                  <div className="min-w-0">
                    <Input
                      label={dateToLabel}
                      type="date"
                      value={dateTo}
                      onChange={(event) =>
                        onDateToChange(getInputValue(event))
                      }
                      disabled={loading || disabled}
                      leftIcon={
                        <CalendarDays className="h-4 w-4" />
                      }
                      fullWidth
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {(showApplyButton && onApply) || (showResetButton && onReset) ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
            {showResetButton && onReset && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onReset}
                disabled={loading || disabled}
              >
                <RotateCcw className="h-4 w-4" />
                {resetLabel}
              </Button>
            )}

            {showApplyButton && onApply && (
              <Button
                type="button"
                size="sm"
                onClick={onApply}
                loading={loading}
                disabled={disabled}
              >
                <Filter className="h-4 w-4" />
                {applyLabel}
              </Button>
            )}
          </div>
        ) : null}

        {footer && (
          <div className="border-t border-slate-100 pt-3">
            {footer}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminFilters;
