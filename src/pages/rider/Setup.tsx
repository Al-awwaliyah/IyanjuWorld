import { FormEvent, useEffect, useState } from "react";
import { Bike, Loader2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentProfile } from "../../libs/auth";
import { supabase } from "../../libs/supabase";
import { getSafeErrorMessage, logAppError } from "../../libs/errors";

const vehicleTypes = ["bicycle", "motorcycle", "car", "van", "other"] as const;

export default function RiderSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleDescription, setVehicleDescription] = useState("");
  const [registration, setRegistration] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [area, setArea] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getCurrentProfile();
        if (!profile) { navigate("/login", { replace: true }); return; }
        setFullName(profile.full_name ?? ""); setPhone(profile.phone ?? "");
        const { data, error: queryError } = await supabase.from("riders").select("id").eq("user_id", profile.id).maybeSingle();
        if (queryError) throw queryError;
        if (data) navigate("/rider/dashboard", { replace: true });
      } catch (err) {
        logAppError(err, { operation: "rider.setup.load" }); setError(getSafeErrorMessage(err));
      } finally { setLoading(false); }
    };
    void load();
  }, [navigate]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    if (!fullName.trim()) return setError("Full name is required.");
    if (!phone.trim()) return setError("Phone number is required.");
    if (!vehicleTypes.includes(vehicleType as typeof vehicleTypes[number])) return setError("Please select a valid vehicle type.");
    if (!city.trim() || !state.trim() || !area.trim()) return setError("Please provide your operating city, state and area.");
    setSaving(true);
    try {
      const profile = await getCurrentProfile();
      if (!profile) throw new Error("Your session could not be verified.");
      const { data, error: insertError } = await supabase.from("riders").insert({
        user_id: profile.id, full_name: fullName.trim(), phone: phone.trim(),
        vehicle_type: vehicleType, vehicle_description: vehicleDescription.trim() || null,
        vehicle_registration_number: registration.trim() || null,
        operating_city: city.trim(), operating_state: state.trim(), operating_area: area.trim(),
        verification_status: "pending", availability_status: "offline", is_active: true, is_online: false,
      }).select("id").single();
      if (insertError) throw insertError;
      if (!data?.id) throw new Error("Rider profile could not be created.");
      navigate("/rider/dashboard", { replace: true });
    } catch (err) {
      logAppError(err, { operation: "rider.setup.create" }); setError(getSafeErrorMessage(err));
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-500" /></div>;
  const input = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100";
  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6"><div className="mx-auto max-w-2xl"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Bike className="h-7 w-7" /></div><h1 className="text-2xl font-bold text-slate-900">Set up your rider profile</h1><p className="mt-2 text-sm text-slate-600">Complete your rider and vehicle information before accessing your Rider Dashboard.</p></div>
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2"><input className={input} placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} disabled={saving} required /><input className={input} placeholder="Phone number" value={phone} onChange={e=>setPhone(e.target.value)} disabled={saving} required /></div>
      <div className="grid gap-5 sm:grid-cols-2"><select className={input} value={vehicleType} onChange={e=>setVehicleType(e.target.value)} disabled={saving} required><option value="">Select vehicle type</option>{vehicleTypes.map(v=><option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}</select><input className={input} placeholder="Vehicle registration number (optional)" value={registration} onChange={e=>setRegistration(e.target.value)} disabled={saving} /></div>
      <textarea className={`${input} min-h-24`} placeholder="Vehicle description (optional)" value={vehicleDescription} onChange={e=>setVehicleDescription(e.target.value)} disabled={saving} />
      <div className="grid gap-5 sm:grid-cols-2"><input className={input} placeholder="Operating city" value={city} onChange={e=>setCity(e.target.value)} disabled={saving} required /><input className={input} placeholder="Operating state" value={state} onChange={e=>setState(e.target.value)} disabled={saving} required /></div>
      <input className={input} placeholder="Operating area" value={area} onChange={e=>setArea(e.target.value)} disabled={saving} required />
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? "Creating profile..." : "Complete rider setup"}</button>
    </form>
  </section></div></main>;
}
