import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      description,
      error,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId =
      id || `switch-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className={className}>
        <div className="flex items-center justify-between gap-4">
          {(label || description) && (
            <div className="min-w-0">
              {label && (
                <label
                  htmlFor={generatedId}
                  className="cursor-pointer text-sm font-medium text-slate-700"
                >
                  {label}
                </label>
              )}

              {description && (
                <p
                  id={`${generatedId}-description`}
                  className="mt-0.5 text-sm text-slate-500"
                >
                  {description}
                </p>
              )}
            </div>
          )}

          <label
            htmlFor={generatedId}
            className="relative inline-flex shrink-0 cursor-pointer items-center"
          >
            <input
              ref={ref}
              id={generatedId}
              type="checkbox"
              role="switch"
              aria-invalid={error ? true : undefined}
              aria-describedby={
                error
                  ? `${generatedId}-error`
                  : description
                    ? `${generatedId}-description`
                    : undefined
              }
              className="peer sr-only"
              {...props}
            />

            <span className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-ink-900 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-400 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark-surface" />

            <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
          </label>
        </div>

        {error && (
          <p
            id={`${generatedId}-error`}
            className="mt-1.5 text-sm text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Switch.displayName = "Switch";

export default Switch;
