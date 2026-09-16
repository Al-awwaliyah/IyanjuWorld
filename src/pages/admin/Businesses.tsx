import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../libs/supabase";
import {
  CheckCircle2,
  Eye,
  MoreHorizontal,
  RefreshCw,
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
import { getSafeErrorMessage } from "../../libs/errors";
import { setBusinessStatus, setBusinessVerification } from "../../services/admin";

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
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select(`
        id,name,slug,phone,city,state,status,is_verified,is_open,created_at,
        owner:profiles!businesses_created_by_fkey(full_name),
        products(count),
        orders(count)
      `)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!mounted) return;
        setBusinesses((data ?? []).map((row: any) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          ownerName: row.owner?.full_name ?? "—",
          phone: row.phone ?? "—",
          city: row.city ?? "—",
          state: row.state ?? "—",
          status: row.status,
          verified: row.is_verified === true,
          open: row.is_open !== false,
          products: Number(row.products?.[0]?.count ?? 0),
          orders: Number(row.orders?.[0]?.count ?? 0),
          createdAt: row.created_at,
        })));
      } catch (error: unknown) {
        if (mounted) setActionError(getSafeErrorMessage(error));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => { mounted = false; };
  }, []);

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

  const updateBusinessStatus = async (businessId: string, nextStatus: BusinessStatus) => {
    try {
      setSavingId(businessId); setActionError("");
      await setBusinessStatus(businessId, nextStatus);
      setBusinesses((current) => current.map((business) => business.id === businessId ? { ...business, status: nextStatus, open: nextStatus === "active" ? business.open : false } : business));
    } catch (error) { setActionError(getSafeErrorMessage(error)); } finally { setSavingId(null); }
  };

  const toggleVerification = async (businessId: string, currentVerified: boolean) => {
    try {
      setSavingId(businessId); setActionError("");
      await setBusinessVerification(businessId, !currentVerified);
      setBusinesses((current) => current.map((business) => business.id === businessId ? { ...business, verified: !currentVerified, status: !currentVerified && business.status === "pending" ? "active" : business.status } : business));
    } catch (error) { setActionError(getSafeErrorMessage(error)); } finally { setSavingId(null); }
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
      id: "actions",
      header: "Actions",
      align: "right",
      render: (_, business) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant={business.verified ? "outline" : "default"}
            loading={savingId === business.id}
            onClick={() => void toggleVerification(business.id, business.verified)}
          >
            {business.verified ? <CheckCircle2 className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            {business.verified ? "Verified" : "Verify"}
          </Button>
          {!business.verified && <span className="sr-only">Business requires verification</span>}
        </div>
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
      onClick: () => void toggleVerification(business.id, business.verified),
    },
    {
      id: "activate",
      label:
        business.status === "active"
          ? "Suspend business"
          : "Activate business",
      icon: business.status === "active" ? UserX : UserCheck,
      onClick: () =>
        void updateBusinessStatus(
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

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />Refresh
            </Button>
            <Button variant="outline" onClick={() => { setSearch(""); setStatus(""); }}>
              Clear filters
            </Button>
          </div>
        </div>

        {actionError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>}

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
