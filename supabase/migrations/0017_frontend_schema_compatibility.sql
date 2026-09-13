-- IyanjuWorld
-- Migration 0017: Frontend / Database Compatibility
-- Corrected replacement
--
-- IMPORTANT:
-- This migration is intentionally idempotent.
-- Existing policies are dropped before being recreated.
-- The invalid PostgreSQL FOREACH ARRAY syntax has been corrected.
-- No explicit COMMIT is included.

-- ============================================================
-- PROFILE COMPATIBILITY
-- ============================================================

alter table public.profiles
  add column if not exists active boolean not null default true,
  add column if not exists avatar text;

update public.profiles
set
  active = is_active,
  avatar = avatar_url
where active is distinct from is_active
   or avatar is distinct from avatar_url;

create or replace function public.sync_profile_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.active := new.is_active;
    new.avatar := new.avatar_url;
    return new;
  end if;

  if new.is_active is distinct from old.is_active
     and new.active is not distinct from old.active then
    new.active := new.is_active;
  elsif new.active is distinct from old.active then
    new.is_active := new.active;
  end if;

  if new.avatar_url is distinct from old.avatar_url
     and new.avatar is not distinct from old.avatar then
    new.avatar := new.avatar_url;
  elsif new.avatar is distinct from old.avatar then
    new.avatar_url := new.avatar;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_sync_compatibility
on public.profiles;

create trigger profiles_sync_compatibility
before insert or update on public.profiles
for each row
execute function public.sync_profile_compatibility();


-- ============================================================
-- CATEGORY COMPATIBILITY
-- ============================================================

alter table public.categories
  add column if not exists active boolean not null default true;

update public.categories
set active = is_active
where active is distinct from is_active;

create or replace function public.sync_category_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.active := new.is_active;
    return new;
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

drop trigger if exists categories_sync_compatibility
on public.categories;

create trigger categories_sync_compatibility
before insert or update on public.categories
for each row
execute function public.sync_category_compatibility();


-- ============================================================
-- BUSINESS COMPATIBILITY
-- ============================================================

alter table public.businesses
  add column if not exists owner_id uuid,
  add column if not exists active boolean not null default true,
  add column if not exists verified boolean not null default false,
  add column if not exists address text,
  add column if not exists logo text,
  add column if not exists cover text,
  add column if not exists whatsapp text,
  add column if not exists open boolean not null default true,
  add column if not exists verification_status text;

update public.businesses
set
  owner_id = created_by,
  active = (status = 'active'),
  verified = is_verified,
  address = address_line,
  logo = logo_url,
  cover = cover_image_url,
  whatsapp = whatsapp_number,
  open = is_open,
  verification_status = case
    when is_verified then 'verified'
    else 'pending'
  end
where owner_id is distinct from created_by
   or active is distinct from (status = 'active')
   or verified is distinct from is_verified
   or address is distinct from address_line
   or verification_status is null;

create index if not exists businesses_owner_id_compat_idx
on public.businesses(owner_id);

create or replace function public.sync_business_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.owner_id := coalesce(new.owner_id, new.created_by);
    new.created_by := coalesce(new.created_by, new.owner_id);

    new.active := new.status = 'active';
    new.verified := new.is_verified;
    new.address := coalesce(new.address, new.address_line);
    new.address_line := coalesce(new.address_line, new.address);
    new.logo := coalesce(new.logo, new.logo_url);
    new.logo_url := coalesce(new.logo_url, new.logo);
    new.cover := coalesce(new.cover, new.cover_image_url);
    new.cover_image_url := coalesce(new.cover_image_url, new.cover);
    new.whatsapp := coalesce(new.whatsapp, new.whatsapp_number);
    new.whatsapp_number := coalesce(new.whatsapp_number, new.whatsapp);
    new.open := new.is_open;
    new.verification_status :=
      case
        when new.is_verified then 'verified'
        else coalesce(new.verification_status, 'pending')
      end;

    return new;
  end if;

  if new.created_by is distinct from old.created_by
     and new.owner_id is not distinct from old.owner_id then
    new.owner_id := new.created_by;
  elsif new.owner_id is distinct from old.owner_id then
    new.created_by := new.owner_id;
  end if;

  if new.status is distinct from old.status
     and new.active is not distinct from old.active then
    new.active := (new.status = 'active');
  elsif new.active is distinct from old.active then
    new.status :=
      case
        when new.active then 'active'::public.business_status
        else 'suspended'::public.business_status
      end;
  end if;

  if new.is_verified is distinct from old.is_verified
     and new.verified is not distinct from old.verified then
    new.verified := new.is_verified;
  elsif new.verified is distinct from old.verified then
    new.is_verified := new.verified;
  end if;

  if new.address_line is distinct from old.address_line
     and new.address is not distinct from old.address then
    new.address := new.address_line;
  elsif new.address is distinct from old.address then
    new.address_line := new.address;
  end if;

  if new.logo_url is distinct from old.logo_url
     and new.logo is not distinct from old.logo then
    new.logo := new.logo_url;
  elsif new.logo is distinct from old.logo then
    new.logo_url := new.logo;
  end if;

  if new.cover_image_url is distinct from old.cover_image_url
     and new.cover is not distinct from old.cover then
    new.cover := new.cover_image_url;
  elsif new.cover is distinct from old.cover then
    new.cover_image_url := new.cover;
  end if;

  if new.whatsapp_number is distinct from old.whatsapp_number
     and new.whatsapp is not distinct from old.whatsapp then
    new.whatsapp := new.whatsapp_number;
  elsif new.whatsapp is distinct from old.whatsapp then
    new.whatsapp_number := new.whatsapp;
  end if;

  if new.is_open is distinct from old.is_open
     and new.open is not distinct from old.open then
    new.open := new.is_open;
  elsif new.open is distinct from old.open then
    new.is_open := new.open;
  end if;

  new.verification_status :=
    case
      when new.is_verified then 'verified'
      else coalesce(new.verification_status, 'pending')
    end;

  return new;
