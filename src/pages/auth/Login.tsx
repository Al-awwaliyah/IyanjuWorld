import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { getAuthState, signInWithPassword } from "../../libs/auth";
import { getSafeErrorMessage } from "../../libs/errors";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      try {
        const authState = await getAuthState();

        if (!mounted) {
          return;
        }

        if (authState.user && authState.profile) {
          navigate(getDashboardPath(authState.profile.role, authState.profile.admin_role), {
            replace: true,
          });
          return;
        }
      } catch {
        // A missing or invalid session should simply leave the user on login.
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    void checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      const result = await signInWithPassword(normalizedEmail, password);

      if (!result.user || !result.profile) {
        setError(
          "Your account could not be loaded completely. Please try again.",
        );
        return;
      }

      const state = location.state as LocationState | null;
      const requestedPath = state?.from?.pathname;

      if (
        requestedPath &&
        requestedPath !== "/login" &&
        requestedPath !== "/register"
      ) {
        navigate(requestedPath, { replace: true });
        return;
      }

      navigate(
        getDashboardPath(result.profile.role, result.profile.admin_role),
        { replace: true },
      );
    } catch (loginError) {
      setError(getSafeErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-white px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500">
            Checking your account...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-1px)] bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1fr_0.9fr]">
        <section className="hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between">
          <div className="p-10 xl:p-14">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                <ShoppingBag className="h-6 w-6 text-slate-950" />
              </div>

              <span className="text-xl font-bold tracking-tight text-white">
                IyanjuWorld
              </span>
            </Link>

            <div className="mt-24 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                Welcome back
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight text-white xl:text-6xl">
                Your marketplace, all in one place.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
                Sign in to manage your orders, communicate with businesses and
                riders, manage your wallet, and continue shopping on
                IyanjuWorld.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-white/10 p-10 xl:p-14">
            <AuthBenefit
              icon={<ShoppingBag className="h-5 w-5" />}
              title="Shop"
              description="Discover local products"
            />

            <AuthBenefit
              icon={<LockKeyhole className="h-5 w-5" />}
              title="Secure"
              description="Protected account access"
            />

            <AuthBenefit
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Trusted"
              description="Verified marketplace"
            />
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-center lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>

                <span className="text-xl font-bold tracking-tight text-slate-950">
                  IyanjuWorld
                </span>
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Account access
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  Sign in
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Access your IyanjuWorld account securely.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                >
                  <p className="text-sm leading-6 text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  required
                />

                <div>
                  <Input
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="rounded-md text-slate-500 hover:text-slate-900"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                    required
                  />

                  <div className="mt-2 flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <span className="text-sm text-slate-600">
                    Keep me signed in
                  </span>
                </label>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  Sign in
                  {!loading && <ArrowRight className="h-5 w-5" />}
                </Button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  New to IyanjuWorld?
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <Link to="/register" className="block">
                <Button variant="outline" size="lg" fullWidth>
                  Create an account
                </Button>
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs leading-5 text-slate-500">
                By signing in, you agree to the IyanjuWorld{" "}
                <Link
                  to="/terms"
                  className="font-medium text-slate-700 hover:text-blue-600"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="font-medium text-slate-700 hover:text-blue-600"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function getDashboardPath(
  role: string | null | undefined,
  adminRole: string | null | undefined,
) {
  if (role === "admin") {
    return "/admin/dashboard";
  }

  if (role === "business") {
    return "/business/dashboard";
  }

  if (role === "rider") {
    return "/rider/dashboard";
  }

  if (adminRole) {
    return "/admin/dashboard";
  }

  return "/customer/dashboard";
}

function AuthBenefit({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
        {icon}
      </div>

      <p className="mt-3 text-sm font-semibold text-white">{title}</p>

      <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
    </div>
  );
}
