import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, Search, UserCheck, UserX } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import AdminFilters from "@/components/admin/AdminFilters";
import AdminTable, { type AdminTableColumn, type AdminTableRowAction } from "@/components/admin/AdminTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { supabase } from "@/libs/supabase";
import { getSafeErrorMessage } from "@/libs/errors";
import { formatDate, formatNaira, formatNumber } from "@/libs/format";
import { setCustomerActive } from "@/services/admin";

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  wallet_balance: number;
  pending_wallet_balance: number;
  order_count: number;
  total_spent: number;
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const [{ data: profileRows, error: profileError }, { data: orderRows, error: orderError }, { data: walletRows, error: walletError }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,phone,is_active,created_at,updated_at").eq("role", "customer").order("created_at", { ascending: false }),
        supabase.from("orders").select("customer_id,customer_total,status").limit(5000),
        supabase.from("customer_wallets").select("customer_id,available_balance,pending_balance").limit(5000),
      ]);

      if (profileError) throw profileError;
      if (orderError) throw orderError;
      if (walletError) throw walletError;

      const ordersByCustomer = new Map<string, { count: number; spent: number }>();
      for (const row of orderRows ?? []) {
        const current = ordersByCustomer.get(row.customer_id) ?? { count: 0, spent: 0 };
        current.count += 1;
        if (!["cancelled", "refunded"].includes(String(row.status))) current.spent += Number(row.customer_total ?? 0);
        ordersByCustomer.set(row.customer_id, current);
      }

      const walletsByCustomer = new Map<string, { available: number; pending: number }>();
      for (const row of walletRows ?? []) {
        walletsByCustomer.set(row.customer_id, {
          available: Number(row.available_balance ?? 0),
          pending: Number(row.pending_balance ?? 0),
        });
      }

      setCustomers((profileRows ?? []).map((row) => {
        const orders = ordersByCustomer.get(row.id) ?? { count: 0, spent: 0 };
        const wallet = walletsByCustomer.get(row.id) ?? { available: 0, pending: 0 };
        return { ...row, email: row.email ?? null, wallet_balance: wallet.available, pending_wallet_balance: wallet.pending, order_count: orders.count, total_spent: orders.spent } as Customer;
      }));
    } catch (err) {
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch = !q || [customer.full_name, customer.email, customer.phone].filter(Boolean).join(" ").toLowerCase().includes(q);
      const matchesStatus = !status || (status === "active" ? customer.is_active : !customer.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, status]);

  async function changeActive(customer: Customer, active: boolean) {
    try {
      setSavingId(customer.id); setError("");
      await setCustomerActive(customer.id, active);
      setCustomers((rows) => rows.map((row) => row.id === customer.id ? { ...row, is_active: active } : row));
    } catch (err) {
      setError(getSafeErrorMessage(err));
    } finally { setSavingId(null); }
  }

  const columns: AdminTableColumn<Customer>[] = [
    { id: "customer", header: "Customer", accessor: "full_name", sortable: true, render: (_, row) => <div><p className="font-semibold text-ink-950">{row.full_name || "Unnamed customer"}</p><p className="text-xs text-slate-500">{row.email || row.phone || "No contact information"}</p></div> },
    { id: "phone", header: "Phone", accessor: "phone", sortable: true, render: (v) => <span className="text-sm text-slate-700">{v || "—"}</span> },
    { id: "status", header: "Status", accessor: "is_active", render: (v) => <Badge variant={v ? "success" : "danger"}>{v ? "Active" : "Inactive"}</Badge> },
    { id: "orders", header: "Orders", accessor: "order_count", sortable: true, align: "right", render: (v) => <span className="font-medium text-slate-700">{formatNumber(Number(v || 0))}</span> },
    { id: "spent", header: "Total spent", accessor: "total_spent", sortable: true, align: "right", render: (v) => <span className="font-semibold text-ink-950">{formatNaira(Number(v || 0))}</span> },
    { id: "wallet", header: "Wallet", accessor: "wallet_balance", sortable: true, align: "right", render: (_, row) => <div className="text-right"><p className="font-semibold text-ink-950">{formatNaira(row.wallet_balance)}</p>{row.pending_wallet_balance > 0 && <p className="text-xs text-slate-500">{formatNaira(row.pending_wallet_balance)} pending</p>}</div> },
    { id: "joined", header: "Joined", accessor: "created_at", sortable: true, render: (v) => <span className="text-sm text-slate-600">{formatDate(v)}</span> },
  ];

  const actions = (row: Customer): AdminTableRowAction[] => [
    { id: "view", label: "View customer", icon: Eye, onClick: () => window.location.assign(`/admin/customers?customerId=${row.id}`) },
    { id: "status", label: row.is_active ? "Deactivate customer" : "Activate customer", icon: row.is_active ? UserX : UserCheck, danger: row.is_active, disabled: savingId === row.id, onClick: () => void changeActive(row, !row.is_active) },
  ];

  if (error && !customers.length) return <PageContainer size="full"><ErrorState message={error} onAction={() => void load()} /></PageContainer>;

  return <PageContainer size="full"><div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-medium text-brand-600">Customer operations</p><h1 className="mt-1 text-2xl font-bold text-ink-950">Customers</h1><p className="mt-1 text-sm text-slate-600">Live customer accounts, orders and wallet balances from Supabase.</p></div><Button variant="outline" onClick={() => void load(true)} loading={refreshing}><RefreshCw className="h-4 w-4" />Refresh</Button></div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <AdminFilters><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers by name, email or phone..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"/></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></AdminFilters>
    <div className="grid gap-4 sm:grid-cols-3"><Stat label="Customers" value={customers.length}/><Stat label="Active" value={customers.filter((c) => c.is_active).length}/><Stat label="Inactive" value={customers.filter((c) => !c.is_active).length}/></div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><AdminTable columns={columns} data={filtered} rowKey={(row) => row.id} getRowActions={actions} loading={loading} emptyTitle="No customers found" emptyDescription="Customer accounts will appear here after real users register." pagination pageSize={20} stickyHeader striped/></div>
  </div></PageContainer>;
}
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-ink-950">{value.toLocaleString()}</p></div>; }
