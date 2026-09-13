import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

export type ToastVariant =
  | "success"
  | "error"
  | "warning"
  | "info";

export interface ToastProps {
  open: boolean;
  message: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
  action?: ReactNode;
}

const variantStyles: Record<
  ToastVariant,
  {
    container: string;
    icon: string;
  }
> = {
  success: {
    container: "border-emerald-200 bg-emerald-50",
    icon: "text-emerald-600",
  },
  error: {
    container: "border-red-200 bg-red-50",
    icon: "text-red-600",
  },
  warning: {
    container: "border-amber-200 bg-amber-50",
    icon: "text-amber-600",
  },
  info: {
    container: "border-blue-200 bg-blue-50",
    icon: "text-blue-600",
  },
};

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
  warning: <AlertCircle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

export default function Toast({
  open,
  message,
  title,
  variant = "info",
  duration = 5000,
  onClose,
  action,
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    setVisible(true);

    if (duration <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
      onClose();
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, duration, onClose]);

  if (!open || !visible) {
    return null;
  }

  const styles = variantStyles[variant];

  return (
    <div
      role="status"
      aria-live={variant === "error" ? "assertive" : "polite"}
      className="fixed inset-x-4 bottom-4 z-[100] flex justify-center sm:left-auto sm:right-4 sm:max-w-md"
    >
      <div
        className={[
          "w-full rounded-2xl border p-4 shadow-lg backdrop-blur-sm",
          styles.container,
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={`mt-0.5 shrink-0 ${styles.icon}`}
          >
            {icons[variant]}
          </span>

          <div className="min-w-0 flex-1">
            {title && (
              <p className="text-sm font-semibold text-slate-900">
                {title}
              </p>
            )}

            <p
              className={[
                "text-sm leading-5 text-slate-700",
                title ? "mt-1" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {message}
            </p>

            {action && <div className="mt-3">{action}</div>}
          </div>

          <button
            type="button"
            aria-label="Close notification"
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            className="shrink-0 rounded-lg p-1 text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