end;
$$;

drop trigger if exists businesses_sync_compatibility
on public.businesses;

create trigger businesses_sync_compatibility
before insert or update on public.businesses
for each row
execute function public.sync_business_compatibility();


-- ============================================================
-- PRODUCT COMPATIBILITY
-- ============================================================

alter table public.products
  add column if not exists active boolean not null default false,
  add column if not exists image_url text,
  add column if not exists stock integer,
  add column if not exists available boolean,
  add column if not exists featured boolean;

update public.products
set
  active = (status = 'active' and is_available = true),
  stock = stock_quantity,
  available = is_available,
  featured = is_featured
where active is distinct from (status = 'active' and is_available = true)
   or stock is distinct from stock_quantity
   or available is distinct from is_available
   or featured is distinct from is_featured;

create or replace function public.sync_product_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.active := (new.status = 'active' and new.is_available = true);
    new.stock := new.stock_quantity;
    new.available := new.is_available;
    new.featured := new.is_featured;
    return new;
  end if;

  if new.status is distinct from old.status
     and new.active is not distinct from old.active then
    new.active := (new.status = 'active' and new.is_available = true);
  elsif new.active is distinct from old.active then
    if new.active then
      new.status := 'active'::public.product_status;
      new.is_available := true;
    else
      new.status := 'suspended'::public.product_status;
      new.is_available := false;
    end if;
  end if;

  if new.stock_quantity is distinct from old.stock_quantity
     and new.stock is not distinct from old.stock then
    new.stock := new.stock_quantity;
  elsif new.stock is distinct from old.stock then
    new.stock_quantity := greatest(coalesce(new.stock, 0), 0);
  end if;

  if new.is_available is distinct from old.is_available
     and new.available is not distinct from old.available then
    new.available := new.is_available;
  elsif new.available is distinct from old.available then
    new.is_available := new.available;
  end if;

  if new.is_featured is distinct from old.is_featured
     and new.featured is not distinct from old.featured then
    new.featured := new.is_featured;
  elsif new.featured is distinct from old.featured then
    new.is_featured := new.featured;
  end if;

  return new;
end;
$$;

drop trigger if exists products_sync_compatibility
on public.products;

create trigger products_sync_compatibility
before insert or update on public.products
for each row
execute function public.sync_product_compatibility();


-- ============================================================
-- CUSTOMER ADDRESSES
-- ============================================================

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  label text,
  recipient_name text,
  phone text,
  address text not null,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  landmark text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_addresses
  add column if not exists label text,
  add column if not exists recipient_name text,
  add column if not exists phone text,
  add column if not exists address_line_1 text,
  add column if not exists address_line_2 text,
  add column if not exists postal_code text,
  add column if not exists landmark text;

create or replace function public.sync_customer_address_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.address_line_1 is null then
    new.address_line_1 := new.address;
  end if;

  if new.address is null then
    new.address := new.address_line_1;
  end if;

  if new.recipient_name is null then
    select p.full_name
    into new.recipient_name
    from public.profiles p
    where p.id = new.customer_id;
  end if;

  return new;
end;
$$;

drop trigger if exists customer_addresses_sync_fields
on public.customer_addresses;

create trigger customer_addresses_sync_fields
before insert or update on public.customer_addresses
for each row
execute function public.sync_customer_address_fields();

alter table public.customer_addresses enable row level security;

drop policy if exists "Customers can manage own addresses"
on public.customer_addresses;

