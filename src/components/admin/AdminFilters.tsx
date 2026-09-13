import {
  Calendar,
  Filter,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import type {
  ChangeEvent,
  ReactNode,
} from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select, {
  type SelectOption,
} from "@/components/ui/Select";

export interface AdminFilterOption {
  value: string;
  label: string;
}

export interface AdminFilterConfig {
  key: string;
  label: string;
  value?: string;
  options?: AdminFilterOption[];
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface AdminFiltersProps {
  children?: ReactNode;

  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  filters?: AdminFilterConfig[];

  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;

  onApply?: () => void;
  onReset?: () => void;

  loading?: boolean;
  disabled?: boolean;

  showSearch?: boolean;
  showDates?: boolean;
  showApplyButton?: boolean;
  showResetButton?: boolean;

  header?: ReactNode;
  footer?: ReactNode;

  className?: string;
}

export function AdminFilters({
  children,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
  loading = false,
  disabled = false,
  showSearch = true,
  showDates = false,
  showApplyButton = false,
  showResetButton = true,
  header,
  footer,
  className = "",
}: AdminFiltersProps) {
  const isDisabled = disabled || loading;

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onSearchChange?.(event.target.value);
  };

  const handleStartDateChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onStartDateChange?.(event.target.value);
  };

  const handleEndDateChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onEndDateChange?.(event.target.value);
  };

  const hasActiveFilters =
    Boolean(searchValue) ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    filters.some((filter) => Boolean(filter.value));

  const selectOptions = (
    options: AdminFilterOption[] = [],
  ): SelectOption[] =>
    options.map((option) => ({
      value: option.value,
      label: option.label,
    }));

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {header && (
        <div className="mb-4">
          {header}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {showSearch && onSearchChange && (
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />

            <Input
              value={searchValue}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              disabled={isDisabled}
              className="pl-9"
            />
          </div>
        )}

        {filters.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filters.map((filter) => (
              <Select
                key={filter.key}
                value={filter.value ?? ""}
                onChange={(event) =>
                  filter.onChange?.(event.target.value)
                }
                options={selectOptions(filter.options)}
                placeholder={
                  filter.placeholder ?? filter.label
                }
                disabled={
                  isDisabled || Boolean(filter.disabled)
                }
              />
            ))}
          </div>
        )}

        {showDates && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative">
              <Calendar
                className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />

              <Input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                disabled={isDisabled}
                className="pl-9"
                aria-label="Start date"
              />
            </div>

            <div className="relative">
              <Calendar
                className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />

              <Input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                disabled={isDisabled}
                className="pl-9"
                aria-label="End date"
              />
            </div>
          </div>
        )}

        {children && (
          <div className="flex flex-wrap items-center gap-3">
            {children}
          </div>
        )}

        {(showApplyButton ||
          showResetButton ||
          hasActiveFilters) && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            {showResetButton && hasActiveFilters && onReset && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReset}
                disabled={isDisabled}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}

            {showApplyButton && onApply && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onApply}
                loading={loading}
                disabled={disabled}
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {footer && (
        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
          {footer}
        </div>
      )}
    </div>
  );
}

export default AdminFilters;
