import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageCircle,
  Package,
  Store,
  UserRound,
  Wallet,
} from "lucide-react";

import DashboardSidebar from "../components/layout/DashboardSidebar";
import DashboardHeader from "../components/layout/DashboardHeader";
import MobileNavigation from "../components/layout/MobileNavigation";
import { useAuth } from "../hooks/useAuth";

const ACCOUNT_NAV_ITEMS = [
  { label: "Dashboard", to: "/customer/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "My Orders", to: "/customer/orders", icon: <Package className="h-5 w-5" /> },
  { label: "Wallet", to: "/customer/wallet", icon: <Wallet className="h-5 w-5" /> },
  { label: "Messages", to: "/customer/messages", icon: <MessageCircle className="h-5 w-5" /> },
  { label: "Profile", to: "/customer/profile", icon: <UserRound className="h-5 w-5" /> },
];

const ACCOUNT_FOOTER_ITEMS = [
  { label: "Back to shop", to: "/", icon: <Store className="h-5 w-5" /> },
];

const PAGE_TITLES: Record<string, { title: string; description?: string }> = {
  "/customer/dashboard": { title: "My Account", description: "Welcome back, here's what's happening." },
  "/customer/orders": { title: "My Orders", description: "Track and manage your recent orders." },
  "/customer/wallet": { title: "Wallet", description: "Manage your balance and transactions." },
  "/customer/messages": { title: "Messages", description: "Chat with businesses and riders." },
  "/customer/profile": { title: "Profile", description: "Update your personal information." },
};

// Routes that are part of the transactional flow (cart, checkout, payment)
// use a focused, sidebar-free layout, matching how Jumia treats checkout.
const FOCUSED_FLOW_PREFIXES = [
  "/customer/cart",
  "/customer/checkout",
  "/customer/payment-result",
];

export default function CustomerLayout() {
  const location = useLocation();
  const { profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFocusedFlow = FOCUSED_FLOW_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix),
  );

  if (isFocusedFlow) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
            <a
              href="/"
              className="text-lg font-extrabold tracking-tight text-ink-900"
            >
              Iyanju<span className="text-brand-500">World</span>
            </a>
            <span className="ml-3 truncate text-sm text-slate-400">
              Secure checkout
            </span>
          </div>
        </div>

        <main className="min-h-screen pb-16 lg:pb-0">
          <Outlet />
        </main>

        <MobileNavigation isAuthenticated />
      </div>
    );
  }

  const pageMeta = PAGE_TITLES[location.pathname] ?? { title: "My Account" };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <DashboardSidebar
        brand="IyanjuWorld"
        items={ACCOUNT_NAV_ITEMS}
        footerItems={ACCOUNT_FOOTER_ITEMS}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <DashboardHeader
          title={pageMeta.title}
          description={pageMeta.description}
          userName={profile?.full_name}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-6">
          <Outlet />
        </main>
      </div>

      <MobileNavigation isAuthenticated />
    </div>
  );
}
