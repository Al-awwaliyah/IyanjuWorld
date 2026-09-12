-- ============================================================
-- IyanjuWorld
-- Migration 0001: Profiles and Roles
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

do $$
begin
  create type public.user_role as enum (
    'customer',
    'business_owner',
    'rider',
    'admin'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.admin_role as enum (
    'super_admin',
    'operations',
    'support',
    'finance',
    'compliance',
    'read_only'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- PROFILES
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text,
  phone text,

  role public.user_role not null default 'customer',

  admin_role public.admin_role,

  avatar_url text,

  is_active boolean not null default true,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint profiles_admin_role_check
    check (
      (role = 'admin' and admin_role is not null)
      or
      (role <> 'admin' and admin_role is null)
    )
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists profiles_role_idx
  on public.profiles(role);

create index if not exists profiles_admin_role_idx
  on public.profiles(admin_role);

create index if not exists profiles_phone_idx
  on public.profiles(phone);

create index if not exists profiles_is_active_idx
  on public.profiles(is_active);

-- ============================================================
-- UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- ============================================================
-- CREATE PROFILE AFTER AUTH SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    role
  )
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      null
    ),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
      null
    ),
    'customer'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ============================================================
-- AUTH USER TRIGGER
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- ROLE HELPERS
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and admin_role = 'super_admin'
      and is_active = true
  );
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;

-- Users can view their own profile.
drop policy if exists "Users can view own profile" on public.profiles;

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
);

-- Users can update their own basic profile.
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);

-- Admins can view all profiles.
drop policy if exists "Admins can view all profiles" on public.profiles;

create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (
  public.is_admin()
);

-- Super admins can update profiles.
drop policy if exists "Super admins can update profiles" on public.profiles;

create policy "Super admins can update profiles"
on public.profiles
for update
to authenticated
using (
  public.is_super_admin()
)
with check (
  public.is_super_admin()
);

-- ============================================================
-- GRANTS
-- ============================================================

grant usage on schema public to authenticated;

grant select, update
on public.profiles
to authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.profiles is
  'Core IyanjuWorld user profile linked to Supabase Auth.';

comment on column public.profiles.role is
  'Primary platform role: customer, business_owner, rider, or admin.';

comment on column public.profiles.admin_role is
  'Administrative permission level when role is admin.';
