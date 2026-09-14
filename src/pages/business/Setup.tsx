import { FormEvent, useEffect, useState } from "react";
import { Building2, Loader2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentProfile } from "../../libs/auth";
import { supabase } from "../../libs/supabase";
import { getSafeErrorMessage, logAppError } from "../../libs/errors";

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "business"
  );
}

export default function BusinessSetup() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getCurrentProfile();

        if (!profile) {
          navigate("/login", { replace: true });
          return;
        }

        setEmail(profile.email ?? "");
        setPhone(profile.phone ?? "");
        setName(
          profile.full_name
            ? `${profile.full_name}'s Business`
            : ""
        );

        /*
         * Check whether this authenticated user already owns
         * a business profile.
         */
        const {
          data,
          error: queryError,
        } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", profile.id)
          .maybeSingle();

        if (queryError) {
          throw queryError;
        }

        if (data?.id) {
          navigate("/business/dashboard", { replace: true });
          return;
        }
      } catch (err) {
        logAppError(err, {
          operation: "business.setup.load",
        });

        setError(getSafeErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [navigate]);

  const submit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Business name is required.");
      return;
    }

    if (!phone.trim()) {
      setError("Business phone number is required.");
      return;
    }

    if (
      !address.trim() ||
      !city.trim() ||
      !state.trim()
    ) {
      setError(
        "Please provide your business address, city and state."
      );
      return;
    }

    setSaving(true);

    try {
      /*
       * Get the authenticated Supabase user directly.
       *
       * This is important because your RLS policy is:
       *
       * created_by = auth.uid()
       *
       * Therefore the value inserted into created_by must
       * exactly match the authenticated user's UUID.
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "Your session could not be verified. Please log in again."
        );
      }

      /*
       * Get the application profile as well.
       */
      const profile = await getCurrentProfile();

      if (!profile) {
        throw new Error(
          "Your profile could not be found. Please log in again."
        );
      }

      /*
       * Make sure the profile belongs to the authenticated
       * Supabase user.
       */
      if (profile.id !== user.id) {
        throw new Error(
          "Your account session is invalid. Please log in again."
        );
      }

      const baseSlug = slugify(name);
      let slug = baseSlug;

      /*
       * Check whether the generated slug is already being used.
       */
      const {
        data: existing,
        error: slugError,
      } = await supabase
        .from("businesses")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugError) {
        throw slugError;
      }

      if (existing?.id) {
        slug = `${baseSlug}-${Date.now().toString(36)}`;
      }

      const now = new Date().toISOString();

      /*
       * IMPORTANT:
       *
       * created_by MUST equal auth.uid()
       * because of your RLS INSERT policy:
       *
       * created_by = auth.uid()
       *
       * owner_id is also set to the same user because the
       * application uses owner_id to identify the business owner.
       *
       * The additional NOT NULL fields are supplied explicitly
       * to make this insert compatible with your current table.
       */
      const businessPayload = {
        id: crypto.randomUUID(),

        name: name.trim(),
        slug,
        description: description.trim() || null,

        phone: phone.trim(),
        whatsapp_number: whatsapp.trim() || null,
        email: email.trim() || null,

        address_line: address.trim(),
        address: address.trim(),

        city: city.trim(),
        state: state.trim(),
        country: "Nigeria",

        /*
         * Ownership / RLS
         */
        created_by: user.id,
        owner_id: user.id,

        /*
         * Business state
         */
        status: "pending",
        is_verified: false,
        is_open: true,

        /*
         * Existing legacy/duplicate fields in your table.
         * Keeping these synchronized prevents null/default
         * problems in parts of the application that use them.
         */
        active: true,
        verified: false,
        open: true,

        logo_url: null,
        cover_image_url: null,
        logo: null,
        cover: null,
        whatsapp: whatsapp.trim() || null,

        verification_status: "pending",

        created_at: now,
        updated_at: now,
      };

      const {
        data,
        error: insertError,
      } = await supabase
        .from("businesses")
        .insert(businessPayload)
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      if (!data?.id) {
        throw new Error(
          "Business profile could not be created."
        );
      }

      /*
       * Business profile successfully created.
       */
      navigate("/business/dashboard", {
        replace: true,
      });
    } catch (err) {
      logAppError(err, {
        operation: "business.setup.create",
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
      </div>
    );
  }

  const input =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <Building2 className="h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Set up your business profile
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Complete your business information before
              accessing your Business Dashboard.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <input
              className={input}
              placeholder="Business name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              required
            />

            <textarea
              className={`${input} min-h-28`}
              placeholder="Business description (optional)"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              disabled={saving}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <input
                className={input}
                placeholder="Business phone"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                disabled={saving}
                required
              />

              <input
                className={input}
                placeholder="WhatsApp number (optional)"
                value={whatsapp}
                onChange={(e) =>
                  setWhatsapp(e.target.value)
                }
                disabled={saving}
              />
            </div>

            <input
              className={input}
              type="email"
              placeholder="Business email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
            />

            <input
              className={input}
              placeholder="Business address"
              value={address}
              onChange={(e) =>
                setAddress(e.target.value)
              }
              disabled={saving}
              required
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <input
                className={input}
                placeholder="City"
                value={city}
                onChange={(e) =>
                  setCity(e.target.value)
                }
                disabled={saving}
                required
              />

              <input
                className={input}
                placeholder="State"
                value={state}
                onChange={(e) =>
                  setState(e.target.value)
                }
                disabled={saving}
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? "Creating profile..."
                : "Complete business setup"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
