import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ClipboardList,
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

const CATEGORY_LINKS = [
  { label: "Food & Groceries", slug: "food-groceries" },
  { label: "Fashion", slug: "fashion" },
  { label: "Electronics", slug: "electronics" },
  { label: "Beauty & Personal Care", slug: "beauty-personal-care" },
  { label: "Home & Living", slug: "home-living" },
  { label: "Phones & Accessories", slug: "phones-accessories" },
  { label: "Services", slug: "services" },
];

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
      isActive ? "text-white" : "text-white/80 hover:text-white",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50">
      {/* Utility bar */}
      <div className="hidden bg-ink-950 text-white/70 sm:block dark-surface">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs sm:px-6 lg:px-8">
          <p>Deliver to you, wherever you are in Nigeria 🇳🇬</p>

          <div className="flex items-center gap-4">
            <Link to="/about" className="transition hover:text-white">
              About IyanjuWorld
            </Link>

            <Link to="/contact" className="transition hover:text-white">
              Help Center
            </Link>

            {!isAuthenticated && (
              <Link to="/register" className="font-semibold text-brand-400 transition hover:text-brand-300">
                Sell on IyanjuWorld
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="bg-ink-900 dark-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((current) => !current)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/10 lg:hidden"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <Link
              to="/"
              className="shrink-0 text-xl font-extrabold tracking-tight text-white"
              aria-label="IyanjuWorld home"
            >
              Iyanju<span className="text-brand-500">World</span>
            </Link>

            <nav className="hidden items-center gap-5 lg:flex">
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
              className="mx-auto hidden w-full max-w-2xl md:flex"
            >
              <div className="relative flex w-full overflow-hidden rounded-md ring-2 ring-brand-500">
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search products, brands and businesses"
                  aria-label="Search products"
                  className="h-11 w-full border-0 bg-white pl-4 pr-2 text-sm text-slate-900 outline-none"
                />

                <button
                  type="submit"
                  aria-label="Search"
                  className="flex w-12 shrink-0 items-center justify-center bg-brand-500 text-white transition hover:bg-brand-600"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                aria-label="Search"
                onClick={() => navigate("/search")}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-white/10 md:hidden"
              >
                <Search className="h-5 w-5" />
              </button>

              <button
                type="button"
                aria-label="Wishlist"
                onClick={() => navigate("/customer/profile")}
                className="hidden h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-white/10 sm:flex"
              >
                <Heart className="h-5 w-5" />
              </button>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => navigate("/customer/dashboard")}
                  className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 sm:flex"
                >
                  <UserRound className="h-4 w-4" />
                  <span className="max-w-28 truncate">
                    {userName || "Account"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 sm:flex"
                >
                  <UserRound className="h-4 w-4" />
                  Sign in
                </button>
              )}

              <button
                type="button"
                aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
                onClick={() => navigate("/customer/cart")}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-white/10"
              >
                <ShoppingCart className="h-5 w-5" />

                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile search, always visible under the main bar on small screens */}
          <form onSubmit={handleSearch} className="pb-3 md:hidden">
            <div className="relative flex w-full overflow-hidden rounded-md ring-2 ring-brand-500">
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search IyanjuWorld"
                aria-label="Search products"
                className="h-10 w-full border-0 bg-white pl-4 pr-2 text-sm text-slate-900 outline-none"
              />

              <button
                type="submit"
                aria-label="Search"
                className="flex w-11 shrink-0 items-center justify-center bg-brand-500 text-white"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category bar */}
      <div className="hidden border-b border-slate-200 bg-white lg:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Category navigation"
            className="flex h-11 items-center gap-6 overflow-x-auto"
          >
            {CATEGORY_LINKS.map((category) => (
              <NavLink
                key={category.slug}
                to={`/category/${category.slug}`}
                className={({ isActive }) =>
                  [
                    "shrink-0 text-sm font-medium transition-colors",
                    isActive
                      ? "text-brand-600"
                      : "text-slate-600 hover:text-brand-600",
                  ].join(" ")
                }
              >
                {category.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white py-4 lg:hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Shop by category
            </p>

            <nav className="mb-4 flex flex-col gap-1">
              {CATEGORY_LINKS.map((category) => (
                <NavLink
                  key={category.slug}
                  to={`/category/${category.slug}`}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    [
                      "rounded-lg px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-brand-50 text-brand-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  {category.label}
                </NavLink>
              ))}
            </nav>

            <div className="mb-2 border-t border-slate-100 pt-3" />

            <nav className="flex flex-col gap-1">
              <NavLink
                to="/explore"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  [
                    "rounded-lg px-3 py-2.5 text-sm font-medium",
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
                    "rounded-lg px-3 py-2.5 text-sm font-medium",
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
                    "rounded-lg px-3 py-2.5 text-sm font-medium",
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
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:hidden"
              >
                <Heart className="h-4 w-4" />
                Wishlist
              </button>

              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      navigate("/customer/dashboard");
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <UserRound className="h-4 w-4" />
                    {userName || "Account"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      navigate("/customer/orders");
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Orders
                  </button>
                </>
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
                    variant="brand"
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
        </div>
      )}
    </header>
  );
}
