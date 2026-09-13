import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  Bike,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { signUpWithPassword } from "../../libs/auth";
import { getSafeErrorMessage } from "../../libs/errors";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

type AccountType = "customer" | "business" | "rider";

export default function Register() {
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    const normalizedPhone = phone.trim();

    if (!normalizedName) {
      setError("Please enter your full name.");
      return;
    }

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!normalizedPhone) {
      setError("Please enter your phone number.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const result = await signUpWithPassword(
        normalizedEmail,
        password,
        {
          full_name: normalizedName,
          phone: normalizedPhone,
          role: accountType,
        },
      );

      if (!result.user) {
        setError(
          "Your account could not be created. Please try again.",
        );
        return;
      }

      if (result.session) {
        if (accountType === "business") {
          navigate("/business/dashboard", { replace: true });
          return;
        }

        if (accountType === "rider") {
          navigate("/rider/dashboard", { replace: true });
          return;
        }

        navigate("/customer/dashboard", { replace: true });
        return;
      }

      setSuccess(
        "Your account has been created. Please check your email to verify your account before signing in.",
      );
    } catch (registrationError) {
      setError(getSafeErrorMessage(registrationError));
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
                Join IyanjuWorld
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight text-white xl:text-6xl">
                Be part of a trusted digital marketplace.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
                Whether you are shopping, selling, or delivering, IyanjuWorld
                gives you the tools to participate in one connected commerce
                ecosystem.
              </p>

              <div className="mt-10 space-y-4">
                <RegisterBenefit text="Discover products from local businesses" />
                <RegisterBenefit text="Manage orders and marketplace activity" />
                <RegisterBenefit text="Connect securely with customers and sellers" />
                <RegisterBenefit text="Use integrated delivery and payment services" />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 px-10 py-8 xl:px-14">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              <span>Built with security and trusted transactions in mind.</span>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-2xl">
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
                  Create account
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  Get started with IyanjuWorld
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Choose how you want to use the marketplace.
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <AccountTypeButton
                  type="customer"
                  active={accountType === "customer"}
                  icon={<UserRound className="h-5 w-5" />}
                  title="Customer"
                  description="Shop products"
                  onClick={() => setAccountType("customer")}
                  disabled={loading}
                />

                <AccountTypeButton
                  type="business"
                  active={accountType === "business"}
                  icon={<Store className="h-5 w-5" />}
                  title="Business"
                  description="Sell products"
                  onClick={() => setAccountType("business")}
                  disabled={loading}
                />

                <AccountTypeButton
                  type="rider"
                  active={accountType === "rider"}
                  icon={<Bike className="h-5 w-5" />}
                  title="Rider"
                  description="Deliver orders"
                  onClick={() => setAccountType("rider")}
                  disabled={loading}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                >
                  <p className="text-sm leading-6 text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                >
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                    <p className="text-sm leading-6 text-emerald-700">
                      {success}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Full name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    disabled={loading}
                    leftIcon={<UserRound className="h-5 w-5" />}
                    required
                  />

                  <Input
                    label="Phone number"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    disabled={loading}
                    leftIcon={<Phone className="h-5 w-5" />}
                    required
                  />
                </div>

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

                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    leftIcon={<LockKeyhole className="h-5 w-5" />}
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

                  <Input
                    label="Confirm password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
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
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(event) =>
                      setAcceptTerms(event.target.checked)
                    }
                    disabled={loading}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <span className="text-sm leading-6 text-slate-600">
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  Create {accountType} account
                  {!loading && <ArrowRight className="h-5 w-5" />}
                </Button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Already registered?
                </span>

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <Link to="/login" className="block">
                <Button variant="outline" size="lg" fullWidth>
                  Sign in instead
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              Your account type determines the initial dashboard you access.
              Additional business and rider verification may be required
              before certain platform features become available.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function AccountTypeButton({
  type,
  active,
  icon,
  title,
  description,
  onClick,
  disabled,
}: {
  type: AccountType;
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={[
        "rounded-2xl border p-4 text-left transition",
        active
          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-10 w-10 items-center justify-center rounded-xl",
          active
            ? "bg-blue-600 text-white"
            : "bg-slate-100 text-slate-600",
        ].join(" ")}
      >
        {icon}
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-950">{title}</p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>

      <span className="sr-only">
        {type === "customer"
          ? "Customer account"
          : type === "business"
            ? "Business account"
            : "Rider account"}
      </span>
    </button>
  );
}

function RegisterBenefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-400" />

      <span className="text-sm text-slate-300">{text}</span>
    </div>
  );
}
