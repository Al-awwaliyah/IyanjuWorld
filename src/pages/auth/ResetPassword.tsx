import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { updatePassword } from "../../libs/auth";
import { getSafeErrorMessage } from "../../libs/errors";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      try {
        const {
          supabase,
        } = await import("../../libs/supabase");

        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (sessionError || !data.session) {
          setHasRecoverySession(false);
          return;
        }

        setHasRecoverySession(true);
      } catch (sessionError) {
        if (mounted) {
          setHasRecoverySession(false);
          setError(getSafeErrorMessage(sessionError));
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    void checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!hasRecoverySession) {
      setError(
        "Your password reset session is no longer valid. Please request a new reset link.",
      );
      return;
    }

    if (password.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (passwordError) {
      setError(getSafeErrorMessage(passwordError));
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500">
            Verifying your reset session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
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
                Secure password reset
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight text-white xl:text-6xl">
                Create a new password and continue securely.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
                Choose a strong password that you can use to access your
                IyanjuWorld account.
              </p>

              <div className="mt-10 space-y-5">
                <ResetBenefit
                  icon={<LockKeyhole className="h-5 w-5" />}
                  title="Strong password"
                  description="Use at least 8 characters for your new password."
                />

                <ResetBenefit
                  icon={<KeyRound className="h-5 w-5" />}
                  title="Protected session"
                  description="Only an active password-reset session can complete this process."
                />

                <ResetBenefit
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Account security"
                  description="Your password is updated through the secure authentication system."
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 px-10 py-8 xl:px-14">
            <p className="text-sm text-slate-400">
              Need help signing in?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-400 hover:text-blue-300"
              >
                Return to sign in
              </Link>
            </p>
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
              {success ? (
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <p className="mt-7 text-sm font-semibold uppercase tracking-wider text-emerald-600">
                    Password updated
                  </p>

                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    You're all set
                  </h2>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    Your IyanjuWorld password has been updated successfully.
                    You can now sign in with your new password.
                  </p>

                  <div className="mt-7">
                    <Button
                      size="lg"
                      fullWidth
                      onClick={() => navigate("/login", { replace: true })}
                    >
                      Continue to sign in
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : !hasRecoverySession ? (
                <>
                  <Link
                    to="/forgot-password"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Request a new reset link
                  </Link>

                  <div className="mt-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                      <KeyRound className="h-6 w-6" />
                    </div>

                    <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-amber-600">
                      Reset session unavailable
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                      Start again
                    </h2>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      This password reset link is invalid, expired, or the
                      reset session is no longer available. Request a new link
                      to continue.
                    </p>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    >
                      <p className="text-sm leading-6 text-red-700">
                        {error}
                      </p>
                    </div>
                  )}

                  <div className="mt-7 space-y-3">
                    <Link to="/forgot-password" className="block">
                      <Button size="lg" fullWidth>
                        Request new reset link
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>

                    <Link to="/login" className="block">
                      <Button variant="outline" size="lg" fullWidth>
                        Return to sign in
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Back to sign in
                  </Link>

                  <div className="mt-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <LockKeyhole className="h-6 w-6" />
                    </div>

                    <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-blue-600">
                      New password
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                      Choose a new password
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Create a new password for your IyanjuWorld account.
                    </p>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    >
                      <p className="text-sm leading-6 text-red-700">
                        {error}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    <Input
                      label="New password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={loading}
                      leftIcon={<LockKeyhole className="h-5 w-5" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((value) => !value)
                          }
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

                    <Input
                      label="Confirm new password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter your new password again"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      disabled={loading}
                      leftIcon={<LockKeyhole className="h-5 w-5" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((value) => !value)
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          className="rounded-md text-slate-500 hover:text-slate-900"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      }
                      required
                    />

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Password requirement
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        Your new password must contain at least 8 characters.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      fullWidth
                      loading={loading}
                      disabled={loading}
                    >
                      Update password
                      {!loading && <ArrowRight className="h-5 w-5" />}
                    </Button>
                  </form>
                </>
              )}
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              IyanjuWorld uses protected authentication flows to keep account
              credentials secure.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function ResetBenefit({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-400">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-white">{title}</p>

        <p className="mt-1 text-sm leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}
