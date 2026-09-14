import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  getAuthState,
  signOut,
} from "../../libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import { supabase } from "../../libs/supabase";

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  active: boolean;
}

interface AddressData {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  is_default: boolean;
}

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(
    null
  );
  const [address, setAddress] = useState<AddressData | null>(
    null
  );

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [addressLabel, setAddressLabel] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [addressPhone, setAddressPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [addressMessage, setAddressMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setProfileMessage("");
      setAddressMessage("");

      const authState = await getAuthState();

      if (!authState.user || !authState.profile) {
        setError("Please sign in to access your profile.");
        return;
      }

      const userId = authState.user.id;
      const userEmail = authState.user.email ?? "";

      const { data: profileRow, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            "id, email, full_name, phone, role, active"
          )
          .eq("id", userId)
          .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const profileData: ProfileData = {
        id: userId,
        email:
          profileRow?.email ||
          userEmail ||
          authState.profile.email ||
          "",
        full_name:
          profileRow?.full_name ||
          authState.profile.full_name ||
          "",
        phone:
          profileRow?.phone ||
          authState.profile.phone ||
          "",
        role: profileRow?.role || authState.profile.role,
        active:
          typeof profileRow?.active === "boolean"
            ? profileRow.active
            : authState.profile.active,
      };

      setProfile(profileData);
      setFullName(profileData.full_name);
      setPhone(profileData.phone);

      const { data: addressRow, error: addressError } =
        await supabase
          .from("customer_addresses")
          .select(
            "id, label, address, city, state, phone, is_default"
          )
          .eq("customer_id", userId)
          .order("is_default", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (addressError) {
        throw addressError;
      }

      if (addressRow) {
        const addressData: AddressData = {
          id: addressRow.id,
          label: addressRow.label || "Default address",
          address: addressRow.address || "",
          city: addressRow.city || "",
          state: addressRow.state || "",
          phone: addressRow.phone || "",
          is_default: Boolean(addressRow.is_default),
        };

        setAddress(addressData);
        setAddressLabel(addressData.label);
        setStreetAddress(addressData.address);
        setCity(addressData.city);
        setState(addressData.state);
        setAddressPhone(addressData.phone);
      } else {
        setAddress(null);
        setAddressLabel("Home");
        setStreetAddress("");
        setCity("");
        setState("");
        setAddressPhone(profileData.phone);
      }
    } catch (err) {
      logAppError(err, {
        action: "customer.profile.load",
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleProfileSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      setError("");
      setProfileMessage("");

      const authState = await getAuthState();

      if (!authState.user) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      const cleanName = fullName.trim();
      const cleanPhone = phone.trim();

      if (!cleanName) {
        setError("Please enter your full name.");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          phone: cleanPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authState.user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              full_name: cleanName,
              phone: cleanPhone,
            }
          : current
      );

      setProfileMessage("Your profile has been updated successfully.");
    } catch (err) {
      logAppError(err, {
        action: "customer.profile.update",
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddressSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setSavingAddress(true);
      setError("");
      setAddressMessage("");

      const authState = await getAuthState();

      if (!authState.user) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      const cleanLabel = addressLabel.trim() || "Home";
      const cleanAddress = streetAddress.trim();
      const cleanCity = city.trim();
      const cleanState = state.trim();
      const cleanPhone = addressPhone.trim();

      if (!cleanAddress || !cleanCity || !cleanState) {
        setError(
          "Please complete your delivery address, city, and state."
        );
        return;
      }

      if (address) {
        const { error: updateError } = await supabase
          .from("customer_addresses")
          .update({
            label: cleanLabel,
            address: cleanAddress,
            city: cleanCity,
            state: cleanState,
            phone: cleanPhone || null,
            is_default: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", address.id)
          .eq("customer_id", authState.user.id);

        if (updateError) {
          throw updateError;
        }

        setAddress({
          ...address,
          label: cleanLabel,
          address: cleanAddress,
          city: cleanCity,
          state: cleanState,
          phone: cleanPhone,
          is_default: true,
        });
      } else {
        const { data, error: insertError } = await supabase
          .from("customer_addresses")
          .insert({
            customer_id: authState.user.id,
            label: cleanLabel,
            address: cleanAddress,
            city: cleanCity,
            state: cleanState,
            phone: cleanPhone || null,
            is_default: true,
          })
          .select(
            "id, label, address, city, state, phone, is_default"
          )
          .single();

        if (insertError) {
          throw insertError;
        }

        if (data) {
          setAddress({
            id: data.id,
            label: data.label || cleanLabel,
            address: data.address || cleanAddress,
            city: data.city || cleanCity,
            state: data.state || cleanState,
            phone: data.phone || cleanPhone,
            is_default: Boolean(data.is_default),
          });
        }
      }

      setAddressMessage(
        "Your delivery address has been saved successfully."
      );
    } catch (err) {
      logAppError(err, {
        action: "customer.profile.address.update",
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      setError("");

      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      logAppError(err, {
        action: "customer.profile.sign_out",
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <UserRound className="h-6 w-6 text-red-600" />
          </div>

          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Profile unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={() => void loadProfile(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Account
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your account information and delivery details.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void loadProfile(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
              {profile.full_name
                ? profile.full_name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part.charAt(0).toUpperCase())
                    .join("")
                : "U"}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  {profile.full_name || "Customer"}
                </h2>

                {profile.active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Customer account
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleProfileSubmit}
          className="space-y-5 p-5 sm:p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="full-name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>

              <Input
                id="full-name"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Phone number
              </label>

              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="Phone number"
                  autoComplete="tel"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-slate-50 pl-9"
                />
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                Your login email is managed through your account
                authentication settings.
              </p>
            </div>
          </div>

          {profileMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {profileMessage}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={savingProfile}
            >
              {savingProfile ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save profile
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <MapPin className="h-5 w-5 text-slate-600" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Default delivery address
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Used as your preferred delivery location during
                checkout.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleAddressSubmit}
          className="space-y-5 p-5 sm:p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="address-label"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Address label
              </label>

              <Input
                id="address-label"
                value={addressLabel}
                onChange={(event) =>
                  setAddressLabel(event.target.value)
                }
                placeholder="Home, Work, etc."
              />
            </div>

            <div>
              <label
                htmlFor="address-phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Delivery phone
              </label>

              <Input
                id="address-phone"
                value={addressPhone}
                onChange={(event) =>
                  setAddressPhone(event.target.value)
                }
                placeholder="Phone number"
                autoComplete="tel"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="street-address"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Street address
              </label>

              <Input
                id="street-address"
                value={streetAddress}
                onChange={(event) =>
                  setStreetAddress(event.target.value)
                }
                placeholder="House number, street, area"
                autoComplete="street-address"
              />
            </div>

            <div>
              <label
                htmlFor="city"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                City
              </label>

              <Input
                id="city"
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
                placeholder="City"
                autoComplete="address-level2"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                State
              </label>

              <Input
                id="state"
                value={state}
                onChange={(event) =>
                  setState(event.target.value)
                }
                placeholder="State"
                autoComplete="address-level1"
              />
            </div>
          </div>

          {addressMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {addressMessage}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={savingAddress}
            >
              {savingAddress ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              Save address
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Account security
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Keep your account secure and manage your session.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Password and authentication
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Use the password recovery flow if you need to change
              or reset your password.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/forgot-password">
              Manage password
            </Link>
          </Button>
        </div>

        <div className="border-t border-slate-100 p-5 sm:p-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            disabled={signingOut}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {signingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}
