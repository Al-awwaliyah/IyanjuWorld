import { supabase } from "./supabase";
import {
  createAppError,
  getSafeErrorMessage,
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
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role: UserRole;
  admin_role?: AdminRole | null;
  avatar?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AuthState = {
  user: Awaited<
    ReturnType<typeof supabase.auth.getUser>
  >["data"]["user"] | null;
  profile: Profile | null;
  loading: boolean;
};

export type SignUpMetadata = {
  full_name?: string;
  phone?: string;
  role?: UserRole;
};

const PROFILE_FIELDS =
  "id,email,full_name,phone,role,admin_role,avatar,avatar_url,active,is_active,created_at,updated_at";

function normalizeRole(value: unknown): UserRole {
  if (
    value === "customer" ||
    value === "business" ||
    value === "rider" ||
    value === "admin"
  ) {
    return value;
  }

  return "customer";
}

function normalizeAdminRole(
  value: unknown,
): AdminRole | null {
  if (
    value === "super_admin" ||
    value === "operations" ||
    value === "support" ||
    value === "finance" ||
    value === "compliance" ||
    value === "read_only"
  ) {
    return value;
  }

  return null;
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    email:
      typeof row.email === "string"
        ? row.email
        : null,
    full_name:
      typeof row.full_name === "string"
        ? row.full_name
        : null,
    phone:
      typeof row.phone === "string"
        ? row.phone
        : null,
    role: normalizeRole(row.role),
    admin_role: normalizeAdminRole(row.admin_role),
    avatar:
      typeof row.avatar === "string"
        ? row.avatar
        : typeof row.avatar_url === "string"
          ? row.avatar_url
          : null,
    active:
      typeof row.active === "boolean"
        ? row.active
        : row.is_active !== false,
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : undefined,
    updated_at:
      typeof row.updated_at === "string"
        ? row.updated_at
        : undefined,
  };
}

function toAppError(error: unknown, fallback: string) {
  const message = getSafeErrorMessage(error);

  return createAppError(
    error,
    message ? "UNKNOWN_ERROR" : "UNKNOWN_ERROR",
  );
}

/**
 * Get the currently authenticated session.
 */
