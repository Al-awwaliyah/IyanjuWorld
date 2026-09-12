import { useMemo, useState } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size?: AvatarSize;
  status?: "online" | "offline" | "busy" | "away";
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

const statusStyles: Record<
  NonNullable<AvatarProps["status"]>,
  string
> = {
  online: "bg-emerald-500",
  offline: "bg-slate-400",
  busy: "bg-red-500",
  away: "bg-amber-500",
};

function getInitials(name?: string | null) {
  if (!name?.trim()) {
    return "?";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Avatar({
  src,
  alt,
  name,
  size = "md",
  status,
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = useMemo(() => getInitials(name), [name]);

  const showImage = Boolean(src) && !imageError;

  return (
    <span
      className={[
        "relative inline-flex shrink-0",
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-200 font-semibold text-slate-600">
        {showImage ? (
          <img
            src={src ?? undefined}
            alt={alt ?? name ?? "Profile"}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </span>

      {status && (
        <span
          aria-label={`Status: ${status}`}
          className={[
            "absolute bottom-0 right-0 block rounded-full border-2 border-white",
            statusStyles[status],
            size === "xs" || size === "sm"
              ? "h-2.5 w-2.5"
              : size === "md"
                ? "h-3 w-3"
                : "h-3.5 w-3.5",
          ].join(" ")}
        />
      )}
    </span>
  );
}
