import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getCurrentProfile } from "../../libs/auth";
import { supabase } from "../../libs/supabase";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import {
  formatDate,
  formatPhone,
} from "../../libs/format";

type Rider = {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  operating_area: string | null;
  bank_name: string | null;
  bank_code: string | null;
  account_name: string | null;
  account_number_last4: string | null;
  verified: boolean;
  active: boolean;
  available: boolean;
  created_at: string;
  updated_at: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar: string | null;
};

export default function RiderProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rider, setRider] = useState<Rider | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [operatingArea, setOperatingArea] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = async (
    showRefreshState = false
  ) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccess("");

      const currentProfile = await getCurrentProfile();

      if (!currentProfile?.id) {
        throw new Error(
          "Your session could not be verified."
        );
      }

      const currentUser = currentProfile as Profile;

      setProfile(currentUser);

      const { data, error: riderError } = await supabase
        .from("riders")
        .select(
          `
            id,
            user_id,
            full_name,
            phone,
            email,
            photo_url,
            vehicle_type,
            vehicle_number,
            operating_area,
            bank_name,
            bank_code,
            account_name,
            account_number_last4,
            verified,
            active,
            available,
            created_at,
            updated_at
          `
        )
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (riderError) {
        throw riderError;
      }

      if (!data) {
        throw new Error(
          "Your rider profile could not be found."
        );
      }

      const riderData = data as Rider;

      setRider(riderData);

      setFullName(
        riderData.full_name ??
          currentUser.full_name ??
          ""
      );

      setPhone(
        riderData.phone ??
          currentUser.phone ??
          ""
      );

      setVehicleType(
        riderData.vehicle_type ?? ""
      );

      setVehicleNumber(
        riderData.vehicle_number ?? ""
      );

      setOperatingArea(
        riderData.operating_area ?? ""
      );
    } catch (err) {
      logAppError(err, {
        operation: "rider.profile.load",
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const saveProfile = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!rider || !profile) {
      return;
    }

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanVehicleType =
      vehicleType.trim();
    const cleanVehicleNumber =
      vehicleNumber.trim();
    const cleanOperatingArea =
      operatingArea.trim();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanPhone) {
      setError("Please enter your phone number.");
      return;
    }

    if (!cleanVehicleType) {
      setError("Please enter your vehicle type.");
      return;
    }

    if (!cleanOperatingArea) {
      setError(
        "Please enter your operating area."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { error: riderUpdateError } =
        await supabase
          .from("riders")
          .update({
            full_name: cleanName,
            phone: cleanPhone,
            vehicle_type: cleanVehicleType,
            vehicle_number:
              cleanVehicleNumber || null,
            operating_area:
              cleanOperatingArea,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rider.id)
          .eq("user_id", profile.id);

      if (riderUpdateError) {
        throw riderUpdateError;
      }

      const { error: profileUpdateError } =
        await supabase
          .from("profiles")
          .update({
            full_name: cleanName,
            phone: cleanPhone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

      if (profileUpdateError) {
        logAppError(profileUpdateError, {
          operation:
            "rider.profile.update_profile_record",
        });
      }

      setRider((current) =>
        current
          ? {
              ...current,
              full_name: cleanName,
              phone: cleanPhone,
              vehicle_type:
                cleanVehicleType,
              vehicle_number:
                cleanVehicleNumber || null,
              operating_area:
                cleanOperatingArea,
              updated_at:
                new Date().toISOString(),
            }
          : current
      );

      setProfile((current) =>
        current
          ? {
              ...current,
              full_name: cleanName,
              phone: cleanPhone,
            }
          : current
      );

      setSuccess(
        "Your rider profile has been updated successfully."
      );
    } catch (err) {
      logAppError(err, {
        operation: "rider.profile.save",
        riderId: rider.id,
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-slate-200" />
            <div className="h-40 rounded-2xl bg-white" />
            <div className="h-[500px] rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/rider/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Rider Profile
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Manage your rider information and delivery details.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadProfile(true)}
            disabled={refreshing || saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Something went wrong
              </p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Profile updated
              </p>
              <p className="mt-1">{success}</p>
            </div>
          </div>
        )}

        {rider && (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-blue-700">
                      {rider.photo_url ? (
                        <img
                          src={rider.photo_url}
                          alt={
                            rider.full_name ||
                            "Rider"
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-8 w-8" />
                      )}
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {rider.full_name ||
                          "Rider"}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Rider ID:{" "}
                        <span className="font-mono">
                          {rider.id.slice(0, 8)}
                        </span>
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Joined{" "}
                        {formatDate(
                          rider.created_at
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {rider.verified ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                        Verification pending
                      </span>
                    )}

                    {rider.active ? (
                      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Availability
                  </p>

                  <p
                    className={`mt-1 text-sm font-bold ${
                      rider.available
                        ? "text-emerald-700"
                        : "text-slate-700"
                    }`}
                  >
                    {rider.available
                      ? "Available for deliveries"
                      : "Currently unavailable"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Bank payout
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {rider.bank_name ||
                      "Bank account on file"}
                  </p>

                  {rider.account_number_last4 && (
                    <p className="mt-1 text-xs text-slate-500">
                      Account ending in{" "}
                      {rider.account_number_last4}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <form
              onSubmit={saveProfile}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Personal information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Keep your contact and rider information up to date.
                </p>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="rider-full-name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full name
                  </label>

                  <input
                    id="rider-full-name"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rider-phone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Phone number
                  </label>

                  <input
                    id="rider-phone"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value
                      )
                    }
                    type="tel"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="08012345678"
                  />

                  {phone && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      {formatPhone(phone)}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="rider-email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email
                  </label>

                  <input
                    id="rider-email"
                    value={rider.email || ""}
                    readOnly
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Your account email cannot be changed here.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Delivery information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  This information helps the platform assign suitable delivery requests.
                </p>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <div>
                  <label
                    htmlFor="vehicle-type"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Vehicle type
                  </label>

                  <input
                    id="vehicle-type"
                    value={vehicleType}
                    onChange={(event) =>
                      setVehicleType(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Motorcycle"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vehicle-number"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Vehicle number
                  </label>

                  <input
                    id="vehicle-number"
                    value={vehicleNumber}
                    onChange={(event) =>
                      setVehicleNumber(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. ABC-123-XY"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="operating-area"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Operating area
                  </label>

                  <textarea
                    id="operating-area"
                    value={operatingArea}
                    onChange={(event) =>
                      setOperatingArea(
                        event.target.value
                      )
                    }
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Describe the areas where you normally accept deliveries"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Example: Ibadan North, Ibadan South-West and nearby areas.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50 p-5 sm:flex sm:items-center sm:justify-between sm:p-6">
                <p className="mb-4 text-xs leading-5 text-slate-500 sm:mb-0 sm:max-w-md">
                  Your verified bank information is managed separately for
                  secure rider payouts and is not editable from this page.
                </p>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </form>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Rider verification & payouts
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Rider verification and bank-account verification are
                    controlled by the platform. Delivery earnings become
                    eligible for direct bank payout only after the customer
                    confirms delivery.
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Riders do not need a separate wallet and cannot manually
                    withdraw delivery earnings from this page.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
