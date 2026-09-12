-- ============================================================
-- IyanjuWorld
-- Migration 0004: Businesses and Business Membership
-- ============================================================

-- ============================================================
-- BUSINESS STATUS
-- ============================================================

do $$
begin
  create type public.business_status as enum (
    'pending',
    'active',
    'suspended',
    'rejected',
    'closed'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- BUSINESS MEMBER ROLES
-- ============================================================

do $$
begin
  create type public.business_member_role as enum (
    'owner',
    'manager',
    'staff'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- BUSINESSES
-- ============================================================

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  slug text not null,

  description text,

  logo_url text,

  cover_image_url text,

  phone text,

  whatsapp_number text,

  email text,

  address_line text,

  city text,

  state text,

  country text not null default 'Nigeria',

  latitude numeric(10,7),

  longitude numeric(10,7),

  status public.business_status not null default 'pending',

  is_verified boolean not null default false,

  is_open boolean not null default true,

  created_by uuid not null
    references public.profiles(id)
    on delete restrict,

  created_at timestamptz not null default timezone('utc', now()),

  updated_at timestamptz not null default timezone('utc', now()),

  constraint businesses_slug_unique
    unique (slug),

  constraint businesses_name_check
    check (length(trim(name)) >= 2),

  constraint businesses_slug_check
    check (
      slug = lower(slug)
      and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),

  constraint businesses_country_check
    check (country = 'Nigeria'),

  constraint businesses_latitude_check
    check (
      latitude is null
      or latitude between -90 and 90
    ),

  constraint businesses_longitude_check
    check (
      longitude is null
      or longitude between -180 and 180
    )
);

-- ============================================================
-- BUSINESS INDEXES
-- ============================================================

create index if not exists businesses_created_by_idx
  on public.businesses(created_by);

create index if not exists businesses_status_idx
  on public.businesses(status);

create index if not exists businesses_verified_idx
  on public.businesses(is_verified);

create index if not exists businesses_city_idx
  on public.businesses(city);

create index if not exists businesses_state_idx
  on public.businesses(state);

create index if not exists businesses_created_at_idx
  on public.businesses(created_at desc);

-- ============================================================
-- BUSINESS UPDATED_AT TRIGGER
-- ============================================================

drop trigger if exists businesses_set_updated_at
on public.businesses;

create trigger businesses_set_updated_at
before update on public.businesses
for each row
execute function public.set_updated_at();

-- ============================================================
-- BUSINESS MEMBERS
-- ============================================================

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  role public.business_member_role not null default 'staff',

  is_active boolean not null default true,

  joined_at timestamptz not null default timezone('utc', now()),

  updated_at timestamptz not null default timezone('utc', now()),

  constraint business_members_unique_user_business
    unique (business_id, user_id)
);

-- ============================================================
-- BUSINESS MEMBER INDEXES
-- ============================================================

create index if not exists business_members_business_id_idx
  on public.business_members(business_id);

create index if not exists business_members_user_id_idx
  on public.business_members(user_id);

create index if not exists business_members_role_idx
  on public.business_members(role);

create index if not exists business_members_active_idx
  on public.business_members(is_active);

-- ============================================================
-- BUSINESS MEMBER UPDATED_AT TRIGGER
-- ============================================================

drop trigger if exists business_members_set_updated_at
on public.business_members;

create trigger business_members_set_updated_at
before update on public.business_members
for each row
execute function public.set_updated_at();

-- ============================================================
-- BUSINESS EARNINGS ACCOUNT
-- ============================================================
--
-- This is intentionally separate from the customer's wallet.
-- Business earnings will later support:
--
--   pending earnings
--   available earnings
--   paid-out earnings
--
-- The actual financial movements will be recorded through
-- the ledger and earnings tables created in later migrations.
--
-- ============================================================