export async function getSession() {
  try {
    const {
      data,
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  } catch (error) {
    logAppError(
      toAppError(
        error,
        "Unable to load the current session.",
      ),
    );

    return null;
  }
}

/**
 * Get the currently authenticated user.
 */
export async function getCurrentUser() {
  try {
    const {
      data,
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user;
  } catch (error) {
    logAppError(
      toAppError(
        error,
        "Unable to load the current user.",
      ),
    );

    return null;
  }
}

/**
 * Get the current user's profile.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  try {
    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapProfile(
      data as Record<string, unknown>,
    );
  } catch (error) {
    logAppError(
      toAppError(
        error,
        "Unable to load your profile.",
      ),
    );

    return null;
  }
}

/**
 * Get the complete authentication state.
 */
export async function getAuthState(): Promise<AuthState> {
  try {
    const {
      data,
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data.user) {
      return {
        user: null,
        profile: null,
        loading: false,
      };
    }

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    return {
      user: data.user,
      profile: profileData
        ? mapProfile(
            profileData as Record<string, unknown>,
          )
        : null,
      loading: false,
    };
  } catch (error) {
    logAppError(
      toAppError(
        error,
        "Unable to load your authentication state.",
      ),
    );

    return {
      user: null,
      profile: null,
      loading: false,
    };
  }
}

/**
 * Sign in with email and password.
 */
export async function signInWithPassword(
  email: string,
  password: string,
) {
  try {
    const {
      data,
      error,
    } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw error;
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    logAppError(
      toAppError(
        error,
        "Unable to sign you in.",
      ),
    );

    return {
      data: null,
      error,
    };
  }
}

/**
 * Register a new IyanjuWorld account.
 *
 * The role and registration information are passed
 * to Supabase Auth metadata so the database profile
 * creation trigger can use the same information.
 *
 * Email confirmation/OTP is handled by Supabase Auth.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  metadata: SignUpMetadata = {},
) {
  try {
    const normalizedEmail =
      email.trim().toLowerCase();

    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name:
            metadata.full_name?.trim() || null,
          phone:
            metadata.phone?.trim() || null,
          role: metadata.role || "customer",
        },
      },
    });

    if (error) {
      throw error;
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    logAppError(
      toAppError(
        error,
        "Unable to create your account.",
      ),
    );

    return {
      data: null,
      error,
    };
  }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  try {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    logAppError(
      toAppError(
        error,
        "Unable to sign you out.",
      ),
    );

    return {
      success: false,
      error: getSafeErrorMessage(error),
    };
  }
}

/**
 * Send a password reset email.
 */
export async function resetPassword(
  email: string,
) {
  try {
    const normalizedEmail =
      email.trim().toLowerCase();

    const redirectTo =
      `${window.location.origin}/reset-password`;

    const {
      error,
    } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo,
      },
    );

    if (error) {
      throw error;
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    logAppError(
      toAppError(
        error,
        "Unable to send the password reset email.",
      ),
    );

    return {
      success: false,
      error,
    };
  }
}

/**
 * Update the authenticated user's password.
 */
export async function updatePassword(
  password: string,
) {
  try {
    const {
      data,
      error,
    } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    logAppError(
      toAppError(
        error,
        "Unable to update your password.",
      ),
    );

    return {
      data: null,
      error,
    };
  }
}

/**
 * Refresh the current Supabase session.
 */
export async function refreshSession() {
  try {
    const {
      data,
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      throw error;
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    logAppError(
      toAppError(
        error,
        "Unable to refresh your session.",
      ),
    );

    return {
      data: null,
      error,
    };
  }
}

/**
 * Subscribe to Supabase authentication changes.
 */
export function subscribeToAuthChanges(
  callback: (
    event: string,
    session: Awaited<
      ReturnType<typeof supabase.auth.getSession>
    >["data"]["session"],
  ) => void,
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    },
  );

  return subscription;
}

/**
 * Check whether a user is authenticated.
 */
export function isAuthenticated(
  authState: AuthState,
) {
  return Boolean(
    authState.user &&
      authState.profile,
  );
}

/**
 * Check whether the profile is active.
 */
export function isActiveProfile(
  authState: AuthState,
) {
  return Boolean(
    authState.profile &&
      authState.profile.active,
  );
}

/**
 * Check whether the authenticated user
 * has a specific role.
 */
export function isRole(
  authState: AuthState,
  role: UserRole,
) {
  return (
    authState.profile?.role === role
  );
}

/**
 * Check whether the user is an administrator.
 */
export function isAdmin(
  authState: AuthState,
) {
  return (
    authState.profile?.role === "admin"
  );
}

/**
 * Check whether an administrator has
 * one of the supplied admin roles.
 */
export function hasAdminRole(
  authState: AuthState,
  roles: AdminRole[],
) {
  if (!isAdmin(authState)) {
    return false;
  }

  const adminRole =
    authState.profile?.admin_role;

  if (!adminRole) {
    return false;
  }

  return roles.includes(adminRole);
}

/**
 * Check whether the user can access
 * the administration area.
 */
export function canAccessAdminArea(
  authState: AuthState,
) {
  return (
    isAdmin(authState) &&
    isActiveProfile(authState)
  );
}

/**
 * Check whether the administrator can
 * manage financial operations.
 */
export function canManageFinancialOperations(
  authState: AuthState,
) {
  return hasAdminRole(authState, [
    "super_admin",
    "finance",
    "operations",
  ]);
}

/**
 * Check whether the administrator can
 * process wallet refunds.
 */
export function canProcessRefunds(
  authState: AuthState,
) {
  return hasAdminRole(authState, [
    "super_admin",
    "finance",
    "operations",
  ]);
}
