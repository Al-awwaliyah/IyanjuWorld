-- IyanjuWorld
-- Migration 0019: role-aware onboarding and rider frontend compatibility

-- ============================================================
-- ROLE-AWARE PROFILE CREATION
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  final_role public.user_role;
begin
  requested_role := lower(trim(coalesce(new.raw_user_meta_data ->> 'role', 'customer')));

  if requested_role = 'business' then
    requested_role := 'business_owner';
  end if;

  if requested_role in ('customer', 'business_owner', 'rider', 'admin') then
    final_role := requested_role::public.user_role;
  else
    final_role := 'customer'::public.user_role;
  end if;

  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    final_role
  )
  on conflict (id) do update
    set full_name = coalesce(public.profiles.full_name, excluded.full_name),
        phone = coalesce(public.profiles.phone, excluded.phone);

  return new;
end;
$$;

-- Backfill profiles created by the old trigger. Only change customer
-- profiles when Auth metadata explicitly requested a business/rider role.
update public.profiles p
set role = case
  when lower(trim(coalesce(u.raw_user_meta_data ->> 'role', ''))) = 'business' then 'business_owner'::public.user_role
  when lower(trim(coalesce(u.raw_user_meta_data ->> 'role', ''))) = 'business_owner' then 'business_owner'::public.user_role
  when lower(trim(coalesce(u.raw_user_meta_data ->> 'role', ''))) = 'rider' then 'rider'::public.user_role
  else p.role
end
from auth.users u
where u.id = p.id
  and p.role = 'customer'::public.user_role
  and lower(trim(coalesce(u.raw_user_meta_data ->> 'role', ''))) in ('business', 'business_owner', 'rider');

-- ============================================================
-- RIDER FRONTEND COMPATIBILITY
-- ============================================================

alter table public.riders
  add column if not exists vehicle_number text,
  add column if not exists available boolean not null default false,
  add column if not exists verified boolean not null default false,
  add column if not exists active boolean not null default true,
  add column if not exists email text,
  add column if not exists bank_name text,
  add column if not exists bank_code text,
  add column if not exists account_name text,
  add column if not exists account_number_last4 text;

update public.riders
set
  vehicle_number = vehicle_registration_number,
  available = (availability_status = 'available'),
  verified = (verification_status = 'verified'),
  active = is_active
where vehicle_number is distinct from vehicle_registration_number
   or available is distinct from (availability_status = 'available')
   or verified is distinct from (verification_status = 'verified')
   or active is distinct from is_active;

create or replace function public.sync_rider_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.vehicle_number := coalesce(new.vehicle_number, new.vehicle_registration_number);
    new.vehicle_registration_number := coalesce(new.vehicle_registration_number, new.vehicle_number);
    new.available := coalesce(new.available, new.availability_status = 'available');
    new.verified := coalesce(new.verified, new.verification_status = 'verified');
    new.active := coalesce(new.active, new.is_active);
    return new;
  end if;

  if new.vehicle_registration_number is distinct from old.vehicle_registration_number
     and new.vehicle_number is not distinct from old.vehicle_number then
    new.vehicle_number := new.vehicle_registration_number;
  elsif new.vehicle_number is distinct from old.vehicle_number then
    new.vehicle_registration_number := new.vehicle_number;
  end if;

  if new.availability_status is distinct from old.availability_status
     and new.available is not distinct from old.available then
    new.available := new.availability_status = 'available';
  elsif new.available is distinct from old.available then
    new.availability_status := case when new.available then 'available'::public.rider_availability_status else 'offline'::public.rider_availability_status end;
  end if;

  if new.verification_status is distinct from old.verification_status
     and new.verified is not distinct from old.verified then
    new.verified := new.verification_status = 'verified';
  elsif new.verified is distinct from old.verified then
    if new.verified then
      new.verification_status := 'verified'::public.rider_verification_status;
      new.verified_at := coalesce(new.verified_at, timezone('utc', now()));
    elsif old.verification_status = 'verified' then
      new.verification_status := 'pending'::public.rider_verification_status;
      new.verified_at := null;
    end if;
  end if;

  if new.is_active is distinct from old.is_active
     and new.active is not distinct from old.active then
    new.active := new.is_active;
  elsif new.active is distinct from old.active then
    new.is_active := new.active;
  end if;

  return new;
end;
$$;

drop trigger if exists riders_sync_compatibility on public.riders;
create trigger riders_sync_compatibility
before insert or update on public.riders
for each row execute function public.sync_rider_compatibility();

create index if not exists riders_email_compat_idx on public.riders(email);
