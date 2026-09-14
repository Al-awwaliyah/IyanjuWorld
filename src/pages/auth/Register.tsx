import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronLeft, UserRound } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { getSafeErrorMessage } from "../../libs/errors";
import { signUpWithPassword, type UserRole } from "../../libs/auth";

type AccountType = "customer" | "business" | "rider";

type RegisterLocationState = {
  redirectTo?: string;
};

const accountTypes: {
  value: AccountType;
  label: string;
  description: string;
}[] = [
  {
    value: "customer",
    label: "Customer",
    description: "Buy products from trusted businesses.",
  },
  {
    value: "business",
    label: "Business",
    description: "Sell products and grow your business.",
  },
  {
    value: "rider",
    label: "Rider",
    description: "Deliver orders and earn from deliveries.",
  },
];

function getUserRole(accountType: AccountType): UserRole {
  if (accountType === "business") return "business_owner";
  if (accountType === "rider") return "rider";
  return "customer";
}

function getRegistrationDestination(accountType: AccountType) {
  if (accountType === "business") return "/business/setup";
  if (accountType === "rider") return "/rider/setup";
  return "/customer/dashboard";
}

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as RegisterLocationState | null) ?? null;

  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const normalizedFullName = fullName.trim();
    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedFullName) return setError("Please enter your full name.");
    if (!normalizedPhone) return setError("Please enter your phone number.");
    if (!normalizedEmail) return setError("Please enter your email address.");
    if (password.length < 8) return setError("Your password must contain at least 8 characters.");
    if (password !== confirmPassword) return setError("Your passwords do not match.");
    if (!acceptedTerms) {
      return setError("Please accept the Terms of Service and Privacy Policy to continue.");
    }

    setLoading(true);

    try {
      const userRole = getUserRole(accountType);
      const destination = getRegistrationDestination(accountType);

      const { data, error: signUpError } = await signUpWithPassword(
        normalizedEmail,
        password,
        {
          full_name: normalizedFullName,
          phone: normalizedPhone,
          role: userRole,
        },
      );

      if (signUpError) throw signUpError;

      if (!data?.session) {
        navigate("/verify-email", {
          replace: true,
          state: {
            email: normalizedEmail,
            role: userRole,
            redirectTo:
              userRole === "customer"
                ? locationState?.redirectTo || destination
                : destination,
          },
        });
        return;
      }

      navigate(
        userRole === "customer"
          ? locationState?.redirectTo || destination
          : destination,
        { replace: true },
      );
    } catch (registrationError) {
      setError(getSafeErrorMessage(registrationError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
            <ChevronLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <UserRound className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your IyanjuWorld account</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Join IyanjuWorld as a customer, business owner, or rider.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-800">Account type</label>
              <div className="grid gap-3 sm:grid-cols-3">
                {accountTypes.map((type) => {
                  const selected = accountType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => { setAccountType(type.value); setError(""); }}
                      disabled={loading}
                      className={`relative rounded-xl border p-4 text-left transition ${selected ? "border-brand-600 bg-brand-50 ring-2 ring-brand-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {selected && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white"><Check className="h-3 w-3" /></span>}
                      <div className="pr-6 text-sm font-semibold text-slate-900">{type.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-600">{type.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Full name" value={fullName} onChange={(event) => { setFullName(event.target.value); setError(""); }} placeholder="Your full name" autoComplete="name" required disabled={loading} />
              <Input label="Phone number" type="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setError(""); }} placeholder="08012345678" autoComplete="tel" required disabled={loading} />
            </div>

            <Input label="Email address" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="you@example.com" autoComplete="email" required disabled={loading} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="At least 8 characters" autoComplete="new-password" required disabled={loading} />
              <Input label="Confirm password" type="password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(""); }} placeholder="Repeat your password" autoComplete="new-password" required disabled={loading} />
            </div>

            <label className="flex items-start gap-3 text-sm text-slate-600">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => { setAcceptedTerms(event.target.checked); setError(""); }} disabled={loading} className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <span>
                I agree to the <Link to="/terms" className="font-medium text-brand-700 hover:text-brand-800">Terms of Service</Link> and <Link to="/privacy" className="font-medium text-brand-700 hover:text-brand-800">Privacy Policy</Link>.
              </span>
            </label>

            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <Button type="submit" fullWidth loading={loading}>Create account</Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Sign in</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
