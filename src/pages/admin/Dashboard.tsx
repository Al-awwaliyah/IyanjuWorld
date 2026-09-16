import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Package,
  ShieldCheck,
  Store,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AdminStats } from "@/components/admin/AdminStats";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { formatDateTime, formatNaira } from "@/libs/format";
import { getSafeErrorMessage } from "@/libs/errors";
import { getAdminDashboard, getAdminVerificationQueue, setBusinessVerification, setRiderVerification, type AdminDashboardData } from "@/services/admin";

const emptyData: AdminDashboardData = {
  totalCustomers: 0, activeCustomers: 0, totalBusinesses: 0, activeBusinesses: 0,
  pendingBusinesses: 0, verifiedBusinesses: 0, totalRiders: 0, onlineRiders: 0,
  availableRiders: 0, pendingRiders: 0, verifiedRiders: 0, ridersOnDelivery: 0,
  totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0,
  platformFees: 0, pendingPayments: 0, pendingPayouts: 0, openRefunds: 0,
  recentActivity: [],
};

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [queue, setQueue] = useState<{ businesses: Array<{ id: string; name: string; status: string }>; riders: Array<{ id: string; full_name: string; phone: string | null; verification_status: string }> }>({ businesses: [], riders: [] });
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueSaving, setQueueSaving] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");
      setDashboard(await getAdminDashboard());
    } catch (err) {
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void (async () => {
      try {
        setQueueLoading(true);
        setQueue(await getAdminVerificationQueue());
      } catch (err) {
        setError(getSafeErrorMessage(err));
      } finally {
        setQueueLoading(false);
      }
    })();
  }, [load]);

  const stats = [
    { id: "customers", label: "Customers", value: dashboard.totalCustomers, format: "number" as const, icon: Users, description: `${dashboard.activeCustomers} active` },
    { id: "businesses", label: "Businesses", value: dashboard.totalBusinesses, format: "number" as const, icon: Store, description: `${dashboard.pendingBusinesses} awaiting review` },
    { id: "riders", label: "Riders", value: dashboard.totalRiders, format: "number" as const, icon: Truck, description: `${dashboard.pendingRiders} awaiting verification` },
    { id: "orders", label: "Orders", value: dashboard.totalOrders, format: "number" as const, icon: Package, description: `${dashboard.pendingOrders} active` },
    { id: "revenue", label: "Marketplace revenue", value: dashboard.totalRevenue, format: "currency" as const, icon: DollarSign, description: `${formatNaira(dashboard.platformFees)} platform fees` },
    { id: "payments", label: "Pending payments", value: dashboard.pendingPayments, format: "number" as const, icon: CreditCard },
    { id: "payouts", label: "Pending payouts", value: dashboard.pendingPayouts, format: "number" as const, icon: Activity },
    { id: "refunds", label: "Open refunds", value: dashboard.openRefunds, format: "number" as const, icon: AlertTriangle },
  ];

  if (error && !loading) {
    return <PageContainer size="full"><ErrorState message={error} onAction={() => void load()} /></PageContainer>;
  }

  return (
    <PageContainer size="full">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-brand-600">IyanjuWorld administration</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-950">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Live marketplace operations, verification, users, orders and financial activity.</p>
          </div>
          <Button variant="outline" onClick={() => void load(true)} loading={refreshing}>Refresh</Button>
        </div>

        <AdminStats stats={stats} loading={loading} columns={4} />

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div><h2 className="text-base font-semibold text-ink-950">Verification queue</h2><p className="mt-1 text-sm text-slate-600">Items that may require an administrator's attention.</p></div>
              <ShieldCheck className="h-5 w-5 text-brand-600" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <QueueCard to="/admin/businesses" icon={Building2} label="Business verification" value={dashboard.pendingBusinesses} description="Businesses awaiting review" />
              <QueueCard to="/admin/riders" icon={Truck} label="Rider verification" value={dashboard.pendingRiders} description="Riders awaiting review" />
              <QueueCard to="/admin/admins" icon={UserCog} label="Administrator access" description="Manage admin roles securely" />
              <QueueCard to="/admin/orders" icon={Package} label="Order operations" value={dashboard.pendingOrders} description="Orders currently active" />
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <VerificationList title="Business verification" loading={queueLoading} items={queue.businesses.map((b) => ({ id: b.id, name: b.name, detail: b.status }))} saving={queueSaving} onVerify={async (id) => { try { setQueueSaving(id); await setBusinessVerification(id, true); setQueue((q) => ({ ...q, businesses: q.businesses.filter((b) => b.id !== id) })); } catch (err) { setError(getSafeErrorMessage(err)); } finally { setQueueSaving(null); } }} />
              <VerificationList title="Rider verification" loading={queueLoading} items={queue.riders.map((r) => ({ id: r.id, name: r.full_name, detail: r.phone || r.verification_status }))} saving={queueSaving} onVerify={async (id) => { try { setQueueSaving(id); await setRiderVerification(id, "verified"); setQueue((q) => ({ ...q, riders: q.riders.filter((r) => r.id !== id) })); } catch (err) { setError(getSafeErrorMessage(err)); } finally { setQueueSaving(null); } }} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-ink-950">Delivery network</h2>
            <p className="mt-1 text-sm text-slate-600">Live rider availability from the database.</p>
            <div className="mt-5 space-y-3">
              <MetricRow label="Online" value={dashboard.onlineRiders} variant="info" />
              <MetricRow label="Available" value={dashboard.availableRiders} variant="success" />
              <MetricRow label="On delivery" value={dashboard.ridersOnDelivery} variant="warning" />
              <MetricRow label="Verified" value={dashboard.verifiedRiders} variant="default" />
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-ink-950">Recent administrative activity</h2><p className="mt-1 text-sm text-slate-600">Only real audit records are shown.</p></div><Link to="/admin/audit" className="text-sm font-semibold text-brand-600 hover:text-brand-700">View audit <ArrowRight className="inline h-4 w-4" /></Link></div>
            {dashboard.recentActivity.length === 0 ? <EmptyState title="No audit activity yet" description="Administrative events will appear here after real platform actions occur." icon={<Activity className="h-6 w-6" />} /> : <div className="divide-y divide-slate-100">{dashboard.recentActivity.slice(0, 8).map((item) => <div key={item.id} className="flex gap-3 py-4 first:pt-0"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Activity className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink-950">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.description}</p><p className="mt-1 text-xs text-slate-400">{formatDateTime(item.createdAt)}</p></div>{item.amount !== undefined && <p className="text-sm font-semibold text-ink-950">{formatNaira(item.amount)}</p>}</div>)}</div>}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-ink-950">Business health</h2>
            <div className="mt-5 space-y-4"><HealthRow label="Active businesses" value={dashboard.activeBusinesses} total={dashboard.totalBusinesses} /><HealthRow label="Verified businesses" value={dashboard.verifiedBusinesses} total={dashboard.totalBusinesses} /><HealthRow label="Completed orders" value={dashboard.completedOrders} total={dashboard.totalOrders} /></div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-base font-semibold text-ink-950">Financial overview</h2><p className="mt-1 text-sm text-slate-600">Values are calculated from actual marketplace transactions.</p></div><Link to="/admin/fees" className="text-sm font-semibold text-brand-600">Fee settings <ArrowRight className="inline h-4 w-4" /></Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Financial label="Revenue" value={dashboard.totalRevenue} /><Financial label="Platform fees" value={dashboard.platformFees} /><Financial label="Pending payouts" value={dashboard.pendingPayouts} count /><Financial label="Open refunds" value={dashboard.openRefunds} count /></div></section>
      </div>
    </PageContainer>
  );
}

function VerificationList({ title, items, loading, saving, onVerify }: { title: string; items: Array<{ id: string; name: string; detail: string }>; loading: boolean; saving: string | null; onVerify: (id: string) => Promise<void> }) {
  return <section className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-ink-950">{title}</h3><span className="text-xs text-slate-500">{items.length} pending</span></div>{loading ? <p className="py-5 text-sm text-slate-500">Loading verification queue...</p> : items.length === 0 ? <p className="py-5 text-sm text-slate-500">No pending records.</p> : <div className="mt-3 divide-y divide-slate-200">{items.slice(0, 5).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink-950">{item.name}</p><p className="truncate text-xs text-slate-500">{item.detail}</p></div><Button size="sm" loading={saving === item.id} onClick={() => void onVerify(item.id)}><CheckCircle2 className="h-4 w-4" />Verify</Button></div>)}</div>}</section>;
}
function QueueCard({ to, icon: Icon, label, value, description }: { to: string; icon: typeof ShieldCheck; label: string; value?: number; description: string }) {
  return <Link to={to} className="group rounded-xl border border-slate-200 p-4 transition hover:border-brand-300 hover:bg-brand-50/50"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" /></div><p className="mt-4 text-sm font-semibold text-ink-950">{label}</p><p className="mt-1 text-xs text-slate-600">{description}</p>{value !== undefined && <p className="mt-3 text-2xl font-bold text-ink-950">{value.toLocaleString()}</p>}</Link>;
}
function MetricRow({ label, value, variant }: { label: string; value: number; variant: "info" | "success" | "warning" | "default" }) { return <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"><Badge variant={variant}>{label}</Badge><span className="font-bold text-ink-950">{value.toLocaleString()}</span></div>; }
function HealthRow({ label, value, total }: { label: string; value: number; total: number }) { const pct = total > 0 ? Math.round((value / total) * 100) : 0; return <div><div className="flex justify-between text-sm"><span className="text-slate-600">{label}</span><span className="font-semibold text-ink-950">{value.toLocaleString()}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(100, pct)}%` }} /></div></div>; }
function Financial({ label, value, count }: { label: string; value: number; count?: boolean }) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-lg font-bold text-ink-950">{count ? value.toLocaleString() : formatNaira(value)}</p></div>; }
