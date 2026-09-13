import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

export interface DashboardSidebarItem {
  label: string;
  to: string;
  icon: ReactNode;
  badge?: number;
}

export interface DashboardSidebarProps {
  brand?: string;
  items: DashboardSidebarItem[];
  footerItems?: DashboardSidebarItem[];
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function DashboardSidebar({
  brand = "IyanjuWorld",
  items,
  footerItems = [],
  mobileOpen = false,
  onMobileClose,
}: DashboardSidebarProps) {
  const renderItems = (navigationItems: DashboardSidebarItem[]) =>
    navigationItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={onMobileClose}
        className={({ isActive }) =>
          [
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            isActive
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          ].join(" ")
        }
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          {item.icon}
        </span>

        <span className="min-w-0 flex-1 truncate">{item.label}</span>

        {item.badge !== undefined && item.badge > 0 && (
          <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-700">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </NavLink>
    ));

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5">
          <NavLink
            to="/"
            onClick={onMobileClose}
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            {brand}
          </NavLink>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <nav
            aria-label="Dashboard navigation"
            className="flex flex-col gap-1"
          >
            {renderItems(items)}
          </nav>
        </div>

        {footerItems.length > 0 && (
          <div className="shrink-0 border-t border-slate-200 px-4 py-4">
            <nav
              aria-label="Secondary dashboard navigation"
              className="flex flex-col gap-1"
            >
              {renderItems(footerItems)}
            </nav>
          </div>
        )}
      </aside>
    </>
  );
}
