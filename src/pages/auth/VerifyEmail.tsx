import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, RefreshCw, ShieldCheck } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { getSafeErrorMessage } from "../../libs/errors";
import { supabase } from "../../libs/supabase";
import { getCurrentProfile, type UserRole } from "../../libs/auth";

type VerificationLocationState = {
  email?: string;
  role?: UserRole;
  redirectTo?: string;
};

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

async function getPostVerificationPath(fallbackRole?: UserRole, fallbackRedirect?: string) {
  const profile = await getCurrentProfile();
  const role = profile?.role ?? fallbackRole ?? "customer";

  if (role === "business_owner") {
    const { data } = await supabase.from("businesses").select("id").eq("owner_id", profile?.id ?? "").maybeSingle();
    return data ? "/business/dashboard" : "/business/setup";
  }

  if (role === "rider") {
    const { data } = await supabase.from("riders").select("id").eq("user_id", profile?.id ?? "").maybeSingle();
    return data ? "/rider/dashboard" : "/rider/setup";
  }

  return fallbackRedirect?.startsWith("/") && !fallbackRedirect.startsWith("//") ? fallbackRedirect : "/customer/dashboard";
}

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const locationState = useMemo(
    () =>
      (location.state as VerificationLocationState | null) ?? {
        email: "",
      },
    [location.state],
  );

  const [email, setEmail] = useState(locationState.email ?? "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    let mounted = true;

    const checkExistingSession = async () => {
      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (!mounted || sessionError || !data.session) {
          return;
        }

        const redirectTo = await getPostVerificationPath(locationState.role, locationState.redirectTo);
        navigate(redirectTo, { replace: true });
      } catch {
        // Do not interrupt the OTP screen if session lookup fails.
      }
    };

    void checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [
    navigate,
    locationState.redirectTo,
    locationState.role,
  ]);

  const normalizedEmail = email.trim().toLowerCase();

  const handleOtpChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, OTP_LENGTH);

    setOtp(cleaned);
    setError("");
    setSuccess("");
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!normalizedEmail) {
      setError("Please enter the email address used during registration.");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      setError(`Please enter the ${OTP_LENGTH}-digit verification code.`);
      return;
    }

    setLoading(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otp,
        type: "email",
      });

      if (verifyError) {
        throw verifyError;
      }

      if (!data.session) {
        setSuccess(
          "Your email has been verified. Please sign in to continue.",
        );
        return;
      }

      const redirectTo = await getPostVerificationPath(locationState.role, locationState.redirectTo);
      navigate(redirectTo, { replace: true });
    } catch (verificationError) {
      setError(getSafeErrorMessage(verificationError));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");

    if (!normalizedEmail) {
      setError("Please enter your email address first.");
      return;
    }

    if (cooldown > 0) {
      return;
    }

    setResending(true);

    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
        },
      });

      if (resendError) {
        throw resendError;
      }

      setOtp("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setSuccess("A new verification code has been sent to your email.");
    } catch (resendError) {
      setError(getSafeErrorMessage(resendError));
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <Mail className="h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Verify your email
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the 6-digit verification code sent to your email address.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
                setSuccess("");
              }}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading || resending}
            />

            <div>
              <label
                htmlFor="verification-code"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Verification code
              </label>

              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) => handleOtpChange(event.target.value)}
                placeholder="000000"
                maxLength={OTP_LENGTH}
                disabled={loading || resending}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-semibold tracking-[0.45em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            ) : null}

            {success ? (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {success}
              </div>
            ) : null}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={resending || otp.length !== OTP_LENGTH}
            >
              Verify email
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Didn't receive the code?
            </p>

            <button
              type="button"
              onClick={handleResend}
              disabled={loading || resending || cooldown > 0}
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <RefreshCw
                className={`h-4 w-4 ${resending ? "animate-spin" : ""}`}
              />

              {resending
                ? "Sending..."
                : cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Resend verification code"}
            </button>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            For your security, never share your verification code with
            anyone.
          </p>
        </section>
      </div>
    </main>
  );
}
