import type {
  AuthChangeEvent,
  Session,
  User,
} from "@supabase/supabase-js";

import {
  supabase,
} from "./supabase";

import {
  createAppError,
  logAppError,
} from "./errors";

export type UserRole =
  | "customer"
  | "business_owner"
  | "rider"
  | "admin";

export type AdminRole =
  | "super_admin"
  | "operations"
  | "support"
  | "finance"
  | "compliance"
  | "read_only";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  admin_role: AdminRole | null;
  avatar: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthState = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
};

export async function getSession(): Promise<Session | null> {
  const {
    data,
    error,
  } = await supabase.auth.getSession();

  if (error) {
    logAppError(
      "Failed to retrieve authentication session.",
      error,
    );

    return null;
  }

  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data,
    error,
  } = await supabase.auth.getUser();

  if (error) {
    logAppError(
      "Failed to retrieve authenticated user.",
      error,
    );

    return null;
  }

  return data.user ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select(
      [
        "id",
        "full_name",
        "phone",
        "role",
        "admin_role",
        "avatar",
        "active",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    logAppError(
      "Failed to retrieve user profile.",
      error,
    );

    return null;
  }

  return data as Profile | null;
}

export async function getAuthState(): Promise<AuthState> {
  const session = await getSession();

  if (!session?.user) {
    return {
      user: null,
      session: null,
      profile: null,
    };
  }

  const profile =
    await getCurrentProfile();

  return {
    user: session.user,
    session,
    profile,
  };
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{
  user: User | null;
  session: Session | null;
  profile: Profile | null;
}> {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw createAppError(
      new Error(
        "Email and password are required.",
      ),
      "VALIDATION_ERROR",
    );
  }

  const {
    data,
    error,
  } =
    await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

  if (error) {
    logAppError(
      "Password sign-in failed.",
      error,
    );

    throw createAppError(
      error,
      "AUTH_INVALID",
    );
  }

  if (!data.user || !data.session) {
    throw createAppError(
      new Error(
        "Authentication completed without a valid session.",
      ),
      "AUTH_INVALID",
    );
  }

  const profile =
    await getCurrentProfile();

  if (
    profile &&
    profile.active === false
  ) {
    await supabase.auth.signOut();

    throw createAppError(
      new Error(
        "User profile is inactive.",
      ),
      "PERMISSION_DENIED",
    );
  }

  return {
    user: data.user,
    session: data.session,
    profile,
  };
}

export async function signUpWithPassword(
  email: string,
  password: string,
  fullName?: string,
  phone?: string,
): Promise<{
  user: User | null;
  session: Session | null;
}> {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw createAppError(
      new Error(
        "Email and password are required.",
      ),
      "VALIDATION_ERROR",
    );
  }

  if (password.length < 8) {
    throw createAppError(
      new Error(
        "Password must contain at least 8 characters.",
      ),
      "VALIDATION_ERROR",
    );
  }

  const {
    data,
    error,
  } =
    await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name:
            fullName?.trim() || null,
          phone:
            phone?.trim() || null,
        },
      },
    });

  if (error) {
    logAppError(
      "Password registration failed.",
      error,
    );

    throw createAppError(
      error,
      "UNKNOWN_ERROR",
    );
  }

  return {
    user: data.user,
    session: data.session,
  };
}

export async function signOut(): Promise<void> {
  const {
    error,
  } = await supabase.auth.signOut();

  if (error) {
    logAppError(
      "Sign-out failed.",
      error,
    );

    throw createAppError(
      error,
      "UNKNOWN_ERROR",
    );
  }
}

export async function resetPassword(
  email: string,
): Promise<void> {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw createAppError(
      new Error(
        "Email is required.",
      ),
      "VALIDATION_ERROR",
    );
  }

  const {
    error,
  } =
    await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo:
          `${window.location.origin}/reset-password`,
      },
    );

  if (error) {
    logAppError(
      "Password reset request failed.",
      error,
    );

    throw createAppError(
      error,
      "UNKNOWN_ERROR",
    );
  }
}

export async function updatePassword(
  password: string,
): Promise<void> {
  if (!password || password.length < 8) {
    throw createAppError(
      new Error(
        "Password must contain at least 8 characters.",
      ),
      "VALIDATION_ERROR",
    );
  }

  const {
    error,
  } =
    await supabase.auth.updateUser({
      password,
    });

  if (error) {
    logAppError(
      "Password update failed.",
      error,
    );

    throw createAppError(
      error,
      "UNKNOWN_ERROR",
    );
  }
}

export async function refreshSession(): Promise<Session | null> {
  const {
    data,
    error,
  } =
    await supabase.auth.refreshSession();

  if (error) {
    logAppError(
      "Authentication session refresh failed.",
      error,
    );

    return null;
  }

  return data.session;
}

export function subscribeToAuthChanges(
  callback: (
    event: AuthChangeEvent,
    session: Session | null,
  ) => void,
): () => void {
  const {
    data: subscriptionData,
  } =
    supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(
          event,
          session,
        );
      },
    );

  return () => {
    subscriptionData.subscription.unsubscribe();
  };
}

export function isAuthenticated(
  state: AuthState,
): boolean {
  return Boolean(
    state.user &&
    state.session,
  );
}

export function isActiveProfile(
  profile: Profile | null,
): boolean {
  return Boolean(
    profile &&
    profile.active === true,
  );
}

export function isRole(
  profile: Profile | null,
  role: UserRole,
): boolean {
  return (
    profile?.role === role
  );
}

export function isAdmin(
  profile: Profile | null,
): boolean {
  return (
    profile?.role === "admin" &&
    profile.active === true
  );
}

export function hasAdminRole(
  profile: Profile | null,
  adminRole: AdminRole,
): boolean {
  return (
    isAdmin(profile) &&
    profile?.admin_role === adminRole
  );
}

export function canAccessAdminArea(
  profile: Profile | null,
): boolean {
  return isAdmin(profile);
}

export function canManageFinancialOperations(
  profile: Profile | null,
): boolean {
  if (!isAdmin(profile)) {
    return false;
  }

  return (
    profile.admin_role ===
      "super_admin" ||
    profile.admin_role ===
      "finance"
  );
}

export function canProcessRefunds(
  profile: Profile | null,
): boolean {
  if (!isAdmin(profile)) {
    return false;
  }

  return (
    profile.admin_role ===
      "super_admin" ||
    profile.admin_role ===
      "finance"
  );
}
