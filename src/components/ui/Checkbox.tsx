import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
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
      id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className={className}>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            id={generatedId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error
                ? `${generatedId}-error`
                : description
                  ? `${generatedId}-description`
                  : undefined
            }
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            {...props}
          />

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

Checkbox.displayName = "Checkbox";

export default Checkbox;