create table if not exists public.business_financial_accounts (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  pending_balance numeric(18,2) not null default 0,

  available_balance numeric(18,2) not null default 0,

  paid_out_balance numeric(18,2) not null default 0,

  currency text not null default 'NGN',

  is_active boolean not null default true,

  created_at timestamptz not null default timezone('utc', now()),

  updated_at timestamptz not null default timezone('utc', now()),

  constraint business_financial_accounts_business_unique
    unique (business_id),

  constraint business_financial_accounts_pending_check
    check (pending_balance >= 0),

  constraint business_financial_accounts_available_check
    check (available_balance >= 0),

  constraint business_financial_accounts_paid_out_check
    check (paid_out_balance >= 0),

  constraint business_financial_accounts_currency_check
    check (currency = 'NGN')
);

-- ============================================================
-- BUSINESS FINANCIAL ACCOUNT INDEX
-- ============================================================

create index if not exists business_financial_accounts_business_id_idx
  on public.business_financial_accounts(business_id);

create index if not exists business_financial_accounts_active_idx
  on public.business_financial_accounts(is_active);

-- ============================================================
-- BUSINESS FINANCIAL ACCOUNT UPDATED_AT
-- ============================================================

drop trigger if exists business_financial_accounts_set_updated_at
on public.business_financial_accounts;

create trigger business_financial_accounts_set_updated_at
before update on public.business_financial_accounts
for each row
execute function public.set_updated_at();

-- ============================================================
-- AUTOMATIC BUSINESS OWNER MEMBERSHIP
-- ============================================================

create or replace function public.create_business_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.business_members (
    business_id,
    user_id,
    role
  )
  values (
    new.id,
    new.created_by,
    'owner'
  )
  on conflict (business_id, user_id)
  do update set
    role = 'owner',
    is_active = true;

  return new;
end;
$$;

-- ============================================================
-- BUSINESS OWNER MEMBERSHIP TRIGGER
-- ============================================================

drop trigger if exists on_business_created
on public.businesses;

create trigger on_business_created
after insert on public.businesses
for each row
execute function public.create_business_owner_membership();

-- ============================================================
-- AUTOMATIC BUSINESS FINANCIAL ACCOUNT
-- ============================================================

create or replace function public.create_business_financial_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.business_financial_accounts (
    business_id
  )
  values (
    new.id
  )
  on conflict (business_id) do nothing;

  return new;
end;
$$;

-- ============================================================
-- BUSINESS FINANCIAL ACCOUNT TRIGGER
-- ============================================================

drop trigger if exists on_business_financial_account_created
on public.businesses;

create trigger on_business_financial_account_created
after insert on public.businesses
for each row
execute function public.create_business_financial_account();

-- ============================================================
-- SECURITY HELPER:
-- IS BUSINESS MEMBER
-- ============================================================

create or replace function public.is_business_member(
  p_business_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = p_business_id
      and user_id = auth.uid()
      and is_active = true
  );
$$;

-- ============================================================
-- SECURITY HELPER:
-- IS BUSINESS OWNER
-- ============================================================

create or replace function public.is_business_owner(
  p_business_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = p_business_id
      and user_id = auth.uid()
      and role = 'owner'
      and is_active = true
  );
$$;

-- ============================================================
-- SECURITY HELPER:
-- CAN MANAGE BUSINESS
-- ============================================================

