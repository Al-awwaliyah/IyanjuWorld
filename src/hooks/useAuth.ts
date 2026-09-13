// src/hooks/useAuth.ts

import { useCallback, useEffect, useState } from "react";

import {
  getAuthState,
  getCurrentProfile,
  getCurrentUser,
  refreshSession,
  resetPassword,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  subscribeToAuthChanges,
  updatePassword,
  type AuthState,
  type Profile,
  type SignUpMetadata,
  type UserRole,
} from "@/libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "@/libs/errors";

interface UseAuthState {
  user: AuthState["user"];
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  initialized: boolean;
}

interface UseAuthActions {
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    metadata: SignUpMetadata
  ) => Promise<{
    success: boolean;
    requiresEmailConfirmation: boolean;
    error?: string;
  }>;
  signOutUser: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  sendPasswordReset: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

export interface UseAuthResult
  extends UseAuthState,
    UseAuthActions {
  isAuthenticated: boolean;
  isCustomer: boolean;
  isBusiness: boolean;
  isRider: boolean;
  isAdmin: boolean;
}

export function useAuth(): UseAuthResult {
  const [state, setState] = useState<UseAuthState>({
    user: null,
    profile: null,
    role: null,
    loading: true,
    initialized: false,
  });

  const loadAuthState = useCallback(async () => {
    try {
      const authState = await getAuthState();

      setState({
        user: authState.user,
        profile: authState.profile,
        role: authState.profile?.role ?? null,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      logAppError(error, {
        context: "useAuth.loadAuthState",
      });

      setState({
        user: null,
        profile: null,
        role: null,
        loading: false,
        initialized: true,
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;

      await loadAuthState();
    };

    void initialize();

    const unsubscribe = subscribeToAuthChanges(async () => {
      if (!mounted) return;

      await loadAuthState();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadAuthState]);

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await signInWithPassword(email, password);

        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        await loadAuthState();

        return {
          success: true,
        };
      } catch (error) {
        logAppError(error, {
          context: "useAuth.signIn",
        });

        return {
          success: false,
          error: getSafeErrorMessage(error),
        };
      }
    },
    [loadAuthState]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata: SignUpMetadata
    ): Promise<{
      success: boolean;
      requiresEmailConfirmation: boolean;
      error?: string;
    }> => {
      try {
        const result = await signUpWithPassword(
          email,
          password,
          metadata
        );

        if (!result.success) {
          return {
            success: false,
            requiresEmailConfirmation: false,
            error: result.error,
          };
        }

        await loadAuthState();

        return {
          success: true,
          requiresEmailConfirmation: !result.data?.session,
        };
      } catch (error) {
        logAppError(error, {
          context: "useAuth.signUp",
        });

        return {
          success: false,
          requiresEmailConfirmation: false,
          error: getSafeErrorMessage(error),
        };
      }
    },
    [loadAuthState]
  );

  const signOutUser = useCallback(async () => {
    try {
      const result = await signOut();

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      setState({
        user: null,
        profile: null,
        role: null,
        loading: false,
        initialized: true,
      });

      return {
        success: true,
      };
    } catch (error) {
      logAppError(error, {
        context: "useAuth.signOut",
      });

      return {
        success: false,
        error: getSafeErrorMessage(error),
      };
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      const result = await resetPassword(email);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      logAppError(error, {
        context: "useAuth.sendPasswordReset",
      });

      return {
        success: false,
        error: getSafeErrorMessage(error),
      };
    }
  }, []);

  const changePassword = useCallback(async (password: string) => {
    try {
      const result = await updatePassword(password);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      logAppError(error, {
        context: "useAuth.changePassword",
      });

      return {
        success: false,
        error: getSafeErrorMessage(error),
      };
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      await refreshSession();

      const [user, profile] = await Promise.all([
        getCurrentUser(),
        getCurrentProfile(),
      ]);

      setState({
        user,
        profile,
        role: profile?.role ?? null,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      logAppError(error, {
        context: "useAuth.refresh",
      });

      await loadAuthState();
    }
  }, [loadAuthState]);

  return {
    ...state,
    signIn,
    signUp,
    signOutUser,
    sendPasswordReset,
    changePassword,
    refresh,
    isAuthenticated: Boolean(state.user),
    isCustomer: state.role === "customer",
    isBusiness: state.role === "business",
    isRider: state.role === "rider",
    isAdmin: state.role === "admin",
  };
}

export default useAuth;
