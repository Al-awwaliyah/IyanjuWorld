import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Heart,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import Button from "../ui/Button";

export interface PublicHeaderProps {
  cartCount?: number;
  isAuthenticated?: boolean;
  userName?: string | null;
}

export default function PublicHeader({
  cartCount = 0,
  isAuthenticated = false,
  userName,
}: PublicHeaderProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchValue.trim();

    if (!query) {
      navigate("/search");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(query)}`);
    setMobileOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "text-sm font-medium transition-colors",
      isActive
        ? "text-slate-900"
        : "text-slate-600 hover:text-slate-900",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center gap-4">
          <Link
            to="/"
            className="shrink-0 text-xl font-bold tracking-tight text-slate-900"
            aria-label="IyanjuWorld home"
          >
            IyanjuWorld
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            <NavLink to="/explore" className={navLinkClass}>
              Explore
            </NavLink>

            <NavLink to="/products" className={navLinkClass}>
              Products
            </NavLink>

            <NavLink to="/businesses" className={navLinkClass}>
              Businesses
            </NavLink>
          </nav>

          <form
            onSubmit={handleSearch}
            className="mx-auto hidden w-full max-w-xl md:flex"
          >
            <div className="relative w-full">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              aria-label="Search"
              onClick={() => navigate("/search")}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:hidden"
            >
              <Search className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-label="Wishlist"
              onClick={() => navigate("/customer/profile")}
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:flex"
            >
              <Heart className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              onClick={() => navigate("/customer/cart")}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <ShoppingCart className="h-5 w-5" />

              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate("/customer/dashboard")}
                className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:flex"
              >
                <UserRound className="h-4 w-4" />
                <span className="max-w-28 truncate">
                  {userName || "Account"}
                </span>
              </button>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </Button>

                <Button
                  size="sm"
                  onClick={() => navigate("/register")}
                >
                  Sign up
                </Button>
              </div>
            )}

            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-100 py-4 lg:hidden">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search products..."
                  aria-label="Search products"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </form>

            <nav className="flex flex-col gap-1">
              <NavLink
                to="/explore"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  [
                    "rounded-xl px-3 py-2.5 text-sm font-medium",
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")
                }
              >
                Explore
              </NavLink>

              <NavLink
                to="/products"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  [
                    "rounded-xl px-3 py-2.5 text-sm font-medium",
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")
                }
              >
                Products
              </NavLink>

              <NavLink
                to="/businesses"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  [
                    "rounded-xl px-3 py-2.5 text-sm font-medium",
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")
                }
              >
                Businesses
              </NavLink>

              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  navigate("/customer/profile");
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:hidden"
              >
                <Heart className="h-4 w-4" />
                Wishlist
              </button>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    navigate("/customer/dashboard");
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <UserRound className="h-4 w-4" />
                  {userName || "Account"}
                </button>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      closeMobileMenu();
                      navigate("/login");
                    }}
                  >
                    Sign in
                  </Button>

                  <Button
                    fullWidth
                    onClick={() => {
                      closeMobileMenu();
                      navigate("/register");
                    }}
                  >
                    Sign up
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
