import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, UserCog, UserMinus, RefreshCw, LockKeyhole } from "lucide-react";
import { getCurrentProfile } from "@/libs/auth";
import { getSafeErrorMessage } from "@/libs/errors";
import { formatDateTime } from "@/libs/format";
import { listAdminUsers, revokeAdminRole, setAdminUserRole } from "@/services/admin";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Select from "@/components/ui/Select";

const ADMIN_ROLES = ["super_admin", "operations", "support", "finance", "compliance", "read_only"] as const;

type UserRow = { id: string; full_name: string | null; phone: string | null; role: string; admin_role: string | null; is_active: boolean; created_at: string; updated_at: string };

function roleLabel(role: string | null) { return String(role ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

export default function Admins() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const profile = await getCurrentProfile();
      setCurrentUserId(profile?.id ?? null);
      setIsSuperAdmin(profile?.role === "admin" && profile?.admin_role === "super_admin");
      if (profile?.role !== "admin" || profile?.admin_role !== "super_admin") return;
      const rows = (await listAdminUsers()) as UserRow[];
      setUsers(rows);
      setSelectedRoles(Object.fromEntries(rows.map((row) => [row.id, row.admin_role ?? "operations"])));
    } catch (err) { setError(getSafeErrorMessage(err)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const adminUsers = useMemo(() => users.filter((user) => user.role === "admin"), [users]);
  const assignableUsers = useMemo(() => users.filter((user) => user.role === "customer"), [users]);

  async function assign(userId: string) { try { setSavingId(userId); setError(""); setNotice(""); await setAdminUserRole(userId, selectedRoles[userId] ?? "operations"); setNotice("Administrator access updated successfully."); await load(); } catch (err) { setError(getSafeErrorMessage(err)); } finally { setSavingId(null); } }
  async function revoke(userId: string) { try { setSavingId(userId); setError(""); setNotice(""); await revokeAdminRole(userId); setNotice("Administrator access revoked successfully."); await load(); } catch (err) { setError(getSafeErrorMessage(err)); } finally { setSavingId(null); } }

  if (loading) return <PageContainer><div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">Loading administrator access...</div></PageContainer>;
  if (error && !isSuperAdmin) return <PageContainer><ErrorState message={error} onAction={() => void load()} /></PageContainer>;
  if (!isSuperAdmin) return <PageContainer><EmptyState icon={<LockKeyhole className="h-6 w-6" />} title="Super administrator access required" description="Only a super administrator can assign or revoke administrator roles." /></PageContainer>;

  return <PageContainer size="full"><div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-medium text-brand-600">Access control</p><h1 className="mt-1 text-2xl font-bold text-ink-950">Administrators</h1><p className="mt-1 text-sm text-slate-600">Assign, change or revoke administrative roles without hardcoded users.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="h-4 w-4" />Refresh</Button></div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><ShieldCheck className="h-5 w-5" /></div><div><h2 className="font-semibold text-ink-950">Current administrators</h2><p className="text-sm text-slate-600">Live records from the profiles table.</p></div></div>
      {adminUsers.length === 0 ? <EmptyState title="No administrators found" description="Assign the first administrator below." /> : <div className="mt-5 divide-y divide-slate-100">{adminUsers.map((user) => <div key={user.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-ink-950">{user.full_name || "Unnamed user"}</p><Badge variant={user.admin_role === "super_admin" ? "success" : "info"}>{roleLabel(user.admin_role)}</Badge></div><p className="mt-1 text-sm text-slate-600">{user.phone || "No phone number"} · {user.is_active ? "Active" : "Inactive"}</p><p className="mt-1 text-xs text-slate-400">Created {formatDateTime(user.created_at)}</p></div>{user.id !== currentUserId && <Button variant="danger" size="sm" loading={savingId === user.id} onClick={() => void revoke(user.id)}><UserMinus className="h-4 w-4" />Revoke</Button>}</div>)}</div>}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><UserCog className="h-5 w-5" /></div><div><h2 className="font-semibold text-ink-950">Assign administrator</h2><p className="text-sm text-slate-600">Select an existing platform user and assign a permission level.</p></div></div>
      {assignableUsers.length === 0 ? <EmptyState className="mt-5" title="No users available for assignment" description="New users will appear here automatically after registration." /> : <div className="mt-5 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b border-slate-200 text-left"><th className="px-3 py-3 font-semibold text-slate-600">User</th><th className="px-3 py-3 font-semibold text-slate-600">Current role</th><th className="px-3 py-3 font-semibold text-slate-600">Admin permission</th><th className="px-3 py-3 text-right font-semibold text-slate-600">Action</th></tr></thead><tbody>{assignableUsers.map((user) => <tr key={user.id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-4"><p className="font-medium text-ink-950">{user.full_name || "Unnamed user"}</p><p className="text-xs text-slate-500">{user.phone || "No phone number"}</p></td><td className="px-3 py-4"><Badge variant="default">{roleLabel(user.role)}</Badge></td><td className="px-3 py-4"><Select value={selectedRoles[user.id] ?? "operations"} onChange={(event) => setSelectedRoles((current) => ({ ...current, [user.id]: event.target.value }))} options={ADMIN_ROLES.map((role) => ({ value: role, label: roleLabel(role) }))} /></td><td className="px-3 py-4 text-right"><Button size="sm" loading={savingId === user.id} onClick={() => void assign(user.id)}>Assign</Button></td></tr>)}</tbody></table></div>}
    </section>
  </div></PageContainer>;
}
