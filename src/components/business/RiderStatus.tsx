import {
  CheckCircle2,
  CircleOff,
  Clock3,
  MapPin,
  Power,
  ShieldCheck,
  Truck,
} from "lucide-react";

import Badge, {
  type BadgeProps,
} from "../ui/Badge";
import Button from "../ui/Button";

export type RiderAvailability =
  | "offline"
  | "available"
  | "busy";

export type RiderVerificationStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "suspended";

export interface RiderStatusProps {
  availability: RiderAvailability;
  verificationStatus: RiderVerificationStatus;
  operatingArea?: string | null;
  activeDelivery?: boolean;
  loading?: boolean;
  error?: string | null;
  onToggleAvailability?: (
    availability: RiderAvailability,
  ) => void;
  className?: string;
}

const availabilityConfig: Record<
  RiderAvailability,
  {
    label: string;
    description: string;
    variant: BadgeProps["variant"];
    icon: typeof Power;
  }
> = {
  offline: {
    label: "Offline",
    description:
      "You are currently unavailable for new delivery requests.",
    variant: "neutral",
    icon: CircleOff,
  },
  available: {
    label: "Available",
    description:
      "You can receive eligible delivery requests.",
    variant: "success",
    icon: CheckCircle2,
  },
  busy: {
    label: "Busy",
    description:
      "You are currently handling a delivery.",
    variant: "warning",
    icon: Truck,
  },
};

const verificationConfig: Record<
  RiderVerificationStatus,
  {
    label: string;
    variant: BadgeProps["variant"];
    description: string;
  }
> = {
  pending: {
    label: "Verification pending",
    variant: "warning",
    description:
      "Your rider verification has not been completed yet.",
  },
  under_review: {
    label: "Under review",
    variant: "info",
    description:
      "Your rider information is currently being reviewed.",
  },
  verified: {
    label: "Verified rider",
    variant: "success",
    description:
      "Your rider account is verified and eligible for delivery assignments.",
  },
  rejected: {
    label: "Verification rejected",
    variant: "danger",
    description:
      "Your rider verification was not approved.",
  },
  suspended: {
    label: "Account suspended",
    variant: "danger",
    description:
      "Your rider account is currently suspended.",
  },
};

function getNextAvailability(
  current: RiderAvailability,
  activeDelivery: boolean,
): RiderAvailability | null {
  if (activeDelivery) {
    return null;
  }

  if (current === "offline") {
    return "available";
  }

  if (current === "available") {
    return "offline";
  }

  return null;
}

export default function RiderStatus({
  availability,
  verificationStatus,
  operatingArea,
  activeDelivery = false,
  loading = false,
  error,
  onToggleAvailability,
  className = "",
}: RiderStatusProps) {
  const availabilityInfo =
    availabilityConfig[availability];

  const verificationInfo =
    verificationConfig[verificationStatus];

  const AvailabilityIcon =
    availabilityInfo.icon;

  const nextAvailability =
    getNextAvailability(
      availability,
      activeDelivery,
    );

  const canChangeAvailability =
    verificationStatus === "verified" &&
    !activeDelivery &&
    Boolean(onToggleAvailability) &&
    !loading;

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Rider status
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Manage your availability for delivery
              assignments.
            </p>
          </div>

          <Badge
            variant={availabilityInfo.variant}
            size="md"
            dot
          >
            {availabilityInfo.label}
          </Badge>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="space-y-5 p-5">
        <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
              <AvailabilityIcon
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                {availabilityInfo.label}
              </p>

              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                {availabilityInfo.description}
              </p>
            </div>
          </div>

          {canChangeAvailability &&
            nextAvailability && (
              <Button
                type="button"
                variant={
                  availability === "available"
                    ? "outline"
                    : "primary"
                }
                size="sm"
                loading={loading}
                onClick={() =>
                  onToggleAvailability?.(
                    nextAvailability,
                  )
                }
              >
                {availability === "available"
                  ? "Go offline"
                  : "Go available"}
              </Button>
            )}
        </div>

        {activeDelivery && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Truck
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-semibold text-amber-900">
                Active delivery in progress
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                Your availability is temporarily locked
                while you complete the current delivery.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <ShieldCheck
                  className="h-4.5 w-4.5"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Verification
                </p>

                <Badge
                  variant={
                    verificationInfo.variant
                  }
                  size="sm"
                >
                  {verificationInfo.label}
                </Badge>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              {verificationInfo.description}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <MapPin
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Operating area
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {operatingArea ||
                    "Not configured"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {availability === "available" &&
          verificationStatus === "verified" && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden="true"
              />

              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Ready for delivery requests
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-800">
                  Eligible delivery requests can be
                  offered to you while you remain
                  available.
                </p>
              </div>
            </div>
          )}

        {verificationStatus !== "verified" && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Clock3
              className="mt-0.5 h-5 w-5 shrink-0 text-slate-500"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Delivery access is restricted
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Rider delivery requests become available
                after the account has been verified by
                the platform.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
