import { ArrowLeft, Compass, Home, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { PageContainer } from "../../components/layout/PageContainer";
import { Button } from "../../components/ui/Button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] items-center bg-white">
      <PageContainer className="py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-600">
            <Compass className="h-10 w-10" />
          </div>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-brand-600">
            Error 404
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Page not found
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            The page you are looking for may have been moved, removed, or the
            address may be incorrect.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/">
              <Button size="lg">
                <Home className="h-5 w-5" />
                Go to homepage
              </Button>
            </Link>

            <Link to="/explore">
              <Button variant="outline" size="lg">
                <Search className="h-5 w-5" />
                Explore marketplace
              </Button>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>
      </PageContainer>
    </div>
  );
}
