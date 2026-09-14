

import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  XCircle,
} from "lucide-react";
import { supabase } from "../../libs/supabase";
import { getCurrentProfile, type Profile } from "../../libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";

type Business = {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  active: boolean;
  verified: boolean;
};

export default function BusinessSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadBusiness();
  }, []);

  async function loadBusiness() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const currentProfile = await getCurrentProfile();

      if (!currentProfile) {
        throw new Error("Unable to load your account.");
      }

      setProfile(currentProfile);

      const { data, error: businessError } =
        await supabase
          .from("businesses")
          .select(
            "id, owner_id, name, slug, description, phone, email, address, city, state, logo_url, active, verified",
          )
          .eq("owner_id", currentProfile.id)
          .maybeSingle();

      if (businessError) {
        throw businessError;
      }

      if (!data) {
        throw new Error(
          "Your business profile could not be found.",
        );
      }

      const businessData = data as Business;

      setBusiness(businessData);

      setName(businessData.name || "");
      setDescription(businessData.description || "");
      setPhone(businessData.phone || "");
      setEmail(businessData.email || "");
      setAddress(businessData.address || "");
      setCity(businessData.city || "");
      setState(businessData.state || "");
      setLogoUrl(businessData.logo_url || "");
    } catch (err) {
      logAppError("business-settings-load", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error("Business name is required.");
      }

      const { data, error: updateError } = await supabase
        .from("businesses")
        .update({
          name: trimmedName,
          description: description.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          logo_url: logoUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", business.id)
        .eq("owner_id", profile?.id || "")
        .select(
          "id, owner_id, name, slug, description, phone, email, address, city, state, logo_url, active, verified",
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      setBusiness(data as Business);
      setSuccess("Business settings saved successfully.");
    } catch (err) {
      logAppError("business-settings-save", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading business settings...</span>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <SettingsIcon className="mx-auto mb-4 h-10 w-10 text-gray-400" />

          <h1 className="text-xl font-semibold text-gray-900">
            Business profile unavailable
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "We could not find a business associated with your account."}
          </p>

          <Link
            to="/business/dashboard"
            className="mt-6 inline-flex rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-900 dark-surface"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Business Settings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage the public information associated with your
            business.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadBusiness()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <form
          onSubmit={saveSettings}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <Building2 className="h-5 w-5 text-gray-700" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Business Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  This information can be displayed on your
                  storefront.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <label
                htmlFor="business-name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Business Name
              </label>

              <input
                id="business-name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="Your business name"
              />
            </div>

            <div>
              <label
                htmlFor="business-description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="business-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="Tell customers about your business..."
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="business-phone"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Business Phone
                </label>

                <input
                  id="business-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  placeholder="080..."
                />
              </div>

              <div>
                <label
                  htmlFor="business-email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Business Email
                </label>

                <input
                  id="business-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  placeholder="business@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="business-address"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Address
              </label>

              <textarea
                id="business-address"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="Business address"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="business-city"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  City
                </label>

                <input
                  id="business-city"
                  value={city}
                  onChange={(event) =>
                    setCity(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  placeholder="City"
                />
              </div>

              <div>
                <label
                  htmlFor="business-state"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  State
                </label>

                <input
                  id="business-state"
                  value={state}
                  onChange={(event) =>
                    setState(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  placeholder="State"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="business-logo"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Logo URL
              </label>

              <input
                id="business-logo"
                type="url"
                value={logoUrl}
                onChange={(event) =>
                  setLogoUrl(event.target.value)
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="https://..."
              />

              <p className="mt-1.5 text-xs text-gray-500">
                A secure image-upload flow can be connected to
                Supabase Storage later.
              </p>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-50 dark-surface"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Business Status
            </h2>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500">
                  Account
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    business.active
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {business.active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500">
                  Verification
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    business.verified
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {business.verified
                    ? "Verified"
                    : "Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h2 className="font-semibold text-gray-900">
              Storefront
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Customers can discover your products through your
              public storefront and marketplace listings.
            </p>

            <Link
              to={
                business.slug
                  ? `/businesses/${business.slug}`
                  : "/businesses"
              }
              className="mt-4 inline-flex text-sm font-semibold text-gray-900 hover:underline"
            >
              View storefront
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
