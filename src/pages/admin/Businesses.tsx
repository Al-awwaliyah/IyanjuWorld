import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  MoreHorizontal,
  Search,
  Store,
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

type BusinessStatus =
  | "pending"
  | "active"
  | "suspended"
  | "rejected"
  | "closed";

type Business = {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  phone: string;
  city: string;
  state: string;
  status: BusinessStatus;
  verified: boolean;
  open: boolean;
  products: number;
  orders: number;
  createdAt: string;
};

const demoBusinesses: Business[] = [
  {
    id: "business-001",
    name: "Aremu Fashion Store",
    slug: "aremu-fashion-store",
    ownerName: "Business Owner",
    phone: "+234 800 000 0000",
    city: "Ibadan",
    state: "Oyo",
    status: "active",
    verified: true,
    open: true,
    products: 42,
    orders: 128,
    createdAt: "2026-09-10T10:00:00.000Z",
  },
  {
    id: "business-002",
    name: "Iyanju Foods",
    slug: "iyanju-foods",
    ownerName: "Business Owner",
    phone: "+234 801 000 0000",
    city: "Osogbo",
    state: "Osun",
    status: "pending",
    verified: false,
    open: false,
    products: 18,
    orders: 0,
    createdAt: "2026-09-11T09:30:00.000Z",
  },
  {
    id: "business-003",
    name: "Tech Accessories Hub",
    slug: "tech-accessories-hub",
    ownerName: "Business Owner",
    phone: "+234 802 000 0000",
    city: "Lagos",
    state: "Lagos",
    status: "active",
    verified: true,
    open: true,
    products: 76,
    orders: 245,
    createdAt: "2026-09-08T14:20:00.000Z",
  },
];

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "rejected", label: "Rejected" },
  { value: "closed", label: "Closed" },
];

function getStatusVariant(
  status: BusinessStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "active":
      return "success";
    case "pending":
      return "warning";
    case "suspended":
    case "rejected":
      return "danger";
    case "closed":
    default:
      return "default";
  }
}

function getStatusLabel(status: BusinessStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "active":
      return "Active";
    case "suspended":
      return "Suspended";
    case "rejected":
      return "Rejected";
    case "closed":
      return "Closed";
    default:
      return status;
  }
}

export default function Businesses() {
  const [businesses, setBusinesses] = useState<Business[]>(demoBusinesses);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return businesses.filter((business) => {
      const matchesSearch =
        !query ||
        business.name.toLowerCase().includes(query) ||
        business.ownerName.toLowerCase().includes(query) ||
        business.city.toLowerCase().includes(query) ||
        business.state.toLowerCase().includes(query) ||
        business.phone.toLowerCase().includes(query);

      const matchesStatus = !status || business.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [businesses, search, status]);

  const updateBusinessStatus = (
    businessId: string,
    nextStatus: BusinessStatus,
  ) => {
    setBusinesses((current) =>
      current.map((business) =>
        business.id === businessId
          ? {
              ...business,
              status: nextStatus,
              open:
                nextStatus === "active" ? business.open : false,
            }
          : business,
      ),
    );
  };

  const toggleVerification = (businessId: string) => {
    setBusinesses((current) =>
      current.map((business) =>
        business.id === businessId
          ? {
              ...business,
              verified: !business.verified,
            }
          : business,
      ),
    );
  };

  const columns: AdminTableColumn<Business>[] = [
    {
      id: "business",
      header: "Business",
      accessor: "name",
      sortable: true,
      render: (_, business) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Store className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">
              {business.name}
            </div>

            <div className="truncate text-xs text-slate-500">
              {business.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "owner",
      header: "Owner",
      accessor: "ownerName",
      sortable: true,
      render: (_, business) => (
        <div>
          <div className="font-medium text-slate-800">
            {business.ownerName}
          </div>
          <div className="text-xs text-slate-500">
            {business.phone}
          </div>
        </div>
      ),
    },
    {
      id: "location",
      header: "Location",
      accessor: "city",
      sortable: true,
      render: (_, business) => (
        <div className="text-sm text-slate-700">
          {business.city}, {business.state}
        </div>
      ),
    },
    {
      id: "products",
      header: "Products",
      accessor: "products",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="font-medium text-slate-800">{value}</span>
      ),
    },
    {
      id: "orders",
      header: "Orders",
      accessor: "orders",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="font-medium text-slate-800">{value}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (value) => (
        <Badge variant={getStatusVariant(value)}>
          {getStatusLabel(value)}
        </Badge>
      ),
    },
    {
      id: "verification",
      header: "Verification",
      accessor: "verified",
      render: (value) => (
        <Badge variant={value ? "success" : "warning"}>
          {value ? "Verified" : "Unverified"}
        </Badge>
      ),
    },
    {
      id: "created",
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
    business: Business,
  ): AdminTableRowAction[] => [
    {
      id: "view",
      label: "View business",
      icon: Eye,
      onClick: () => {
        window.location.href = `/businesses/${business.slug}`;
      },
    },
    {
      id: "verify",
      label: business.verified
        ? "Remove verification"
        : "Verify business",
      icon: business.verified ? UserX : UserCheck,
      onClick: () => toggleVerification(business.id),
    },
    {
      id: "activate",
      label:
        business.status === "active"
          ? "Suspend business"
          : "Activate business",
      icon: business.status === "active" ? UserX : UserCheck,
      onClick: () =>
        updateBusinessStatus(
          business.id,
          business.status === "active" ? "suspended" : "active",
        ),
      danger: business.status === "active",
    },
  ];

  return (
    <PageContainer
      title="Businesses"
      description="Manage marketplace businesses, verification, status, and storefront activity."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Business Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review and manage businesses operating on IyanjuWorld.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("");
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
              placeholder="Search businesses, owners or locations..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter businesses by status"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </AdminFilters>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Total businesses</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {businesses.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Active</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {businesses.filter((item) => item.status === "active").length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Pending review</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {businesses.filter((item) => item.status === "pending").length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Verified</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {businesses.filter((item) => item.verified).length}
            </p>
          </div>
        </div>

        <AdminTable
          columns={columns}
          data={filteredBusinesses}
          rowKey={(business) => business.id}
          getRowActions={getRowActions}
          emptyTitle="No businesses found"
          emptyDescription="No businesses match the current search or status filter."
          selectable
          pagination
          pageSize={10}
          stickyHeader
          striped
        />

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MoreHorizontal className="h-4 w-4" />
            <span>
              Showing {filteredBusinesses.length} of {businesses.length}{" "}
              businesses
            </span>
          </div>

          <Link
            to="/admin/dashboard"
            className="text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
