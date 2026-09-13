import { Outlet } from "react-router-dom";

import PublicHeader from "../components/layout/PublicHeader";
import PublicFooter from "../components/layout/PublicFooter";
import MobileNavigation from "../components/layout/MobileNavigation";
import { useAuth } from "../hooks/useAuth";

export default function PublicLayout() {
  const { isAuthenticated, profile } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <PublicHeader
        isAuthenticated={isAuthenticated}
        userName={profile?.full_name}
      />

      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>

      <PublicFooter />

      <MobileNavigation isAuthenticated={isAuthenticated} />
    </div>
  );
}
