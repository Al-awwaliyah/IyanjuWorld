import {
  forwardRef,
  type SelectHTMLAttributes,
} from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      fullWidth = true,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId =
      id || `select-${Math.random().toString(36).slice(2, 9)}`;

    const selectClasses = [
      "min-h-11 appearance-none rounded-xl border bg-white px-4 pr-10",
      "text-sm text-slate-900",
      "transition-colors duration-200",
      "focus:outline-none focus:ring-2 focus:ring-offset-0",
      "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
        : "border-slate-300 focus:border-slate-900 focus:ring-slate-100",
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label
            htmlFor={generatedId}
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={generatedId}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error
                ? `${generatedId}-error`
                : helperText
                  ? `${generatedId}-helper`
                  : undefined
            }
            className={selectClasses}
            {...props}
          >
            {placeholder && (
              <option value="">
                {placeholder}
              </option>
            )}

            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </div>

        {error ? (
          <p
            id={`${generatedId}-error`}
            className="mt-1.5 text-sm text-red-600"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${generatedId}-helper`}
            className="mt-1.5 text-sm text-slate-500"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
