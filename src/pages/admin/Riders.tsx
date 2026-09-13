import { useMemo, useState } from "react";
import {
  Bike,
  CheckCircle2,
  Eye,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";

import PageContainer from "../../components/layout/PageContainer";
import AdminFilters from "../../components/admin/AdminFilters";
import AdminTable, {
  type AdminTableColumn,
  type AdminTableRowAction,
} from "../../components/admin/AdminTable";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { formatDate } from "../../libs/format";

type RiderVerificationStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "suspended";

type RiderAvailability = "available" | "unavailable";

type RiderPresenceStatus = "online" | "offline";

type RiderVisibleStatus =
  | "available"
  | "online"
  | "on_delivery"
  | "offline";

type VehicleType =
  | "bicycle"
  | "motorcycle"
  | "car"
  | "van"
  | "other";

type Rider = {
  id: string;
  fullName: string;
  phone: string;
  city: string;
  state: string;
  vehicleType: VehicleType;
  verificationStatus: RiderVerificationStatus;
  availability: RiderAvailability;
  presenceStatus: RiderPresenceStatus;
  activeDelivery: boolean;
  operatingArea: string;
  earnings: number;
  completedDeliveries: number;
  createdAt: string;
};

const demoRiders: Rider[] = [
  {
    id: "rider-001",
    fullName: "Rider One",
    phone: "+234 803 000 0000",
    city: "Ibadan",
    state: "Oyo",
    vehicleType: "motorcycle",
    verificationStatus: "verified",
    availability: "available",
    presenceStatus: "online",
    activeDelivery: false,
    operatingArea: "Ibadan",
    earnings: 185000,
    completedDeliveries: 74,
    createdAt: "2026-09-05T09:00:00.000Z",
  },
  {
    id: "rider-002",
    fullName: "Rider Two",
    phone: "+234 804 000 0000",
    city: "Osogbo",
    state: "Osun",
    vehicleType: "motorcycle",
    verificationStatus: "under_review",
    availability: "unavailable",
    presenceStatus: "offline",
    activeDelivery: false,
    operatingArea: "Osogbo",
    earnings: 72000,
    completedDeliveries: 31,
    createdAt: "2026-09-08T13:15:00.000Z",
  },
  {
    id: "rider-003",
    fullName: "Rider Three",
    phone: "+234 805 000 0000",
    city: "Lagos",
    state: "Lagos",
    vehicleType: "car",
    verificationStatus: "verified",
    availability: "available",
    presenceStatus: "online",
    activeDelivery: true,
    operatingArea: "Lagos Mainland",
    earnings: 312000,
    completedDeliveries: 116,
    createdAt: "2026-08-28T11:45:00.000Z",
  },
];

const verificationOptions = [
  { value: "", label: "All verification statuses" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const availabilityOptions = [
  { value: "", label: "All availability" },
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Unavailable" },
];

function getVerificationVariant(
  status: RiderVerificationStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "verified":
      return "success";
    case "pending":
    case "under_review":
      return "warning";
    case "rejected":
    case "suspended":
      return "danger";
    default:
      return "default";
  }
}

function getVerificationLabel(status: RiderVerificationStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "under_review":
      return "Under review";
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    case "suspended":
      return "Suspended";
    default:
      return status;
  }
}

function getVehicleLabel(vehicle: VehicleType) {
  switch (vehicle) {
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
      return vehicle;
  }
}

function getVisibleStatus(rider: Rider): RiderVisibleStatus {
  if (rider.activeDelivery) {
    return "on_delivery";
  }

  if (
    rider.presenceStatus === "online" &&
    rider.availability === "available"
  ) {
    return "available";
  }

  if (rider.presenceStatus === "online") {
    return "online";
  }

  return "offline";
}

function getVisibleStatusLabel(status: RiderVisibleStatus) {
  switch (status) {
    case "available":
      return "Available";
    case "online":
      return "Online";
    case "on_delivery":
      return "On delivery";
    case "offline":
      return "Offline";
    default:
      return status;
  }
}

function getVisibleStatusVariant(
  status: RiderVisibleStatus,
): "success" | "warning" | "default" {
  switch (status) {
    case "available":
      return "success";
    case "online":
    case "on_delivery":
      return "warning";
    case "offline":
    default:
      return "default";
  }
}

export default function Riders() {
  const [riders, setRiders] = useState<Rider[]>(demoRiders);
  const [search, setSearch] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [availability, setAvailability] = useState("");

  const filteredRiders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return riders.filter((rider) => {
      const matchesSearch =
        !query ||
        rider.fullName.toLowerCase().includes(query) ||
        rider.phone.toLowerCase().includes(query) ||
        rider.city.toLowerCase().includes(query) ||
        rider.state.toLowerCase().includes(query) ||
        rider.operatingArea.toLowerCase().includes(query);

      const matchesVerification =
        !verificationStatus ||
        rider.verificationStatus === verificationStatus;

      const matchesAvailability =
        !availability || rider.availability === availability;

      return (
        matchesSearch &&
        matchesVerification &&
        matchesAvailability
      );
    });
  }, [riders, search, verificationStatus, availability]);

  const updateVerificationStatus = (
    riderId: string,
    nextStatus: RiderVerificationStatus,
  ) => {
    setRiders((current) =>
      current.map((rider) =>
        rider.id === riderId
          ? {
              ...rider,
              verificationStatus: nextStatus,
              availability:
                nextStatus === "verified"
                  ? rider.availability
                  : "unavailable",
            }
          : rider,
      ),
    );
  };

  const toggleAvailability = (riderId: string) => {
    setRiders((current) =>
      current.map((rider) =>
        rider.id === riderId
          ? {
              ...rider,
              availability:
                rider.availability === "available"
                  ? "unavailable"
                  : "available",
            }
          : rider,
      ),
    );
  };

  const columns: AdminTableColumn<Rider>[] = [
    {
      id: "rider",
      header: "Rider",
      accessor: "fullName",
      sortable: true,
      render: (_, rider) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Bike className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">
              {rider.fullName}
            </div>

            <div className="truncate text-xs text-slate-500">
              {rider.phone}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "location",
      header: "Location",
      accessor: "city",
      sortable: true,
      render: (_, rider) => (
        <div>
          <div className="text-sm font-medium text-slate-800">
            {rider.city}, {rider.state}
          </div>

          <div className="text-xs text-slate-500">
            {rider.operatingArea}
          </div>
        </div>
      ),
    },
    {
      id: "vehicle",
      header: "Vehicle",
      accessor: "vehicleType",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-slate-700">
          {getVehicleLabel(value)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: "verificationStatus",
      sortable: true,
      render: (_, rider) => {
        const visibleStatus = getVisibleStatus(rider);

        return (
          <Badge variant={getVisibleStatusVariant(visibleStatus)}>
            {getVisibleStatusLabel(visibleStatus)}
          </Badge>
        );
      },
    },
    {
      id: "verification",
      header: "Verification",
      accessor: "verificationStatus",
      sortable: true,
      render: (value) => (
        <Badge variant={getVerificationVariant(value)}>
          {getVerificationLabel(value)}
        </Badge>
      ),
    },
    {
      id: "deliveries",
      header: "Deliveries",
      accessor: "completedDeliveries",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="font-medium text-slate-800">{value}</span>
      ),
    },
    {
      id: "earnings",
      header: "Earnings",
      accessor: "earnings",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="font-medium text-slate-800">
          ₦{value.toLocaleString("en-NG")}
        </span>
      ),
    },
    {
      id: "joined",
      header: "Joined",
      accessor: "createdAt",
      sortable: true,
      render: (value) => (
        <span className="whitespace-nowrap text-sm text-slate-600">
          {formatDate(value)}
        </span>
      ),
    },
  ];

  const getRowActions = (
    rider: Rider,
  ): AdminTableRowAction[] => [
    {
      id: "view",
      label: "View rider",
      icon: Eye,
      onClick: () => {
        window.location.href = `/rider/profile?id=${encodeURIComponent(
          rider.id,
        )}`;
      },
    },
    {
      id: "verify",
      label:
        rider.verificationStatus === "verified"
          ? "Suspend rider"
          : "Verify rider",
      icon:
        rider.verificationStatus === "verified"
          ? UserX
          : UserCheck,
      onClick: () =>
        updateVerificationStatus(
          rider.id,
          rider.verificationStatus === "verified"
            ? "suspended"
            : "verified",
        ),
      danger: rider.verificationStatus === "verified",
    },
    {
      id: "availability",
      label:
        rider.availability === "available"
          ? "Stop receiving deliveries"
          : "Make available",
      icon:
        rider.availability === "available"
          ? UserX
          : CheckCircle2,
      onClick: () => toggleAvailability(rider.id),
      disabled:
        rider.verificationStatus !== "verified" ||
        rider.activeDelivery,
    },
  ];

  return (
    <PageContainer
      title="Riders"
      description="Manage rider verification, availability, delivery activity, and earnings."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Rider Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Verify riders and monitor the delivery network.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setVerificationStatus("");
              setAvailability("");
            }}
          >
            Clear filters
          </Button>
        </div>

        <AdminFilters>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search riders, phone or operating area..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={verificationStatus}
            onChange={(event) =>
              setVerificationStatus(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter riders by verification status"
          >
            {verificationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={availability}
            onChange={(event) =>
              setAvailability(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter riders by availability"
          >
            {availabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </AdminFilters>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Total riders</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {riders.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Verified</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {
                riders.filter(
                  (rider) =>
                    rider.verificationStatus === "verified",
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Available</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {
                riders.filter(
                  (rider) =>
                    rider.verificationStatus === "verified" &&
                    rider.availability === "available" &&
                    rider.presenceStatus === "online" &&
                    !rider.activeDelivery,
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">On delivery</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {riders.filter((rider) => rider.activeDelivery).length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Pending review</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {
                riders.filter(
                  (rider) =>
                    rider.verificationStatus === "pending" ||
                    rider.verificationStatus === "under_review",
                ).length
              }
            </p>
          </div>
        </div>

        <AdminTable
          columns={columns}
          data={filteredRiders}
          rowKey={(rider) => rider.id}
          getRowActions={getRowActions}
          emptyTitle="No riders found"
          emptyDescription="No riders match the current search or filters."
          selectable
          pagination
          pageSize={10}
          stickyHeader
          striped
        />

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {filteredRiders.length} of {riders.length} riders
          </p>

          <p className="text-xs text-slate-400">
            Riders with an active delivery cannot receive another delivery
            request.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
