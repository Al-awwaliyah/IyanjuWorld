import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { supabase } from "../../libs/supabase";
import { getSafeErrorMessage } from "../../libs/errors";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

type LocationState = {
  email?: string;
};

export default function VerifyEmail() {
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  const [email, setEmail] = useState(locationState?.email ?? "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleResendVerification() {
    setError("");
    setSent(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter the email address you used to register.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Direct Supabase Auth email verification.
       *
       * Supabase handles the verification email using the SMTP
       * configuration configured in the Supabase Auth settings.
       *
       * No Edge Function, third-party email API, or custom mail
       * service is used here.
       */
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
      });

      if (resendError) {
        throw resendError;
      }

      setSent(true);
    } catch (resendError) {
      setError(getSafeErrorMessage(resendError));
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
                Verify your account
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight text-white xl:text-6xl">
                One more step before you get started.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
                Verify your email address to help protect your account and
                ensure you can recover access when needed.
              </p>

              <div className="mt-10 space-y-5">
                <VerificationBenefit
                  icon={<Mail className="h-5 w-5" />}
                  title="Confirm your email"
                  description="Use the verification link sent to your registered email address."
                />

                <VerificationBenefit
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Protect your account"
                  description="Email verification adds another layer of account protection."
                />

                <VerificationBenefit
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Continue securely"
                  description="After verification, return to IyanjuWorld and sign in."
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 px-10 py-8 xl:px-14">
            <p className="text-sm text-slate-400">
              Already verified?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-400 hover:text-blue-300"
              >
                Sign in
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
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>

              <div className="mt-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Mail className="h-7 w-7" />
                </div>

                <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Email verification
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  Check your inbox
                </h2>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  We sent a verification link to the email address used for
                  your IyanjuWorld account. Open the email and follow the link
                  to verify your account.
                </p>
              </div>

              {sent && (
                <div
                  role="status"
                  className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                >
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                    <p className="text-sm leading-6 text-emerald-700">
                      A new verification email has been sent. Please check
                      your inbox.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                >
                  <p className="text-sm leading-6 text-red-700">{error}</p>
                </div>
              )}

              <div className="mt-7">
                <Input
                  label="Registration email"
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
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                  onClick={() => void handleResendVerification()}
                >
                  <RefreshCw className="h-5 w-5" />
                  Resend verification email
                </Button>
              </div>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Didn't receive the email?
                </p>

                <ul className="mt-2 space-y-2 text-sm leading-5 text-slate-600">
                  <li>• Check your spam or junk folder.</li>
                  <li>• Confirm that the email address is correct.</li>
                  <li>• Wait a moment before requesting another email.</li>
                </ul>
              </div>

              <div className="mt-7 border-t border-slate-200 pt-6 text-center">
                <p className="text-sm text-slate-600">
                  Already verified your email?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              IyanjuWorld will never ask you to provide your password through
              email.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function VerificationBenefit({
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
