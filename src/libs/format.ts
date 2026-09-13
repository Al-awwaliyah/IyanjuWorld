export const NGN_CURRENCY = "NGN";

const nairaFormatter = new Intl.NumberFormat(
  "en-NG",
  {
    style: "currency",
    currency: NGN_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
);

const nairaCompactFormatter = new Intl.NumberFormat(
  "en-NG",
  {
    style: "currency",
    currency: NGN_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
);

const numberFormatter = new Intl.NumberFormat(
  "en-NG",
);

export function formatNaira(
  amount: number | string | null | undefined,
  currency = NGN_CURRENCY,
): string {
  const value = Number(amount ?? 0);
  const formatter =
    currency === NGN_CURRENCY
      ? nairaFormatter
      : new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  if (!Number.isFinite(value)) {
    return formatter.format(0);
  }

  return formatter.format(value);
}

export function formatNairaCompact(
  amount: number | string | null | undefined,
): string {
  const value = Number(amount ?? 0);

  if (!Number.isFinite(value)) {
    return nairaCompactFormatter.format(0);
  }

  return nairaCompactFormatter.format(value);
}

export function formatNumber(
  value: number | string | null | undefined,
): string {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return numberFormatter.format(0);
  }

  return numberFormatter.format(number);
}

export function formatPercentage(
  value: number | string | null | undefined,
  maximumFractionDigits = 2,
): string {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return "0%";
  }

  return `${number.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })}%`;
}

export function formatDate(
  value: string | Date | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}

export function formatRelativeDate(
  value: string | Date | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const difference =
    Date.now() - date.getTime();

  const seconds =
    Math.floor(difference / 1000);

  if (seconds < 60) {
    return "Just now";
  }

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return formatDate(date);
}

export function formatOrderReference(
  reference: string | null | undefined,
): string {
  if (!reference) {
    return "—";
  }

  return reference.trim();
}

export function formatPaymentReference(
  reference: string | null | undefined,
): string {
  if (!reference) {
    return "—";
  }

  return reference.trim();
}

export function formatStatus(
  status: string | null | undefined,
): string {
  if (!status) {
    return "Unknown";
  }

  return status
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export function formatPhone(
  phone: string | null | undefined,
): string {
  if (!phone) {
    return "—";
  }

  return phone.trim();
}

export function formatAddress(
  parts: Array<
    string | null | undefined
  >,
): string {
  return parts
    .map((part) =>
      typeof part === "string"
        ? part.trim()
        : "",
    )
    .filter(Boolean)
    .join(", ") || "—";
}

export function formatFileSize(
  bytes: number | null | undefined,
): string {
  const value = Number(bytes ?? 0);

  if (!Number.isFinite(value) || value < 0) {
    return "0 B";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(
    value /
    (1024 * 1024 * 1024)
  ).toFixed(1)} GB`;
}

export function roundToNaira(
  amount: number,
): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(
    (amount + Number.EPSILON) * 100,
  ) / 100;
}

// Backward-compatible re-export for pages that historically imported this helper
// from the formatting utility module.
export { getSafeErrorMessage } from "./errors";
