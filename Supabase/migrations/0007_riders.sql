-- ============================================================
-- IyanjuWorld
-- Migration 0007: Riders
-- ============================================================

-- ============================================================
-- RIDER VERIFICATION STATUS
-- ============================================================

do $$
begin
  create type public.rider_verification_status as enum (
    'pending',
    'under_review',
    'verified',
    'rejected',
    'suspended'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- RIDER VEHICLE TYPES
-- ============================================================

do $$
begin
  create type public.rider_vehicle_type as enum (
    'bicycle',
    'motorcycle',
    'car',
    'van',
    'other'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- RIDER AVAILABILITY STATUS
-- ============================================================

do $$
begin
  create type public.rider_availability_status as enum (
    'offline',
    'available',
    'busy'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- RIDERS
-- ============================================================

create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  full_name text not null,

  phone text not null,

  photo_url text,

  vehicle_type public.rider_vehicle_type not null,

  vehicle_description text,

  vehicle_registration_number text,

  operating_city text,

  operating_state text,

  operating_area text,

  verification_status public.rider_verification_status
    not null default 'pending',

  availability_status public.rider_availability_status
    not null default 'offline',

  is_active boolean not null default true,

  is_online boolean not null default false,

  last_latitude numeric(10,7),

  last_longitude numeric(10,7),

  last_location_at timestamptz,

  verified_at timestamptz,

  verified_by uuid
    references public.profiles(id)
    on delete set null,

  rejection_reason text,

  suspension_reason text,

  created_at timestamptz not null default timezone('utc', now()),

  updated_at timestamptz not null default timezone('utc', now()),

  constraint riders_user_unique
    unique (user_id),

  constraint riders_full_name_check
    check (length(trim(full_name)) >= 2),

  constraint riders_phone_check
    check (length(trim(phone)) >= 7),

  constraint riders_latitude_check
    check (
      last_latitude is null
      or last_latitude between -90 and 90
    ),

  constraint riders_longitude_check
    check (
      last_longitude is null
      or last_longitude between -180 and 180
    ),

  constraint riders_location_timestamp_check
    check (
      (last_latitude is null and last_longitude is null)
      or
      last_location_at is not null
    ),

  constraint riders_verified_data_check
    check (
      verification_status <> 'verified'
      or verified_at is not null
    )
);

-- ============================================================
-- RIDER INDEXES
-- ============================================================

create index if not exists riders_user_id_idx
  on public.riders(user_id);

create index if not exists riders_verification_status_idx
  on public.riders(verification_status);

create index if not exists riders_availability_status_idx
  on public.riders(availability_status);

create index if not exists riders_active_idx
  on public.riders(is_active);

create index if not exists riders_online_idx
  on public.riders(is_online);

create index if not exists riders_operating_city_idx
  on public.riders(operating_city);

create index if not exists riders_operating_state_idx
  on public.riders(operating_state);

create index if not exists riders_location_idx
  on public.riders(last_latitude, last_longitude);

create index if not exists riders_created_at_idx
  on public.riders(created_at desc);

-- ============================================================
-- RIDER UPDATED_AT
-- ============================================================

drop trigger if exists riders_set_updated_at
on public.riders;

create trigger riders_set_updated_at
before update on public.riders
for each row
execute function public.set_updated_at();

-- ============================================================
-- RIDER FINANCIAL ACCOUNTS
-- ============================================================
--
-- This is a summary layer for rider earnings.
-- Detailed financial movements will later be recorded through
-- rider_earnings, payouts and the double-entry ledger.
--
-- ============================================================

create table if not exists public.rider_financial_accounts (
  id uuid primary key default gen_random_uuid(),

  rider_id uuid not null
    references public.riders(id)
    on delete cascade,

  pending_balance numeric(18,2) not null default 0,

  available_balance numeric(18,2) not null default 0,

  paid_out_balance numeric(18,2) not null default 0,

  currency text not null default 'NGN',

  is_active boolean not null default true,

  created_at timestamptz not null default timezone('utc', now()),

  updated_at timestamptz not null default timezone('utc', now()),

  constraint rider_financial_accounts_rider_unique
    unique (rider_id),

  constraint rider_financial_accounts_pending_check
    check (pending_balance >= 0),

  constraint rider_financial_accounts_available_check
    check (available_balance >= 0),

  constraint rider_financial_accounts_paid_out_check
    check (paid_out_balance >= 0),

  constraint rider_financial_accounts_currency_check
    check (currency = 'NGN')
);

-- ============================================================
-- RIDER FINANCIAL ACCOUNT INDEX
-- ============================================================

create index if not exists rider_financial_accounts_rider_id_idx
  on public.rider_financial_accounts(rider_id);

create index if not exists rider_financial_accounts_active_idx
  on public.rider_financial_accounts(is_active);

-- ============================================================
-- RIDER FINANCIAL ACCOUNT UPDATED_AT
-- ============================================================

drop trigger if exists rider_financial_accounts_set_updated_at
on public.rider_financial_accounts;

create trigger rider_financial_accounts_set_updated_at
before update on public.rider_financial_accounts
for each row
execute function public.set_updated_at();

-- ============================================================
-- RIDER FINANCIAL ACCOUNT CREATION
-- ============================================================

create or replace function public.create_rider_financial_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.rider_financial_accounts (
    rider_id
  )
  values (
    new.id
  )
  on conflict (rider_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_rider_financial_account_created
on public.riders;

create trigger on_rider_financial_account_created
after insert on public.riders
for each row
execute function public.create_rider_financial_account();

-- ============================================================
-- RIDER ROLE VALIDATION
-- ============================================================
--
-- A rider record may only belong to a profile whose primary
-- platform role is "rider".
--
-- Role assignment itself will be controlled by the application
-- and secure administrative workflows.
--
-- ============================================================

create or replace function public.validate_rider_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_role public.user_role;
begin
  select role
  into profile_role
  from public.profiles
  where id = new.user_id;

  if profile_role is null then
    raise exception using
      errcode = 'P0001',
      message = 'RIDER_PROFILE_NOT_FOUND';
  end if;

  if profile_role <> 'rider' then
    raise exception using
      errcode = 'P0001',
      message = 'PROFILE_ROLE_NOT_RIDER';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_rider_profile_role_before_insert
on public.riders;

create trigger validate_rider_profile_role_before_insert
before insert on public.riders
for each row
execute function public.validate_rider_profile_role();

-- ============================================================
-- RIDER SECURITY HELPERS
-- ============================================================

create or replace function public.is_rider_owner(
  p_rider_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.riders
    where id = p_rider_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_verified_rider(
  p_rider_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.riders
    where id = p_rider_id
      and user_id = auth.uid()
      and verification_status = 'verified'
      and is_active = true
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.riders enable row level security;

alter table public.rider_financial_accounts enable row level security;

-- ============================================================
-- RIDER OWN PROFILE READ
-- ============================================================

drop policy if exists "Riders can view own rider profile"
on public.riders;

create policy "Riders can view own rider profile"
on public.riders
for select
to authenticated
using (
  user_id = auth.uid()
);

-- ============================================================
-- RIDER OWN PROFILE INSERT
-- ============================================================

drop policy if exists "Riders can create own rider profile"
on public.riders;

create policy "Riders can create own rider profile"
on public.riders
for insert
to authenticated
with check (
  user_id = auth.uid()
);

-- ============================================================
-- RIDER OWN PROFILE UPDATE
-- ============================================================
--
-- Riders can update operational/profile information.
-- Administrative verification fields are protected by a
-- separate admin policy and should not be client-controlled.
--
-- ============================================================

drop policy if exists "Riders can update own rider profile"
on public.riders;

create policy "Riders can update own rider profile"
on public.riders
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

-- ============================================================
-- ADMIN RIDER READ
-- ============================================================

drop policy if exists "Admins can view all riders"
on public.riders;

create policy "Admins can view all riders"
on public.riders
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- ADMIN RIDER UPDATE
-- ============================================================

drop policy if exists "Admins can update riders"
on public.riders;

create policy "Admins can update riders"
on public.riders
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- ============================================================
-- RIDER FINANCIAL ACCOUNT READ
-- ============================================================

drop policy if exists "Riders can view own financial account"
on public.rider_financial_accounts;

create policy "Riders can view own financial account"
on public.rider_financial_accounts
for select
to authenticated
using (
  public.is_rider_owner(rider_id)
);

drop policy if exists "Admins can view rider financial accounts"
on public.rider_financial_accounts;

create policy "Admins can view rider financial accounts"
on public.rider_financial_accounts
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- NO DIRECT RIDER FINANCIAL WRITES
-- ============================================================
--
-- Rider balances will only be changed by trusted financial
-- operations created later.
--
-- ============================================================

-- No INSERT, UPDATE or DELETE policies are granted to riders.

-- ============================================================
-- GRANTS
-- ============================================================

grant select, insert, update
on public.riders
to authenticated;

grant select
on public.rider_financial_accounts
to authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.riders is
  'IyanjuWorld delivery rider profiles, verification and operational status.';

comment on column public.riders.verification_status is
  'Administrative verification state of the rider.';

comment on column public.riders.availability_status is
  'Operational state used when determining rider eligibility for deliveries.';

comment on column public.riders.last_latitude is
  'Most recent rider location used for delivery matching and operations.';

comment on column public.riders.last_longitude is
  'Most recent rider location used for delivery matching and operations.';

comment on table public.rider_financial_accounts is
  'Summary financial account for rider pending, available and paid-out earnings.';
