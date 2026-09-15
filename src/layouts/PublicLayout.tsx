import { Outlet, useLocation } from "react-router-dom";

import PublicHeader from "../components/layout/PublicHeader";
import PublicFooter from "../components/layout/PublicFooter";
import MobileNavigation from "../components/layout/MobileNavigation";
import BackButton from "../components/layout/BackButton";
import { useAuth } from "../hooks/useAuth";

export default function PublicLayout() {
  const { isAuthenticated, profile } = useAuth();
  const location = useLocation();
  const showBack = location.pathname !== "/";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-ink-900">
      <PublicHeader
        isAuthenticated={isAuthenticated}
        userName={profile?.full_name}
      />

      <main className="flex-1 pb-16 lg:pb-0">
        {showBack && <BackButton />}
        <Outlet />
      </main>

      <PublicFooter />
      <MobileNavigation isAuthenticated={isAuthenticated} />
    </div>
  );
}
