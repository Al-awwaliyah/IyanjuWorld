import { supabase } from "@/libs/supabase";

type AdminActivityType = "order" | "payment" | "business" | "rider" | "refund" | "payout" | "admin";

export type AdminDashboardData = {
  totalCustomers: number;
  activeCustomers: number;
  totalBusinesses: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  verifiedBusinesses: number;
  totalRiders: number;
  onlineRiders: number;
  availableRiders: number;
  pendingRiders: number;
  verifiedRiders: number;
  ridersOnDelivery: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  platformFees: number;
  pendingPayments: number;
  pendingPayouts: number;
  openRefunds: number;
  recentActivity: Array<{
    id: string;
    type: AdminActivityType;
    title: string;
    description: string;
    createdAt: string;
    amount?: number;
  }>;
};

const count = async (table: string, filters: Array<[string, string, unknown]> = []) => {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [column, operator, value] of filters) {
    if (operator === "eq") query = query.eq(column, value);
    else if (operator === "neq") query = query.neq(column, value);
    else if (operator === "in") query = query.in(column, value as string[]);
  }
  const { count: total, error } = await query;
  if (error) throw error;
  return total ?? 0;
};

const sum = async (table: string, column: string, filters: Array<[string, string, unknown]> = []) => {
  let query = supabase.from(table).select(column);
  for (const [name, operator, value] of filters) {
    if (operator === "eq") query = query.eq(name, value);
    else if (operator === "in") query = query.in(name, value as string[]);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).reduce((total, row) => {
    const value = row && typeof row === "object" ? (row as Record<string, unknown>)[column] : undefined;
    return total + (Number(value) || 0);
  }, 0);
};

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const [
    totalCustomers, activeCustomers, totalBusinesses, activeBusinesses,
    pendingBusinesses, verifiedBusinesses, totalRiders, onlineRiders,
    availableRiders, pendingRiders, verifiedRiders, totalOrders,
    pendingOrders, completedOrders, totalRevenue, platformFees,
    pendingPayments, pendingPayouts, openRefunds, riderAssignments,
    audit,
  ] = await Promise.all([
    count("profiles", [["role", "eq", "customer"]]),
    count("profiles", [["role", "eq", "customer"], ["is_active", "eq", true]]),
    count("businesses"),
    count("businesses", [["status", "eq", "active"]]),
    count("businesses", [["status", "eq", "pending"]]),
    count("businesses", [["is_verified", "eq", true]]),
    count("riders"),
    count("riders", [["is_online", "eq", true]]),
    count("riders", [["availability_status", "eq", "available"], ["is_active", "eq", true], ["verification_status", "eq", "verified"]]),
    count("riders", [["verification_status", "in", ["pending", "under_review"]]]),
    count("riders", [["verification_status", "eq", "verified"]]),
    count("orders"),
    count("orders", [["status", "in", ["pending_payment", "paid", "business_confirmed", "delivery_requested", "rider_assigned", "picked_up", "out_for_delivery"]]]),
    count("orders", [["status", "in", ["completed", "delivered"]]]),
    sum("orders", "customer_total", [["status", "in", ["paid", "business_confirmed", "delivery_requested", "rider_assigned", "picked_up", "out_for_delivery", "completed", "delivered"]]]),
    sum("orders", "platform_fee", [["status", "in", ["paid", "business_confirmed", "delivery_requested", "rider_assigned", "picked_up", "out_for_delivery", "completed", "delivered"]]]),
    count("payment_transactions", [["status", "in", ["created", "pending", "processing"]]]),
    count("payouts", [["status", "in", ["pending", "processing"]]]),
    count("refunds", [["status", "in", ["requested", "approved", "processing"]]]),
    supabase.from("delivery_assignments").select("id, status, rider_id").in("status", ["assigned", "accepted", "picked_up", "out_for_delivery", "in_transit"]),
    supabase.from("audit_logs").select("id, action, entity_type, entity_id, metadata, created_at").order("created_at", { ascending: false }).limit(12),
  ]);

  if (riderAssignments.error) throw riderAssignments.error;
  if (audit.error) throw audit.error;

  const recentActivity = (audit.data ?? []).map((row) => {
    const entityType = String(row.entity_type ?? "admin");
    const type: AdminActivityType = entityType === "order" ? "order" : entityType === "payment_transaction" ? "payment" : entityType === "business" ? "business" : entityType === "rider" ? "rider" : entityType === "refund" ? "refund" : entityType === "payout" ? "payout" : "admin";
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      type,
      title: String(row.action ?? "Platform activity").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: entityType ? `${entityType.replace(/_/g, " ")} activity${row.entity_id ? ` • ${row.entity_id}` : ""}` : "Platform activity",
      createdAt: row.created_at,
      amount: typeof metadata.amount === "number" ? metadata.amount : undefined,
    };
  });

  return {
    totalCustomers, activeCustomers, totalBusinesses, activeBusinesses,
    pendingBusinesses, verifiedBusinesses, totalRiders, onlineRiders,
    availableRiders, pendingRiders, verifiedRiders,
    ridersOnDelivery: riderAssignments.data?.length ?? 0,
    totalOrders, pendingOrders, completedOrders, totalRevenue, platformFees,
    pendingPayments, pendingPayouts, openRefunds, recentActivity,
  };
}

export async function listAdminUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, admin_role, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function setAdminUserRole(userId: string, adminRole: string) {
  const { error } = await supabase.rpc("admin_assign_admin", {
    p_user_id: userId,
    p_admin_role: adminRole,
  });
  if (error) throw error;
}

export async function revokeAdminRole(userId: string) {
  const { error } = await supabase.rpc("admin_revoke_admin", { p_user_id: userId });
  if (error) throw error;
}

export async function setBusinessVerification(businessId: string, verified: boolean) {
  const { error } = await supabase.rpc("admin_set_business_verification", {
    p_business_id: businessId,
    p_verified: verified,
  });
  if (error) throw error;
}

export async function setBusinessStatus(businessId: string, status: string) {
  const { error } = await supabase.rpc("admin_set_business_status", {
    p_business_id: businessId,
    p_status: status,
  });
  if (error) throw error;
}

export async function setRiderVerification(riderId: string, status: string) {
  const { error } = await supabase.rpc("admin_set_rider_verification", {
    p_rider_id: riderId,
    p_status: status,
  });
  if (error) throw error;
}

export async function setRiderActive(riderId: string, active: boolean) {
  const { error } = await supabase.rpc("admin_set_rider_active", {
    p_rider_id: riderId,
    p_active: active,
  });
  if (error) throw error;
}

export async function listAdminAuditLogs(limit = 100) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
