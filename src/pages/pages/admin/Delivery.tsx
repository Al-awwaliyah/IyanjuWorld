import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  Search,
  XCircle,
} from "lucide-react";

import PageContainer from "../../components/layout/PageContainer";
import AdminFilters from "../../components/admin/AdminFilters";
import AdminTable, {
  type AdminTableColumn,
  type AdminTableRowAction,
} from "../../components/admin/AdminTable";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

type DeliveryZone = {
  id: string;
  name: string;
  state: string;
  city: string | null;
  baseFee: number;
  perKmFee: number;
  minimumFee: number;
  maximumFee: number | null;
  freeDeliveryThreshold: number | null;
  maxDistanceKm: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const initialZones: DeliveryZone[] = [
  {
    id: "zone-001",
    name: "Ibadan Central",
    state: "Oyo",
    city: "Ibadan",
    baseFee: 1000,
    perKmFee: 150,
    minimumFee: 1000,
    maximumFee: 5000,
    freeDeliveryThreshold: 50000,
    maxDistanceKm: 25,
    active: true,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-10T12:00:00.000Z",
  },
  {
    id: "zone-002",
    name: "Lagos Mainland",
    state: "Lagos",
    city: "Lagos",
    baseFee: 1500,
    perKmFee: 200,
    minimumFee: 1500,
    maximumFee: 8000,
    freeDeliveryThreshold: 75000,
    maxDistanceKm: 30,
    active: true,
    createdAt: "2026-09-02T09:00:00.000Z",
    updatedAt: "2026-09-09T14:00:00.000Z",
  },
  {
    id: "zone-003",
    name: "Oyo State",
    state: "Oyo",
    city: null,
    baseFee: 2000,
    perKmFee: 180,
    minimumFee: 2000,
    maximumFee: 10000,
    freeDeliveryThreshold: null,
    maxDistanceKm: 60,
    active: true,
    createdAt: "2026-09-03T10:00:00.000Z",
    updatedAt: "2026-09-08T11:00:00.000Z",
  },
  {
    id: "zone-004",
    name: "Osun State",
    state: "Osun",
    city: null,
    baseFee: 1800,
    perKmFee: 170,
    minimumFee: 1800,
    maximumFee: 9000,
    freeDeliveryThreshold: 60000,
    maxDistanceKm: 55,
    active: false,
    createdAt: "2026-09-04T10:00:00.000Z",
    updatedAt: "2026-09-07T15:00:00.000Z",
  },
];

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function formatAmount(amount: number | null) {
  if (amount === null) {
    return "—";
  }

  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDistance(distance: number | null) {
  if (distance === null) {
    return "—";
  }

  return `${distance.toLocaleString("en-NG")} km`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function Delivery() {
  const [zones, setZones] =
    useState<DeliveryZone[]>(initialZones);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] =
    useState<DeliveryZone | null>(null);

  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [baseFee, setBaseFee] = useState("0");
  const [perKmFee, setPerKmFee] = useState("0");
  const [minimumFee, setMinimumFee] = useState("0");
  const [maximumFee, setMaximumFee] = useState("");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] =
    useState("");
  const [maxDistanceKm, setMaxDistanceKm] =
    useState("");

  const filteredZones = useMemo(() => {
    const query = search.trim().toLowerCase();

    return zones.filter((zone) => {
      const matchesSearch =
        !query ||
        zone.name.toLowerCase().includes(query) ||
        zone.state.toLowerCase().includes(query) ||
        zone.city?.toLowerCase().includes(query);

      const matchesStatus =
        !status ||
        (status === "active" ? zone.active : !zone.active);

      return matchesSearch && matchesStatus;
    });
  }, [zones, search, status]);

  const resetForm = () => {
    setName("");
    setState("");
    setCity("");
    setBaseFee("0");
    setPerKmFee("0");
    setMinimumFee("0");
    setMaximumFee("");
    setFreeDeliveryThreshold("");
    setMaxDistanceKm("");
    setEditingZone(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setName(zone.name);
    setState(zone.state);
    setCity(zone.city || "");
    setBaseFee(String(zone.baseFee));
    setPerKmFee(String(zone.perKmFee));
    setMinimumFee(String(zone.minimumFee));
    setMaximumFee(
      zone.maximumFee === null
        ? ""
        : String(zone.maximumFee),
    );
    setFreeDeliveryThreshold(
      zone.freeDeliveryThreshold === null
        ? ""
        : String(zone.freeDeliveryThreshold),
    );
    setMaxDistanceKm(
      zone.maxDistanceKm === null
        ? ""
        : String(zone.maxDistanceKm),
    );
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const parseNumber = (
    value: string,
    fallback = 0,
  ) => {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const parseNullableNumber = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);

    return Number.isFinite(parsed) ? parsed : null;
  };

  const saveZone = () => {
    const trimmedName = name.trim();
    const trimmedState = state.trim();

    if (!trimmedName || !trimmedState) {
      return;
    }

    const nextBaseFee = Math.max(
      0,
      parseNumber(baseFee),
    );

    const nextPerKmFee = Math.max(
      0,
      parseNumber(perKmFee),
    );

    const nextMinimumFee = Math.max(
      0,
      parseNumber(minimumFee),
    );

    const nextMaximumFee = parseNullableNumber(
      maximumFee,
    );

    const nextFreeDeliveryThreshold =
      parseNullableNumber(freeDeliveryThreshold);

    const nextMaxDistanceKm =
      parseNullableNumber(maxDistanceKm);

    if (editingZone) {
      setZones((current) =>
        current.map((zone) =>
          zone.id === editingZone.id
            ? {
                ...zone,
                name: trimmedName,
                state: trimmedState,
                city: city.trim() || null,
                baseFee: nextBaseFee,
                perKmFee: nextPerKmFee,
                minimumFee: nextMinimumFee,
                maximumFee: nextMaximumFee,
                freeDeliveryThreshold:
                  nextFreeDeliveryThreshold,
                maxDistanceKm: nextMaxDistanceKm,
                updatedAt: new Date().toISOString(),
              }
            : zone,
        ),
      );
    } else {
      const newZone: DeliveryZone = {
        id: `zone-${Date.now()}`,
        name: trimmedName,
        state: trimmedState,
        city: city.trim() || null,
        baseFee: nextBaseFee,
        perKmFee: nextPerKmFee,
        minimumFee: nextMinimumFee,
        maximumFee: nextMaximumFee,
        freeDeliveryThreshold:
          nextFreeDeliveryThreshold,
        maxDistanceKm: nextMaxDistanceKm,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setZones((current) => [...current, newZone]);
    }

    closeModal();
  };

  const toggleZone = (zoneId: string) => {
    setZones((current) =>
      current.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              active: !zone.active,
              updatedAt: new Date().toISOString(),
            }
          : zone,
      ),
    );
  };

  const columns: AdminTableColumn<DeliveryZone>[] = [
    {
      id: "zone",
      header: "Delivery zone",
      accessor: "name",
      sortable: true,
      render: (_, zone) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <MapPin className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">
              {zone.name}
            </div>

            <div className="truncate text-xs text-slate-500">
              {zone.city
                ? `${zone.city}, ${zone.state}`
                : `${zone.state} — state-wide`}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "baseFee",
      header: "Base fee",
      accessor: "baseFee",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="font-medium text-slate-800">
          {formatAmount(value)}
        </span>
      ),
    },
    {
      id: "perKm",
      header: "Per km",
      accessor: "perKmFee",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="text-sm text-slate-700">
          {formatAmount(value)}
        </span>
      ),
    },
    {
      id: "minimum",
      header: "Minimum",
      accessor: "minimumFee",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="text-sm text-slate-700">
          {formatAmount(value)}
        </span>
      ),
    },
    {
      id: "maximum",
      header: "Maximum",
      accessor: "maximumFee",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="text-sm text-slate-700">
          {formatAmount(value)}
        </span>
      ),
    },
    {
      id: "freeThreshold",
      header: "Free delivery from",
      accessor: "freeDeliveryThreshold",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="text-sm text-slate-700">
          {formatAmount(value)}
        </span>
      ),
    },
    {
      id: "distance",
      header: "Max distance",
      accessor: "maxDistanceKm",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="text-sm text-slate-700">
          {formatDistance(value)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: "active",
      sortable: true,
      render: (value) => (
        <Badge variant={value ? "success" : "default"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "updated",
      header: "Updated",
      accessor: "updatedAt",
      sortable: true,
      render: (value) => (
        <span className="whitespace-nowrap text-sm text-slate-600">
          {formatDate(value)}
        </span>
      ),
    },
  ];

  const getRowActions = (
    zone: DeliveryZone,
  ): AdminTableRowAction[] => [
    {
      id: "edit",
      label: "Edit delivery zone",
      icon: Edit3,
      onClick: () => openEditModal(zone),
    },
    {
      id: zone.active ? "deactivate" : "activate",
      label: zone.active
        ? "Deactivate zone"
        : "Activate zone",
      icon: zone.active
        ? XCircle
        : CheckCircle2,
      danger: zone.active,
      onClick: () => toggleZone(zone.id),
    },
  ];

  const activeCount = zones.filter(
    (zone) => zone.active,
  ).length;

  const inactiveCount =
    zones.length - activeCount;

  return (
    <PageContainer
      title="Delivery"
      description="Configure delivery zones and customer delivery pricing."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Delivery Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Control where delivery is available and how
              customer delivery fees are calculated.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={openCreateModal}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add delivery zone
          </Button>
        </div>

        <AdminFilters>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search delivery zones..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter delivery zones by status"
          >
            {statusOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("");
            }}
          >
            Clear filters
          </Button>
        </AdminFilters>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Total zones
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {zones.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Active zones
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Inactive zones
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {inactiveCount}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

            <div>
              <p className="font-medium text-blue-900">
                Customer delivery pricing
              </p>

              <p className="mt-1 text-sm text-blue-800">
                The customer pays the calculated delivery fee in
                addition to the product subtotal. The platform
                commission remains separate and is charged to the
                business owner, not added to the customer total.
              </p>
            </div>
          </div>
        </div>

        <AdminTable
          columns={columns}
          data={filteredZones}
          rowKey={(zone) => zone.id}
          getRowActions={getRowActions}
          emptyTitle="No delivery zones found"
          emptyDescription="No delivery zones match the current search or filters."
          selectable
          pagination
          pageSize={10}
          stickyHeader
          striped
        />

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-500">
            Showing {filteredZones.length} of{" "}
            {zones.length} delivery zones
          </p>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={
          editingZone
            ? "Edit delivery zone"
            : "Create delivery zone"
        }
      >
        <div className="space-y-5">
          <Input
            label="Zone name"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="e.g. Ibadan Central"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="State"
              value={state}
              onChange={(event) =>
                setState(event.target.value)
              }
              placeholder="e.g. Oyo"
            />

            <Input
              label="City"
              value={city}
              onChange={(event) =>
                setCity(event.target.value)
              }
              placeholder="Optional city"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Base fee"
              type="number"
              min={0}
              value={baseFee}
              onChange={(event) =>
                setBaseFee(event.target.value)
              }
              placeholder="1000"
            />

            <Input
              label="Fee per kilometre"
              type="number"
              min={0}
              value={perKmFee}
              onChange={(event) =>
                setPerKmFee(event.target.value)
              }
              placeholder="150"
            />

            <Input
              label="Minimum delivery fee"
              type="number"
              min={0}
              value={minimumFee}
              onChange={(event) =>
                setMinimumFee(event.target.value)
              }
              placeholder="1000"
            />

            <Input
              label="Maximum delivery fee"
              type="number"
              min={0}
              value={maximumFee}
              onChange={(event) =>
                setMaximumFee(event.target.value)
              }
              placeholder="Optional"
            />

            <Input
              label="Free delivery threshold"
              type="number"
              min={0}
              value={freeDeliveryThreshold}
              onChange={(event) =>
                setFreeDeliveryThreshold(
                  event.target.value,
                )
              }
              placeholder="Optional"
            />

            <Input
              label="Maximum delivery distance (km)"
              type="number"
              min={0}
              step="0.1"
              value={maxDistanceKm}
              onChange={(event) =>
                setMaxDistanceKm(
                  event.target.value,
                )
              }
              placeholder="Optional"
            />
          </div>

          <div className="rounded-lg bg-slate-50 px-3 py-3">
            <p className="text-xs font-medium text-slate-500">
              Pricing model
            </p>

            <p className="mt-1 text-sm text-slate-700">
              Delivery fee is calculated from the configured base
              fee and distance fee, then constrained by the
              configured minimum and maximum values. A free
              delivery threshold can override the calculated fee
              when the order qualifies.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={closeModal}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              disabled={
                !name.trim() ||
                !state.trim()
              }
              onClick={saveZone}
            >
              {editingZone
                ? "Save changes"
                : "Create delivery zone"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
