import {
  CarFront,
  CircleCheck,
  CircleOff,
  Clock3,
  MapPin,
  Radio,
  Truck,
} from "lucide-react";

import Badge, {
  type BadgeProps,
} from "../ui/Badge";
import Button from "../ui/Button";
import { formatRelativeDate } from "../../libs/format";

export type RiderAvailability =
  | "available"
  | "unavailable";

export type RiderVerificationStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "suspended";

export type RiderPresenceStatus =
  | "online"
  | "offline";

export type RiderVisibleStatus =
  | "available"
  | "online"
  | "on_delivery"
  | "offline";

export interface RiderStatusProps {
  online: boolean;
  availability: RiderAvailability;
  activeDelivery?: boolean;
  lastSeenAt?: string | null;

  verificationStatus: RiderVerificationStatus;

  operatingArea?: string | null;

  vehicleType?:
    | "bicycle"
    | "motorcycle"
    | "car"
    | "van"
    | "other"
    | null;

  loading?: boolean;
  error?: string | null;

  onToggleAvailability?: (
    available: boolean,
  ) => void;

  showAvailabilityControl?: boolean;
  showVerification?: boolean;
  showOperatingArea?: boolean;
  showVehicle?: boolean;
  compact?: boolean;

  className?: string;
}

interface StatusConfig {
  label: string;
  description: string;
  variant: BadgeProps["variant"];
  icon: typeof Radio;
}

const STATUS_CONFIG: Record<
  RiderVisibleStatus,
  StatusConfig
> = {
  available: {
    label: "Available",
    description:
      "Online and ready to receive delivery requests.",
    variant: "success",
    icon: CircleCheck,
  },

  online: {
    label: "Online",
    description:
      "Online but currently unavailable for new deliveries.",
    variant: "info",
    icon: Radio,
  },

  on_delivery: {
    label: "On Delivery",
    description:
      "Currently handling an active delivery.",
    variant: "warning",
    icon: Truck,
  },

  offline: {
    label: "Offline",
    description:
      "Not currently online.",
    variant: "neutral",
    icon: CircleOff,
  },
};

const VERIFICATION_CONFIG: Record<
  RiderVerificationStatus,
  {
    label: string;
    variant: BadgeProps["variant"];
  }
> = {
  pending: {
    label: "Verification Pending",
    variant: "warning",
  },

  under_review: {
    label: "Under Review",
    variant: "info",
  },

  verified: {
    label: "Verified",
    variant: "success",
  },

  rejected: {
    label: "Rejected",
    variant: "danger",
  },

  suspended: {
    label: "Suspended",
    variant: "danger",
  },
};

function getVisibleStatus(
  online: boolean,
  availability: RiderAvailability,
  activeDelivery: boolean,
): RiderVisibleStatus {
  if (!online) {
    return "offline";
  }

  if (activeDelivery) {
    return "on_delivery";
  }

  if (availability === "available") {
    return "available";
  }

  return "online";
}

function getVehicleLabel(
  vehicleType:
    | RiderStatusProps["vehicleType"],
) {
  switch (vehicleType) {
    case "bicycle":
      return "Bicycle";

    case "motorcycle":
      return "Motorcycle";

    case "car":
      return "Car";

    case "van":
      return "Van";

    case "other":
      return "Other";

    default:
      return null;
  }
}

export default function RiderStatus({
  online,
  availability,
  activeDelivery = false,
  lastSeenAt = null,
  verificationStatus,
  operatingArea = null,
  vehicleType = null,
  loading = false,
  error = null,
  onToggleAvailability,
  showAvailabilityControl = true,
  showVerification = true,
  showOperatingArea = true,
  showVehicle = false,
  compact = false,
  className = "",
}: RiderStatusProps) {
  const visibleStatus = getVisibleStatus(
    online,
    availability,
    activeDelivery,
  );

  const status =
    STATUS_CONFIG[visibleStatus];

  const StatusIcon = status.icon;

  const verification =
    VERIFICATION_CONFIG[
      verificationStatus
    ];

  const canToggleAvailability =
    Boolean(onToggleAvailability) &&
    online &&
    !activeDelivery &&
    verificationStatus === "verified";

  if (compact) {
    return (
      <div
        className={[
          "inline-flex items-center gap-2",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Badge
          variant={status.variant}
          size="sm"
          dot
        >
          {status.label}
        </Badge>
      </div>
    );
  }

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Rider status"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={[
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                visibleStatus === "available"
                  ? "bg-emerald-50 text-emerald-600"
                  : visibleStatus === "on_delivery"
                    ? "bg-amber-50 text-amber-600"
                    : visibleStatus === "online"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              <StatusIcon
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Rider Status
                </h2>

                <Badge
                  variant={status.variant}
                  size="sm"
                  dot
                >
                  {status.label}
                </Badge>
              </div>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {status.description}
              </p>
            </div>
          </div>

          {showAvailabilityControl && (
            <div className="shrink-0">
              {activeDelivery ? (
                <Badge
                  variant="warning"
                  size="md"
                  dot
                >
                  Delivery in progress
                </Badge>
              ) : !online ? (
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  disabled={
                    loading ||
                    !onToggleAvailability ||
                    verificationStatus !==
                      "verified"
                  }
                  loading={loading}
                  onClick={() =>
                    onToggleAvailability?.(
                      true,
                    )
                  }
                >
                  Go Online
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    loading ||
                    !onToggleAvailability ||
                    !canToggleAvailability
                  }
                  loading={loading}
                  onClick={() =>
                    onToggleAvailability?.(
                      false,
                    )
                  }
                >
                  {availability ===
                  "available"
                    ? "Stop Receiving"
                    : "Go Available"}
                </Button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div
            className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              <Radio
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
              Presence
            </div>

            <p className="mt-1.5 text-sm font-semibold text-slate-900">
              {online ? "Online" : "Offline"}
            </p>

            {!online &&
              lastSeenAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Last seen{" "}
                  {formatRelativeDate(
                    lastSeenAt,
                  )}
                </p>
              )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              <CircleCheck
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
              Availability
            </div>

            <p className="mt-1.5 text-sm font-semibold text-slate-900">
              {availability ===
              "available"
                ? "Available"
                : "Unavailable"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              <Truck
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
              Delivery
            </div>

            <p className="mt-1.5 text-sm font-semibold text-slate-900">
              {activeDelivery
                ? "On Delivery"
                : "No Active Delivery"}
            </p>
          </div>

          {showVerification && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                <CircleCheck
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                Verification
              </div>

              <div className="mt-1.5">
                <Badge
                  variant={
                    verification.variant
                  }
                  size="sm"
                >
                  {verification.label}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {(showOperatingArea ||
          showVehicle) && (
          <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
            {showOperatingArea &&
              operatingArea && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <MapPin
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Operating Area
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {operatingArea}
                    </p>
                  </div>
                </div>
              )}

            {showVehicle &&
              vehicleType && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <CarFront
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Vehicle
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {getVehicleLabel(
                        vehicleType,
                      )}
                    </p>
                  </div>
                </div>
              )}
          </div>
        )}

        {activeDelivery && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <Clock3
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-medium text-amber-900">
                Rider is currently on a
                delivery
              </p>

              <p className="mt-0.5 text-xs leading-5 text-amber-700">
                New delivery requests
                should not be assigned until
                the active delivery is
                completed.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
