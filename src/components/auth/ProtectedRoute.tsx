import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";

import {
  getAuthState,
  type AdminRole,
  type AuthState,
  type UserRole,
} from "../../libs/auth";
import { Spinner } from "../ui/Spinner";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
  allowedAdminRoles?: AdminRole[];
  requireAdmin?: boolean;
  redirectTo?: string;
};

export default function ProtectedRoute({
  children,
  allowedRoles,
  allowedAdminRoles,
  requireAdmin = false,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const location = useLocation();

  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadAuthState = async () => {
      try {
        const state = await getAuthState();

        if (!mounted) {
          return;
        }

        setAuthState(state);
      } catch {
        if (!mounted) {
          return;
        }

        setAuthState({
          user: null,
          profile: null,
          loading: false,
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadAuthState();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !authState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!authState.user || !authState.profile) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  if (!authState.profile.active) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          accountDisabled: true,
        }}
      />
    );
  }

  const userRole = authState.profile.role as UserRole;

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(userRole)
  ) {
    return (
      <Navigate
        to={getRoleDashboard(userRole)}
        replace
      />
    );
  }

  if (requireAdmin && userRole !== "admin") {
    return (
      <Navigate
        to={getRoleDashboard(userRole)}
        replace
      />
    );
  }

  if (
    allowedAdminRoles &&
    allowedAdminRoles.length > 0
  ) {
    if (userRole !== "admin") {
      return (
        <Navigate
          to={getRoleDashboard(userRole)}
          replace
        />
      );
    }

    const adminRole = authState.profile.admin_role as
      | AdminRole
      | null
      | undefined;

    if (!adminRole || !allowedAdminRoles.includes(adminRole)) {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }
  }

  return <>{children}</>;
}

function getRoleDashboard(role: UserRole) {
  switch (role) {
    case "admin":
      return "/admin/dashboard";

    case "business":
      return "/business/dashboard";

    case "rider":
      return "/rider/dashboard";

    case "customer":
    default:
      return "/customer/dashboard";
  }
}