create policy "Customers can manage own addresses"
on public.customer_addresses
for all
to authenticated
using (auth.uid() = customer_id)
with check (auth.uid() = customer_id);

drop policy if exists customer_addresses_select_own
on public.customer_addresses;

create policy customer_addresses_select_own
on public.customer_addresses
for select
to authenticated
using (auth.uid() = customer_id);

drop policy if exists customer_addresses_insert_own
on public.customer_addresses;

create policy customer_addresses_insert_own
on public.customer_addresses
for insert
to authenticated
with check (auth.uid() = customer_id);

drop policy if exists customer_addresses_update_own
on public.customer_addresses;

create policy customer_addresses_update_own
on public.customer_addresses
for update
to authenticated
using (auth.uid() = customer_id)
with check (auth.uid() = customer_id);

drop policy if exists customer_addresses_delete_own
on public.customer_addresses;

create policy customer_addresses_delete_own
on public.customer_addresses
for delete
to authenticated
using (auth.uid() = customer_id);


-- ============================================================
-- BUSINESS EARNINGS
-- ============================================================

alter table public.business_earnings
  add column if not exists amount numeric(14,2);

drop policy if exists "Business earnings access"
on public.business_earnings;

create policy "Business earnings access"
on public.business_earnings
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and (
        b.owner_id = auth.uid()
        or b.created_by = auth.uid()
      )
  )
);


-- ============================================================
-- RIDER EARNINGS
-- ============================================================

drop policy if exists "Rider earnings access"
on public.rider_earnings;

create policy "Rider earnings access"
on public.rider_earnings
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.riders r
    where r.id = rider_id
      and r.user_id = auth.uid()
  )
);


-- ============================================================
-- PAYOUTS
-- ============================================================

drop policy if exists "Payouts access"
on public.payouts;

create policy "Payouts access"
on public.payouts
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and (
        b.owner_id = auth.uid()
        or b.created_by = auth.uid()
      )
  )
  or exists (
    select 1
    from public.riders r
    where r.id = rider_id
      and r.user_id = auth.uid()
  )
);


-- ============================================================
-- DELIVERY REQUESTS
-- ============================================================

drop policy if exists "Delivery requests access"
on public.delivery_requests;

create policy "Delivery requests access"
on public.delivery_requests
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    join public.businesses b
      on b.id = o.business_id
    where o.id = order_id
      and (
        o.customer_id = auth.uid()
        or b.owner_id = auth.uid()
        or b.created_by = auth.uid()
      )
  )
);

drop policy if exists "Riders can accept delivery requests"
on public.delivery_requests;

create policy "Riders can accept delivery requests"
on public.delivery_requests
for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.riders r
    where r.user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.riders r
    where r.user_id = auth.uid()
  )
);


-- ============================================================
-- DELIVERY ASSIGNMENTS
-- ============================================================

drop policy if exists "Delivery assignments access"
on public.delivery_assignments;

create policy "Delivery assignments access"
on public.delivery_assignments
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.riders r
    where r.id = rider_id
      and r.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.orders o
    join public.businesses b
      on b.id = o.business_id
    where o.id = order_id
      and (
        o.customer_id = auth.uid()
        or b.owner_id = auth.uid()
        or b.created_by = auth.uid()
      )
  )
);

drop policy if exists "Riders can update assignments"
on public.delivery_assignments;

create policy "Riders can update assignments"
on public.delivery_assignments
for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.riders r
    where r.id = rider_id
      and r.user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.riders r
    where r.id = rider_id
      and r.user_id = auth.uid()
  )
);


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'business_earnings',
    'rider_earnings',
    'payouts',
    'delivery_requests',
    'delivery_assignments',
    'conversations'
  ] loop
    execute format(
      'drop trigger if exists %I_set_updated_at on public.%I',
      table_name,
      table_name
    );

    execute format(
      'create trigger %I_set_updated_at
       before update on public.%I
       for each row
       execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;


-- ============================================================
-- COMPATIBILITY INDEXES
-- ============================================================

create index if not exists customer_addresses_customer_id_idx
on public.customer_addresses(customer_id);

create index if not exists customer_addresses_default_idx
on public.customer_addresses(customer_id, is_default);

create index if not exists business_earnings_business_id_idx
on public.business_earnings(business_id);

create index if not exists rider_earnings_rider_id_idx
on public.rider_earnings(rider_id);

create index if not exists payouts_business_id_idx
on public.payouts(business_id);

create index if not exists payouts_rider_id_idx
on public.payouts(rider_id);

create index if not exists delivery_requests_order_id_idx
on public.delivery_requests(order_id);

create index if not exists delivery_assignments_order_id_idx
on public.delivery_assignments(order_id);

create index if not exists delivery_assignments_rider_id_idx
on public.delivery_assignments(rider_id);
