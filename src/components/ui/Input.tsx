import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId =
      id || `input-${Math.random().toString(36).slice(2, 9)}`;

    const inputClasses = [
      "min-h-11 rounded-xl border bg-white px-4 text-sm text-slate-900",
      "placeholder:text-slate-400",
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

        <input
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
          className={inputClasses}
          {...props}
        />

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

Input.displayName = "Input";

export default Input;
