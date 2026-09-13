import {
  Home,
  LayoutGrid,
  ShoppingCart,
  UserRound,
  ClipboardList,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export interface MobileNavigationProps {
  cartCount?: number;
  isAuthenticated?: boolean;
}

export default function MobileNavigation({
  cartCount = 0,
  isAuthenticated = false,
}: MobileNavigationProps) {
  const items = [
    {
      label: "Home",
      to: "/",
      icon: Home,
    },
    {
      label: "Categories",
      to: "/explore",
      icon: LayoutGrid,
    },
    {
      label: "Cart",
      to: "/customer/cart",
      icon: ShoppingCart,
      badge: cartCount,
    },
    {
      label: "Orders",
      to: isAuthenticated ? "/customer/orders" : "/login",
      icon: ClipboardList,
    },
    {
      label: "Account",
      to: isAuthenticated ? "/customer/dashboard" : "/login",
      icon: UserRound,
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(15,23,42,0.06)] lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "relative flex min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-brand-600"
                    : "text-slate-400 hover:text-slate-700",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon
                      className={[
                        "h-5 w-5",
                        isActive ? "stroke-[2.25]" : "stroke-[1.8]",
                      ].join(" ")}
                    />

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-semibold leading-none text-white">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </span>

                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute -top-[9px] h-[3px] w-8 rounded-full bg-brand-500" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
