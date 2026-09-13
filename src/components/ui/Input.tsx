import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId =
      id ||
      `input-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    const describedBy = [
      error ? `${generatedId}-error` : "",
      !error && helperText
        ? `${generatedId}-helper`
        : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div
        className={
          fullWidth ? "w-full" : "inline-block"
        }
      >
        {label && (
          <label
            htmlFor={generatedId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={generatedId}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={[
              "h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400",
              "focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
              "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
              error
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-slate-200",
              leftIcon ? "pl-10" : "",
              rightIcon ? "pr-10" : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />

          {rightIcon && (
            <span
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error ? (
          <p
            id={`${generatedId}-error`}
            className="mt-1.5 text-xs text-red-600"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${generatedId}-helper`}
            className="mt-1.5 text-xs text-slate-500"
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
