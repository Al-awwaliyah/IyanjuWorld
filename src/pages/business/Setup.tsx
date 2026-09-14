import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../libs/supabase";
import { getCurrentProfile } from "../../libs/auth";

type FormState = {
  name: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
};

const initialForm: FormState = {
  name: "",
  description: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  city: "",
  state: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Something went wrong. Please try again.";
}

export default function BusinessSetup() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          navigate("/login", { replace: true });
          return;
        }

        const profile = await getCurrentProfile();

        if (!profile) {
          throw new Error("Your user profile could not be found.");
        }

        if (profile.id !== user.id) {
          throw new Error(
            "Your profile does not match your authenticated account."
          );
        }

        // If this user already owns a business, send them to the dashboard.
        const { data: existingBusiness, error: businessError } =
          await supabase
            .from("businesses")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();

        if (businessError) {
          throw businessError;
        }

        if (existingBusiness) {
          navigate("/business/dashboard", { replace: true });
          return;
        }

        if (mounted) {
          setForm((current) => ({
            ...current,
            email: user.email ?? "",
          }));
        }
      } catch (err) {
        if (mounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");

    const name = form.name.trim();

    if (!name) {
      setError("Please enter your business name.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your business phone number.");
      return;
    }

    if (!form.address.trim()) {
      setError("Please enter your business address.");
      return;
    }

    if (!form.city.trim()) {
      setError("Please enter your city.");
      return;
    }

    if (!form.state.trim()) {
      setError("Please enter your state.");
      return;
    }

    const baseSlug = slugify(name);

    if (!baseSlug) {
      setError("Please enter a valid business name.");
      return;
    }

    try {
      setSaving(true);

      /*
       * Make sure there is an authenticated user before calling
       * the secure database function.
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      /*
       * Generate a unique slug client-side.
       *
       * The database function also performs a final duplicate check.
       */
      const uniqueSlug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

      /*
       * IMPORTANT:
       *
       * Business creation is now performed by the secure
       * create_business() PostgreSQL function.
       *
       * We deliberately do NOT send created_by or owner_id
       * from the browser. The database obtains the authenticated
       * user's ID with auth.uid().
       */
      const { data: business, error: createError } = await supabase.rpc(
        "create_business",
        {
          p_name: name,
          p_slug: uniqueSlug,
          p_description: form.description.trim() || null,
          p_phone: form.phone.trim() || null,
          p_whatsapp_number: form.whatsapp.trim() || null,
          p_email: form.email.trim() || user.email || null,
          p_address_line: form.address.trim() || null,
          p_city: form.city.trim() || null,
          p_state: form.state.trim() || null,
          p_country: "Nigeria",
          p_latitude: null,
          p_longitude: null,
        }
      );

      if (createError) {
        console.error("BUSINESS CREATION FAILED:", createError);
        throw createError;
      }

      if (!business?.id) {
        throw new Error(
          "Business creation completed but no business ID was returned."
        );
      }

      navigate("/business/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("Business setup error:", err);

      const message = getErrorMessage(err);

      if (
        message.toLowerCase().includes("already have a business") ||
        message.toLowerCase().includes("duplicate")
      ) {
        setError(
          "You already have a business. Redirecting you to your dashboard..."
        );

        setTimeout(() => {
          navigate("/business/dashboard", { replace: true });
        }, 1200);

        return;
      }

      if (
        message.toLowerCase().includes("authentication required") ||
        message.toLowerCase().includes("jwt")
      ) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-600">
            Loading your business setup...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Set Up Your Business
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Enter your business details to create your IyanjuWorld business
            account.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          {error && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="business-name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business Name
              </label>

              <input
                id="business-name"
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                placeholder="Enter your business name"
                disabled={saving}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="business-description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business Description
              </label>

              <textarea
                id="business-description"
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Tell customers about your business"
                rows={4}
                disabled={saving}
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="business-phone"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Phone Number
                </label>

                <input
                  id="business-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField("phone", event.target.value)
                  }
                  placeholder="08012345678"
                  disabled={saving}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="business-whatsapp"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  WhatsApp Number
                </label>

                <input
                  id="business-whatsapp"
                  type="tel"
                  value={form.whatsapp}
                  onChange={(event) =>
                    updateField("whatsapp", event.target.value)
                  }
                  placeholder="08012345678"
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="business-email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business Email
              </label>

              <input
                id="business-email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                placeholder="business@example.com"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="business-address"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Address
              </label>

              <input
                id="business-address"
                type="text"
                value={form.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
                placeholder="Business address"
                disabled={saving}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="business-city"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  City
                </label>

                <input
                  id="business-city"
                  type="text"
                  value={form.city}
                  onChange={(event) =>
                    updateField("city", event.target.value)
                  }
                  placeholder="e.g. Ibadan"
                  disabled={saving}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="business-state"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  State
                </label>

                <input
                  id="business-state"
                  type="text"
                  value={form.state}
                  onChange={(event) =>
                    updateField("state", event.target.value)
                  }
                  placeholder="e.g. Oyo"
                  disabled={saving}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <strong>Country:</strong> Nigeria
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating Business..." : "Create Business"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