create or replace function public.can_manage_business(
  p_business_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = p_business_id
      and user_id = auth.uid()
      and role in ('owner', 'manager')
      and is_active = true
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.businesses enable row level security;

alter table public.business_members enable row level security;

alter table public.business_financial_accounts enable row level security;

-- ============================================================
-- PUBLIC BUSINESS DISCOVERY
-- ============================================================
--
-- Customers and visitors need to discover active businesses.
-- Public marketplace queries will later filter products first,
-- but business information must remain publicly readable when
-- the business is active.
--
-- ============================================================

drop policy if exists "Public can view active businesses"
on public.businesses;

create policy "Public can view active businesses"
on public.businesses
for select
to anon, authenticated
using (
  status = 'active'
);

-- ============================================================
-- BUSINESS MEMBERS CAN VIEW THEIR BUSINESS
-- ============================================================

drop policy if exists "Members can view their businesses"
on public.businesses;

create policy "Members can view their businesses"
on public.businesses
for select
to authenticated
using (
  public.is_business_member(id)
);

-- ============================================================
-- BUSINESS OWNERS CAN CREATE BUSINESSES
-- ============================================================
--
-- The authenticated user must create the business as themselves.
--
-- ============================================================

drop policy if exists "Users can create businesses"
on public.businesses;

create policy "Users can create businesses"
on public.businesses
for insert
to authenticated
with check (
  created_by = auth.uid()
);

-- ============================================================
-- BUSINESS MANAGERS CAN UPDATE BUSINESS
-- ============================================================

drop policy if exists "Business managers can update businesses"
on public.businesses;

create policy "Business managers can update businesses"
on public.businesses
for update
to authenticated
using (
  public.can_manage_business(id)
)
with check (
  public.can_manage_business(id)
);

-- ============================================================
-- ADMINS CAN VIEW ALL BUSINESSES
-- ============================================================

drop policy if exists "Admins can view all businesses"
on public.businesses;

create policy "Admins can view all businesses"
on public.businesses
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- ADMINS CAN UPDATE BUSINESSES
-- ============================================================

drop policy if exists "Admins can update businesses"
on public.businesses;

create policy "Admins can update businesses"
on public.businesses
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- ============================================================
-- BUSINESS MEMBERS:
-- MEMBERS CAN VIEW THEIR MEMBERSHIP
-- ============================================================

drop policy if exists "Members can view business memberships"
on public.business_members;

create policy "Members can view business memberships"
on public.business_members
for select
to authenticated
using (
  public.is_business_member(business_id)
);

-- ============================================================
-- BUSINESS OWNER CAN ADD MEMBERS
-- ============================================================

drop policy if exists "Owners can add business members"
on public.business_members;

create policy "Owners can add business members"
on public.business_members
for insert
to authenticated
with check (
  public.is_business_owner(business_id)
);

-- ============================================================
-- BUSINESS OWNER CAN UPDATE MEMBERS
-- ============================================================

drop policy if exists "Owners can update business members"
on public.business_members;

create policy "Owners can update business members"
on public.business_members
for update
to authenticated
using (
  public.is_business_owner(business_id)
)
with check (
  public.is_business_owner(business_id)
);

-- ============================================================
-- BUSINESS OWNER CAN REMOVE MEMBERS
-- ============================================================

drop policy if exists "Owners can remove business members"
on public.business_members;

create policy "Owners can remove business members"
on public.business_members
for delete
to authenticated
using (
  public.is_business_owner(business_id)
);

-- ============================================================
-- ADMINS CAN MANAGE BUSINESS MEMBERS
-- ============================================================

drop policy if exists "Admins can view all business members"
on public.business_members;

create policy "Admins can view all business members"
on public.business_members
for select
to authenticated
using (
  public.is_admin()
);

drop policy if exists "Admins can manage business members"
on public.business_members;

create policy "Admins can manage business members"
on public.business_members
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- ============================================================
-- BUSINESS FINANCIAL ACCOUNTS
-- ============================================================
--
-- Financial balances are not directly writable by business
-- owners, managers, customers, or the frontend.
--
-- Secure financial functions will control these balances.
--
-- ============================================================

drop policy if exists "Business members can view financial account"
on public.business_financial_accounts;

create policy "Business members can view financial account"
on public.business_financial_accounts
for select
to authenticated
using (
  public.is_business_member(business_id)
);

drop policy if exists "Admins can view business financial accounts"
on public.business_financial_accounts;

create policy "Admins can view business financial accounts"
on public.business_financial_accounts
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- GRANTS
-- ============================================================

grant select, insert, update
on public.businesses
to authenticated;

grant select, insert, update, delete
on public.business_members
to authenticated;

grant select
on public.business_financial_accounts
to authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.businesses is
  'IyanjuWorld marketplace businesses/vendors.';

comment on column public.businesses.created_by is
  'User who originally registered the business.';

comment on column public.businesses.status is
  'Business lifecycle and administrative approval status.';

comment on column public.businesses.is_verified is
  'Whether the business has passed platform verification.';

comment on table public.business_members is
  'Users authorized to operate a business account.';

comment on column public.business_members.role is
  'Business-level permission: owner, manager, or staff.';

comment on table public.business_financial_accounts is
  'Financial summary account for business pending, available, and paid-out earnings.';
