import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Mail,
  MessageCircle,
  Twitter,
} from "lucide-react";

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="text-xl font-bold tracking-tight text-white"
            >
              IyanjuWorld
            </Link>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
              A trusted digital marketplace connecting customers,
              businesses, and delivery riders through one convenient
              commerce platform.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>

              <a
                href="#"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <Twitter className="h-4 w-4" />
              </a>

              <a
                href="#"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              Marketplace
            </h2>

            <nav className="mt-4 flex flex-col gap-3">
              <Link
                to="/explore"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Explore
              </Link>

              <Link
                to="/products"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Products
              </Link>

              <Link
                to="/businesses"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Businesses
              </Link>

              <Link
                to="/search"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Search
              </Link>
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              IyanjuWorld
            </h2>

            <nav className="mt-4 flex flex-col gap-3">
              <Link
                to="/about"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                About us
              </Link>

              <Link
                to="/contact"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Contact
              </Link>

              <Link
                to="/terms"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Terms of service
              </Link>

              <Link
                to="/privacy"
                className="text-sm text-slate-400 transition hover:text-white"
              >
                Privacy policy
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} IyanjuWorld. All rights reserved.
          </p>

          <a
            href="mailto:support@iyanjuworld.com"
            className="inline-flex items-center gap-2 transition hover:text-slate-300"
          >
            <Mail className="h-4 w-4" />
            support@iyanjuworld.com
          </a>
        </div>
      </div>
    </footer>
  );
}
