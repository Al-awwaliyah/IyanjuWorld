import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  getAuthState,
  signInWithPassword,
  type UserRole,
} from "../../libs/auth";
import { getSafeErrorMessage } from "../../libs/errors";

type LoginLocationState = {
  from?: string;
  accountDisabled?: boolean;
  email?: string;
};

function getDashboardPath(role: UserRole) {
  switch (role) {
    case "admin":
      return "/admin/dashboard";

    case "business_owner":
      return "/business/dashboard";

    case "rider":
      return "/rider/dashboard";

    case "customer":
    default:
      return "/customer/dashboard";
  }
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState =
    (location.state as LoginLocationState | null) ?? null;

  const [email, setEmail] = useState(locationState?.email ?? "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const checkExistingSession = async () => {
      try {
        const authState = await getAuthState();

        if (!mounted) {
          return;
        }

        if (
          authState.user &&
          authState.profile &&
          authState.profile.active
        ) {
          navigate(getDashboardPath(authState.profile.role), {
            replace: true,
          });

          return;
        }
      } catch {
        // If session checking fails, allow the login form to render.
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    void checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } =
        await signInWithPassword(
          normalizedEmail,
          password,
        );

      if (signInError) {
        throw signInError;
      }

      if (!data?.user) {
        setError(
          "We could not complete your sign-in. Please try again.",
        );
        return;
      }

      /*
       * Load the authoritative application profile after
       * successful Supabase authentication.
       */
      const authState = await getAuthState();

      if (!authState.user || !authState.profile) {
        setError(
          "Your account was authenticated, but your profile could not be loaded. Please try again.",
        );
        return;
      }

      if (!authState.profile.active) {
        setError(
          "Your account is currently inactive. Please contact IyanjuWorld support.",
        );
        return;
      }

      const redirectFromState = locationState?.from;

      const safeRedirect =
        redirectFromState &&
        redirectFromState.startsWith("/") &&
        !redirectFromState.startsWith("//") &&
        !redirectFromState.startsWith("/login") &&
        !redirectFromState.startsWith("/register")
          ? redirectFromState
          : null;

      navigate(
        safeRedirect ||
          getDashboardPath(authState.profile.role),
        {
          replace: true,
        },
      );
    } catch (loginError) {
      const safeMessage =
        getSafeErrorMessage(loginError);

      if (
        safeMessage
          .toLowerCase()
          .includes("email")
      ) {
        setError(safeMessage);
      } else {
        setError(
          safeMessage ||
            "Unable to sign you in. Please check your details and try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <p className="text-sm text-slate-600">
              Checking your session...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <LogIn className="h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sign in to continue to your IyanjuWorld account.
            </p>
          </div>

          {locationState?.accountDisabled ? (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              Your account is currently inactive. Please
              contact IyanjuWorld support.
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Your password"
                autoComplete="current-password"
                required
                disabled={loading}
              />

              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(event.target.checked)
                }
                disabled={loading}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              Remember me
            </label>

            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              fullWidth
              loading={loading}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

            <p className="text-xs leading-5 text-slate-600">
              Your account access is protected by Supabase
              authentication and IyanjuWorld role-based
              access controls.
            </p>
          </div>

          <div className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-700 hover:text-blue-800"
            >
              Create one
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
