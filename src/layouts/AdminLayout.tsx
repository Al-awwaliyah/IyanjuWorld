import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Activity, Building2, CreditCard, FolderTree, LayoutDashboard, MessageSquare, Package, RotateCcw, Settings, ShieldCheck, Store, Truck, UserCog, Users, Wallet } from "lucide-react";
import DashboardSidebar from "../components/layout/DashboardSidebar";
import DashboardHeader from "../components/layout/DashboardHeader";
import MobileNavigation from "../components/layout/MobileNavigation";
import BackButton from "../components/layout/BackButton";
import { useAuth } from "../hooks/useAuth";

const items = [
  { label: "Dashboard", to: "/admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Administrators", to: "/admin/admins", icon: <UserCog className="h-5 w-5" /> },
  { label: "Customers", to: "/admin/customers", icon: <Users className="h-5 w-5" /> },
  { label: "Businesses", to: "/admin/businesses", icon: <Building2 className="h-5 w-5" /> },
  { label: "Riders", to: "/admin/riders", icon: <Truck className="h-5 w-5" /> },
  { label: "Orders", to: "/admin/orders", icon: <Package className="h-5 w-5" /> },
  { label: "Payments", to: "/admin/payments", icon: <CreditCard className="h-5 w-5" /> },
  { label: "Refunds", to: "/admin/refunds", icon: <RotateCcw className="h-5 w-5" /> },
  { label: "Wallets", to: "/admin/wallets", icon: <Wallet className="h-5 w-5" /> },
  { label: "Categories", to: "/admin/categories", icon: <FolderTree className="h-5 w-5" /> },
  { label: "Delivery", to: "/admin/delivery", icon: <Truck className="h-5 w-5" /> },
  { label: "Messages", to: "/admin/messages", icon: <MessageSquare className="h-5 w-5" /> },
  { label: "Audit", to: "/admin/audit", icon: <Activity className="h-5 w-5" /> },
  { label: "Settings", to: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();
  const title = items.find((item) => location.pathname.startsWith(item.to))?.label ?? "Administration";
  return <div className="iyw-role-shell flex min-h-screen min-w-0 bg-slate-50 text-ink-900">
    <div className="w-0 shrink-0 lg:w-72"><DashboardSidebar brand="IyanjuWorld" items={items} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} footerItems={[{ label: "Back to marketplace", to: "/", icon: <Store className="h-5 w-5" /> }]} />
    </div>
    <div className="flex min-h-screen min-w-0 flex-1 flex-col">
      <DashboardHeader title={title} description="IyanjuWorld administration" userName={profile?.full_name} onMenuClick={() => setMobileOpen(true)} notificationPath="/admin/messages" profilePath="/admin/settings" />
      <main className="flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-6"><BackButton className="px-0 pt-0" /><Outlet /></main>
    </div>
    <MobileNavigation isAuthenticated />
  </div>;
}
