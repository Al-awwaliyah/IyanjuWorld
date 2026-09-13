import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface SearchBarProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  onClear?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function SearchBar({
  value,
  defaultValue = "",
  placeholder = "Search products...",
  onSearch,
  onChange,
  onClear,
  autoFocus = false,
  disabled = false,
  className = "",
}: SearchBarProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);

  const currentValue = isControlled ? value : internalValue;

  useEffect(() => {
    if (!isControlled) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, isControlled]);

  const updateValue = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedValue = currentValue.trim();

    onSearch?.(trimmedValue);
  };

  const handleClear = () => {
    updateValue("");
    onClear?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={["w-full", className].filter(Boolean).join(" ")}
    >
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
        />

        <input
          type="search"
          value={currentValue}
          onChange={(event) => updateValue(event.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-label={placeholder}
          className="h-12 w-full rounded-md border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60"
        />

        {currentValue && !disabled && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
