import {
  Building2,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
} from "lucide-react";

export type PaymentMethod =
  | "card"
  | "bank_transfer"
  | "bank_account"
  | "ussd"
  | "opay"
  | "nqr"
  | "enaira"
  | "wallet";

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface PaymentMethodSelectorProps {
  value?: PaymentMethod;
  onChange?: (method: PaymentMethod) => void;
  options?: PaymentMethodOption[];
  walletBalance?: number;
  orderTotal?: number;
  currency?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const defaultOptions: PaymentMethodOption[] = [
  {
    value: "card",
    label: "Card",
    description: "Pay securely with your debit or credit card.",
  },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
    description: "Pay by bank transfer.",
  },
  {
    value: "bank_account",
    label: "Bank Account",
    description: "Pay directly from your bank account.",
  },
  {
    value: "ussd",
    label: "USSD",
    description: "Pay using your bank's USSD service.",
  },
  {
    value: "opay",
    label: "OPay",
    description: "Pay securely with OPay.",
  },
  {
    value: "nqr",
    label: "QR Payment",
    description: "Complete payment using a supported QR method.",
  },
  {
    value: "enaira",
    label: "eNaira",
    description: "Pay using eNaira where supported.",
  },
];

const icons: Record<
  PaymentMethod,
  typeof CreditCard
> = {
  card: CreditCard,
  bank_transfer: Landmark,
  bank_account: Building2,
  ussd: Smartphone,
  opay: Smartphone,
  nqr: Smartphone,
  enaira: Wallet,
  wallet: Wallet,
};

function formatAmount(
  amount: number,
  currency = "NGN",
) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentMethodSelector({
  value,
  onChange,
  options = defaultOptions,
  walletBalance = 0,
  orderTotal = 0,
  currency = "NGN",
  disabled = false,
  error,
  className = "",
}: PaymentMethodSelectorProps) {
  const walletAvailable =
    walletBalance >= orderTotal;

  const walletOption: PaymentMethodOption = {
    value: "wallet",
    label: "IyanjuWorld Wallet",
    description: walletAvailable
      ? `Available balance: ${formatAmount(
          walletBalance,
          currency,
        )}`
      : `Insufficient wallet balance. Available: ${formatAmount(
          walletBalance,
          currency,
        )}`,
    disabled: !walletAvailable,
  };

  const allOptions = [
    walletOption,
    ...options,
  ];

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">
          Payment Method
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Choose how you want to pay for this order.
        </p>
      </div>

      <div
        className="grid gap-3"
        role="radiogroup"
        aria-label="Payment method"
      >
        {allOptions.map((option) => {
          const Icon = icons[option.value];
          const selected =
            value === option.value;
          const optionDisabled =
            disabled || Boolean(option.disabled);

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={optionDisabled}
              onClick={() =>
                onChange?.(option.value)
              }
              className={[
                "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                selected
                  ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                optionDisabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  selected
                    ? "bg-ink-900 text-white"
                    : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                <Icon
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {option.label}
                  </span>

                  {option.value ===
                    "wallet" && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      Wallet
                    </span>
                  )}
                </span>

                {option.description && (
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    {option.description}
                  </span>
                )}
              </span>

              <span
                className={[
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  selected
                    ? "border-slate-900"
                    : "border-slate-300",
                ].join(" ")}
              >
                {selected && (
                  <span className="h-2.5 w-2.5 rounded-full bg-ink-900 dark-surface" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p
          className="mt-3 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Payment is securely processed and verified
        before your order is confirmed.
      </p>
    </section>
  );
}
