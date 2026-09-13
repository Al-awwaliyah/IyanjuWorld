import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { resetPassword } from "../../libs/auth";
import { getSafeErrorMessage } from "../../libs/errors";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter the email address associated with your account.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(normalizedEmail);
      setSuccess(true);
    } catch (resetError) {
      setError(getSafeErrorMessage(resetError));
    } finally {
      setLoading(false);
    }
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
                Account recovery
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight text-white xl:text-6xl">
                Get back into your account securely.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
                Enter the email address associated with your IyanjuWorld
                account and we will send you instructions to reset your
                password.
              </p>

              <div className="mt-10 space-y-5">
                <RecoveryBenefit
                  icon={<Mail className="h-5 w-5" />}
                  title="Secure recovery"
                  description="Password reset instructions are sent to your registered email."
                />

                <RecoveryBenefit
                  icon={<KeyRound className="h-5 w-5" />}
                  title="Protected access"
                  description="Your existing account and marketplace data remain protected."
                />

                <RecoveryBenefit
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Trusted process"
                  description="Recovery is handled through the platform authentication system."
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 px-10 py-8 xl:px-14">
            <p className="text-sm text-slate-400">
              Need an account instead?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-400 hover:text-blue-300"
              >
                Create one
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
              {!success ? (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                  </Link>

                  <div className="mt-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <KeyRound className="h-6 w-6" />
                    </div>

                    <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-blue-600">
                      Forgot password
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                      Reset your password
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Enter your account email and we will send you a secure
                      password-reset link.
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
                      label="Email address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={loading}
                      leftIcon={<Mail className="h-5 w-5" />}
                      required
                    />

                    <Button
                      type="submit"
                      size="lg"
                      fullWidth
                      loading={loading}
                      disabled={loading}
                    >
                      Send reset link
                      {!loading && <ArrowRight className="h-5 w-5" />}
                    </Button>
                  </form>

                  <div className="mt-7 border-t border-slate-200 pt-6">
                    <p className="text-center text-sm text-slate-600">
                      Remember your password?{" "}
                      <Link
                        to="/login"
                        className="font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Sign in
                      </Link>
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <p className="mt-7 text-sm font-semibold uppercase tracking-wider text-emerald-600">
                    Check your email
                  </p>

                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    Reset link sent
                  </h2>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    If an account is associated with that email address, you
                    should receive instructions to reset your password.
                  </p>

                  <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email address
                    </p>

                    <p className="mt-1 break-all text-sm font-medium text-slate-900">
                      {email.trim().toLowerCase()}
                    </p>
                  </div>

                  <div className="mt-7 space-y-3">
                    <Link to="/login" className="block">
                      <Button size="lg" fullWidth>
                        Return to sign in
                      </Button>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setSuccess(false);
                        setError("");
                      }}
                      className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                    >
                      Use a different email
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              For your security, IyanjuWorld does not expose account or
              authentication details through the recovery form.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function RecoveryBenefit({
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
