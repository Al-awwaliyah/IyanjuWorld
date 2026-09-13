import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Mail,
  MessageCircle,
  ShieldCheck,
  Truck,
  Twitter,
  Wallet,
} from "lucide-react";

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      {/* Trust strip */}
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Verified businesses</p>
              <p className="text-xs text-slate-500">Every seller is reviewed before listing</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Secure payments</p>
              <p className="text-xs text-slate-500">Pay by card, transfer or wallet</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Local delivery</p>
              <p className="text-xs text-slate-500">Riders you can track in real time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="text-xl font-extrabold tracking-tight text-ink-900"
            >
              Iyanju<span className="text-brand-500">World</span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
              A trusted digital marketplace connecting customers,
              businesses, and delivery riders through one convenient
              commerce platform.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-brand-500 hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-brand-500 hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>

              <a
                href="#"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-brand-500 hover:text-white"
              >
                <Twitter className="h-4 w-4" />
              </a>

              <a
                href="#"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-brand-500 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink-900">
              Marketplace
            </h2>

            <nav className="mt-4 flex flex-col gap-3">
              <Link to="/explore" className="text-sm text-slate-500 transition hover:text-brand-600">
                Explore
              </Link>
              <Link to="/products" className="text-sm text-slate-500 transition hover:text-brand-600">
                Products
              </Link>
              <Link to="/businesses" className="text-sm text-slate-500 transition hover:text-brand-600">
                Businesses
              </Link>
              <Link to="/search" className="text-sm text-slate-500 transition hover:text-brand-600">
                Search
              </Link>
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink-900">
              My account
            </h2>

            <nav className="mt-4 flex flex-col gap-3">
              <Link to="/customer/dashboard" className="text-sm text-slate-500 transition hover:text-brand-600">
                My account
              </Link>
              <Link to="/customer/orders" className="text-sm text-slate-500 transition hover:text-brand-600">
                Track my order
              </Link>
              <Link to="/customer/wallet" className="text-sm text-slate-500 transition hover:text-brand-600">
                Wallet
              </Link>
              <Link to="/register" className="text-sm text-slate-500 transition hover:text-brand-600">
                Sell on IyanjuWorld
              </Link>
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink-900">
              IyanjuWorld
            </h2>

            <nav className="mt-4 flex flex-col gap-3">
              <Link to="/about" className="text-sm text-slate-500 transition hover:text-brand-600">
                About us
              </Link>
              <Link to="/contact" className="text-sm text-slate-500 transition hover:text-brand-600">
                Contact
              </Link>
              <Link to="/terms" className="text-sm text-slate-500 transition hover:text-brand-600">
                Terms of service
              </Link>
              <Link to="/privacy" className="text-sm text-slate-500 transition hover:text-brand-600">
                Privacy policy
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-100 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} IyanjuWorld. All rights reserved.</p>

          <a
            href="mailto:support@iyanjuworld.com"
            className="inline-flex items-center gap-2 transition hover:text-brand-600"
          >
            <Mail className="h-4 w-4" />
            support@iyanjuworld.com
          </a>
        </div>
      </div>
    </footer>
  );
}
