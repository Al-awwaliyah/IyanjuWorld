-- ============================================================
-- 0017 FRONTEND / DATABASE COMPATIBILITY
--
-- The frontend in this release uses a small set of legacy field
-- names and supporting tables that were missing from the original
-- migration set. This migration keeps the canonical schema intact
-- while providing compatibility fields/tables for the shipped UI.
-- ============================================================

-- ------------------------------------------------------------
-- PROFILE COMPATIBILITY
-- Canonical: is_active, avatar_url
-- Legacy UI: active, avatar
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists active boolean not null default true,
  add column if not exists avatar text;

update public.profiles
set active = is_active,
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
before update on public.profiles
for each row execute function public.sync_profile_compatibility();

-- ------------------------------------------------------------
-- CATEGORY COMPATIBILITY
-- Canonical: is_active
-- Legacy UI: active
-- ------------------------------------------------------------
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
before update on public.categories
for each row execute function public.sync_category_compatibility();

-- ------------------------------------------------------------
-- BUSINESS COMPATIBILITY
-- Canonical: created_by, status, is_verified, address_line
-- Legacy UI: owner_id, active, verified, address, verification_status
-- ------------------------------------------------------------
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
set owner_id = created_by,
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
    new.status := case when new.active then 'active'::public.business_status else 'suspended'::public.business_status end;
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

  if new.is_verified then
    new.verification_status := 'verified';
  elsif new.verification_status is null then
    new.verification_status := 'pending';
  end if;

  if new.logo_url is distinct from old.logo_url and new.logo is not distinct from old.logo then
    new.logo := new.logo_url;
  elsif new.logo is distinct from old.logo then
    new.logo_url := new.logo;
  end if;

  if new.cover_image_url is distinct from old.cover_image_url and new.cover is not distinct from old.cover then
    new.cover := new.cover_image_url;
  elsif new.cover is distinct from old.cover then
    new.cover_image_url := new.cover;
  end if;

  if new.whatsapp_number is distinct from old.whatsapp_number and new.whatsapp is not distinct from old.whatsapp then
    new.whatsapp := new.whatsapp_number;
  elsif new.whatsapp is distinct from old.whatsapp then
    new.whatsapp_number := new.whatsapp;
  end if;

  if new.is_open is distinct from old.is_open and new.open is not distinct from old.open then
    new.open := new.is_open;
  elsif new.open is distinct from old.open then
    new.is_open := new.open;
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_sync_compatibility
on public.businesses;
create trigger businesses_sync_compatibility
before update on public.businesses
for each row execute function public.sync_business_compatibility();

-- ------------------------------------------------------------
-- PRODUCT COMPATIBILITY
-- Canonical: status, is_available, created_by, product_images
-- Legacy UI: active, image_url
-- ------------------------------------------------------------
alter table public.products
  add column if not exists active boolean not null default false,
  add column if not exists image_url text,
  add column if not exists stock integer,
  add column if not exists available boolean,
  add column if not exists featured boolean;

update public.products
set active = (status = 'active' and is_available = true),
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
  return new;
end;
$$;

drop trigger if exists products_sync_compatibility
on public.products;
create trigger products_sync_compatibility
before update on public.products
for each row execute function public.sync_product_compatibility();

-- ------------------------------------------------------------
-- CUSTOMER ADDRESSES
-- ------------------------------------------------------------
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text,
  phone text,
  address text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  landmark text,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists customer_addresses_customer_idx
on public.customer_addresses(customer_id, is_default, created_at desc);

create or replace function public.sync_customer_address_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.address_line_1 is null then new.address_line_1 := new.address; end if;
  if new.address is null then new.address := new.address_line_1; end if;
  if new.address_line_2 is null then new.address_line_2 := null; end if;
  if new.recipient_name is null then
    select p.full_name into new.recipient_name from public.profiles p where p.id = new.customer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists customer_addresses_sync_fields
on public.customer_addresses;
create trigger customer_addresses_sync_fields
before insert or update on public.customer_addresses
for each row execute function public.sync_customer_address_fields();

alter table public.customer_addresses enable row level security;
drop policy if exists "Customers can manage own addresses" on public.customer_addresses;
create policy "Customers can manage own addresses"
on public.customer_addresses for all to authenticated
using (customer_id = auth.uid() or public.is_admin())
with check (customer_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.customer_addresses to authenticated;

-- ------------------------------------------------------------
-- ORDER COMPATIBILITY
-- ------------------------------------------------------------
alter table public.orders
  alter column delivery_full_name set default '',
  alter column delivery_phone set default '',
  add column if not exists reference text,
  add column if not exists total_amount numeric(18,2),
  add column if not exists payment_method text,
  add column if not exists delivery_address_id uuid,
  add column if not exists delivery_address text,
  add column if not exists rider_id uuid;

update public.orders
set reference = order_reference,
    total_amount = customer_total,
    delivery_address = delivery_address_line
where reference is distinct from order_reference
   or total_amount is distinct from customer_total
   or delivery_address is distinct from delivery_address_line;

create index if not exists orders_reference_compat_idx on public.orders(reference);
create index if not exists orders_rider_compat_idx on public.orders(rider_id);

create or replace function public.sync_order_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.order_reference is distinct from old.order_reference
     and new.reference is not distinct from old.reference then
    new.reference := new.order_reference;
  elsif new.reference is distinct from old.reference then
    new.order_reference := new.reference;
  end if;

  if new.customer_total is distinct from old.customer_total
     and new.total_amount is not distinct from old.total_amount then
    new.total_amount := new.customer_total;
  elsif new.total_amount is distinct from old.total_amount then
    new.customer_total := new.total_amount;
  end if;

  if new.delivery_address_line is distinct from old.delivery_address_line
     and new.delivery_address is not distinct from old.delivery_address then
    new.delivery_address := new.delivery_address_line;
  elsif new.delivery_address is distinct from old.delivery_address then
    new.delivery_address_line := new.delivery_address;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_sync_compatibility on public.orders;
create trigger orders_sync_compatibility
before update on public.orders
for each row execute function public.sync_order_compatibility();

create or replace function public.fill_order_delivery_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(trim(new.delivery_full_name), '') = '' then
    select coalesce(p.full_name, '') into new.delivery_full_name
    from public.profiles p
    where p.id = new.customer_id;
  end if;

  if coalesce(trim(new.delivery_phone), '') = '' then
    select coalesce(p.phone, '') into new.delivery_phone
    from public.profiles p
    where p.id = new.customer_id;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_fill_delivery_identity on public.orders;
create trigger orders_fill_delivery_identity
before insert or update on public.orders
for each row execute function public.fill_order_delivery_identity();

-- ------------------------------------------------------------
-- MISSING CART ITEM UPDATE FUNCTION
-- ------------------------------------------------------------
create or replace function public.update_cart_item_quantity(
  p_cart_item_id uuid,
  p_quantity integer
)
returns public.cart_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.cart_items;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTHENTICATION_REQUIRED';
  end if;

  if p_quantity <= 0 then
    raise exception using errcode = 'P0001', message = 'CART_INVALID_QUANTITY';
  end if;

  select ci.* into v_item
  from public.cart_items ci
  join public.carts c on c.id = ci.cart_id
  where ci.id = p_cart_item_id
    and c.customer_id = auth.uid()
    and c.status = 'active'
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'CART_ITEM_NOT_FOUND';
  end if;

  update public.cart_items
  set quantity = p_quantity
  where id = p_cart_item_id
  returning * into v_item;

  return v_item;
end;
$$;

revoke all on function public.update_cart_item_quantity(uuid, integer) from public;
grant execute on function public.update_cart_item_quantity(uuid, integer) to authenticated;

-- ------------------------------------------------------------
-- CART VIEW COMPATIBILITY
-- Add the aliases consumed by the shipped cart UI.
-- ------------------------------------------------
drop view if exists public.cart_item_details;
create view public.cart_item_details
with (security_invoker = true)
as
select
  ci.id,
  ci.cart_id,
  ci.product_id,
  ci.quantity,
  p.business_id,
  b.name as business_name,
  b.slug as business_slug,
  p.category_id,
  c.name as category_name,
  p.name as product_name,
  p.slug as product_slug,
  p.description as product_description,
  p.sku,
  p.price,
  p.price as unit_price,
  p.compare_at_price,
  p.stock_quantity,
  p.stock_quantity as available_stock,
  p.status as product_status,
  p.is_available,
  p.image_url as product_image,
  round(p.price * ci.quantity, 2)::numeric(14,2) as line_total,
  round(p.price * ci.quantity, 2)::numeric(14,2) as subtotal,
  (p.status = 'active' and p.is_available = true and p.stock_quantity >= ci.quantity and b.status = 'active' and c.is_active = true) as is_checkout_ready,
  ci.created_at,
  ci.updated_at
from public.cart_items ci
join public.products p on p.id = ci.product_id
join public.businesses b on b.id = p.business_id
left join public.categories c on c.id = p.category_id;

grant select on public.cart_item_details to authenticated;

-- ------------------------------------------------------------
-- BUSINESS EARNINGS / PAYOUTS / RIDER EARNINGS
-- These tables were referenced by the UI but absent from the
-- migration set. They are intentionally simple ledger records;
-- population is handled by later financial workflows.
-- ------------------------------------------------------------
create table if not exists public.business_earnings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  gross_amount numeric(18,2) not null default 0,
  platform_fee numeric(18,2) not null default 0,
  net_amount numeric(18,2) not null default 0,
  status text not null default 'pending',
  available_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rider_earnings (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  amount numeric(18,2) not null default 0,
  status text not null default 'pending',
  available_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid references public.riders(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  amount numeric(18,2) not null default 0,
  status text not null default 'pending',
  reference text,
  provider text,
  provider_reference text,
  bank_code text,
  account_name text,
  account_number_last4 text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text
);

-- ------------------------------------------------------------
-- DELIVERY REQUESTS / ASSIGNMENTS
-- ------------------------------------------------------------
create table if not exists public.delivery_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  rider_id uuid references public.riders(id) on delete set null,
  status text not null default 'pending',
  pickup_address text,
  delivery_address text,
  delivery_fee numeric(18,2) not null default 0,
  rider_earning numeric(18,2) not null default 0,
  notes text,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  delivery_request_id uuid references public.delivery_requests(id) on delete set null,
  order_id uuid not null references public.orders(id) on delete cascade,
  rider_id uuid not null references public.riders(id) on delete cascade,
  status text not null default 'assigned',
  pickup_address text,
  delivery_address text,
  delivery_fee numeric(18,2) not null default 0,
  rider_earning numeric(18,2) not null default 0,
  pickup_at timestamptz,
  picked_up_at timestamptz,
  out_for_delivery_at timestamptz,
  submitted_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists delivery_requests_status_idx on public.delivery_requests(status, created_at desc);
create index if not exists delivery_requests_rider_idx on public.delivery_requests(rider_id);
create index if not exists delivery_assignments_rider_idx on public.delivery_assignments(rider_id, created_at desc);
create index if not exists delivery_assignments_order_idx on public.delivery_assignments(order_id, created_at desc);

-- ------------------------------------------------------------
-- MESSAGING
-- ------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct',
  subject text,
  title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default timezone('utc', now()),
  unique(conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz
);

create index if not exists conversation_members_user_idx on public.conversation_members(user_id, conversation_id);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Conversation members can view conversations" on public.conversations;
create policy "Conversation members can view conversations"
on public.conversations for select to authenticated
using (exists (select 1 from public.conversation_members cm where cm.conversation_id = id and cm.user_id = auth.uid()) or public.is_admin());

drop policy if exists "Users can view conversation memberships" on public.conversation_members;
create policy "Users can view conversation memberships"
on public.conversation_members for select to authenticated
using (user_id = auth.uid() or exists (select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid()) or public.is_admin());

drop policy if exists "Conversation members can view messages" on public.messages;
create policy "Conversation members can view messages"
on public.messages for select to authenticated
using (exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()) or public.is_admin());

drop policy if exists "Conversation members can send messages" on public.messages;
create policy "Conversation members can send messages"
on public.messages for insert to authenticated
with check (sender_id = auth.uid() and exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()));

drop policy if exists "Recipients can mark messages read" on public.messages;
create policy "Recipients can mark messages read"
on public.messages for update to authenticated
using (exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()) or public.is_admin())
with check (exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()) or public.is_admin());

grant select, insert, update on public.conversations to authenticated;
grant select, insert on public.conversation_members to authenticated;
grant select, insert, update on public.messages to authenticated;

-- ------------------------------------------------------------
-- Generic read/write policies for operational records. These
-- are intentionally conservative: authenticated users can see
-- records associated with their own identity; admins can manage.
-- ------------------------------------------------------------
alter table public.business_earnings enable row level security;
alter table public.rider_earnings enable row level security;
alter table public.payouts enable row level security;
alter table public.delivery_requests enable row level security;
alter table public.delivery_assignments enable row level security;

create policy "Business earnings access" on public.business_earnings for select to authenticated
using (public.is_admin() or exists (select 1 from public.businesses b where b.id = business_id and (b.owner_id = auth.uid() or b.created_by = auth.uid())));

create policy "Rider earnings access" on public.rider_earnings for select to authenticated
using (public.is_admin() or exists (select 1 from public.riders r where r.id = rider_id and r.user_id = auth.uid()));

create policy "Payouts access" on public.payouts for select to authenticated
using (public.is_admin() or exists (select 1 from public.businesses b where b.id = business_id and (b.owner_id = auth.uid() or b.created_by = auth.uid())) or exists (select 1 from public.riders r where r.id = rider_id and r.user_id = auth.uid()));

create policy "Delivery requests access" on public.delivery_requests for select to authenticated
using (public.is_admin() or rider_id is null or exists (select 1 from public.riders r where r.id = rider_id and r.user_id = auth.uid()));

create policy "Riders can accept delivery requests" on public.delivery_requests for update to authenticated
using (rider_id is null or exists (select 1 from public.riders r where r.id = rider_id and r.user_id = auth.uid()) or public.is_admin())
with check (rider_id is null or exists (select 1 from public.riders r where r.id = rider_id and r.user_id = auth.uid()) or public.is_admin());

create policy "Delivery assignments access" on public.delivery_assignments for select to authenticated
using (public.is_admin() or exists (select 1 from public.riders r where r.id = rider_id and r.user_id = auth.uid()) or exists (select 1 from public.businesses b join public.orders o on o.business_id = b.id where o.id = order_id and (b.owner_id = auth.uid() or b.created_by = auth.uid())));

create policy "Riders can update assignments" on public.delivery_assignments for update to authenticated
using (public.is_admin() or exists (select 1 from public.riders r where r.id = rider_id and r.user_id = auth.uid()))
with check (public.is_admin() or exists (select 1 from public.riders r where r.id = rider_id and r.user_id = auth.uid()));

grant select on public.business_earnings to authenticated;
grant select on public.rider_earnings to authenticated;
grant select on public.payouts to authenticated;
grant select, update on public.delivery_requests to authenticated;
grant select, update on public.delivery_assignments to authenticated;

-- Keep updated_at current on the new operational tables.
-- Keep updated_at current on the new operational tables.
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
    execute format('drop trigger if exists %I_set_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

-- Ensure the compatibility fields stay in sync for new records too.
update public.businesses set owner_id = created_by where owner_id is null;
update public.profiles set active = is_active where active is null;


-- ------------------------------------------------------------
-- ADDITIONAL LEGACY FIELD ALIASES USED BY THE UI
-- ------------------------------------------------------------

alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is distinct from u.email;

alter table public.order_items
  add column if not exists sku text,
  add column if not exists image_url text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists subtotal numeric(18,2),
  add column if not exists total_price numeric(18,2),
  add column if not exists product_image text;

update public.order_items
set sku = product_sku,
    image_url = product_image_url,
    metadata = product_metadata,
    subtotal = line_total,
    total_price = line_total,
    product_image = product_image_url
where sku is distinct from product_sku
   or image_url is distinct from product_image_url
   or metadata is distinct from product_metadata
   or subtotal is distinct from line_total
   or total_price is distinct from line_total
   or product_image is distinct from product_image_url;

create or replace function public.sync_order_item_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_sku is distinct from old.product_sku and new.sku is not distinct from old.sku then
    new.sku := new.product_sku;
  elsif new.sku is distinct from old.sku then
    new.product_sku := new.sku;
  end if;

  if new.product_image_url is distinct from old.product_image_url and new.image_url is not distinct from old.image_url then
    new.image_url := new.product_image_url;
    new.product_image := new.product_image_url;
  elsif new.image_url is distinct from old.image_url then
    new.product_image_url := new.image_url;
    new.product_image := new.image_url;
  end if;

  if new.product_metadata is distinct from old.product_metadata and new.metadata is not distinct from old.metadata then
    new.metadata := new.product_metadata;
  elsif new.metadata is distinct from old.metadata then
    new.product_metadata := new.metadata;
  end if;

  if new.line_total is distinct from old.line_total and new.total_price is not distinct from old.total_price then
    new.total_price := new.line_total;
    new.subtotal := new.line_total;
  elsif new.total_price is distinct from old.total_price then
    new.line_total := new.total_price;
    new.subtotal := new.total_price;
  end if;

  return new;
end;
$$;

drop trigger if exists order_items_sync_compatibility on public.order_items;
create trigger order_items_sync_compatibility
before update on public.order_items
for each row execute function public.sync_order_item_compatibility();

alter table public.order_status_history
  add column if not exists status public.order_status;

update public.order_status_history
set status = new_status
where status is distinct from new_status;

create or replace function public.sync_order_status_history_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.new_status is distinct from old.new_status and new.status is not distinct from old.status then
    new.status := new.new_status;
  elsif new.status is distinct from old.status then
    new.new_status := new.status;
  end if;
  return new;
end;
$$;

drop trigger if exists order_status_history_sync_compatibility on public.order_status_history;
create trigger order_status_history_sync_compatibility
before update on public.order_status_history
for each row execute function public.sync_order_status_history_compatibility();

alter table public.riders
  add column if not exists active boolean not null default true,
  add column if not exists available boolean not null default false,
  add column if not exists verified boolean not null default false,
  add column if not exists vehicle_number text,
  add column if not exists avatar_url text;

update public.riders
set active = is_active,
    available = (availability_status = 'available'),
    verified = (verification_status = 'verified'),
    vehicle_number = vehicle_registration_number,
    avatar_url = photo_url
where active is distinct from is_active
   or available is distinct from (availability_status = 'available')
   or verified is distinct from (verification_status = 'verified')
   or vehicle_number is distinct from vehicle_registration_number
   or avatar_url is distinct from photo_url;

create or replace function public.sync_rider_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active is distinct from old.is_active and new.active is not distinct from old.active then
    new.active := new.is_active;
  elsif new.active is distinct from old.active then
    new.is_active := new.active;
  end if;

  if new.availability_status is distinct from old.availability_status and new.available is not distinct from old.available then
    new.available := (new.availability_status = 'available');
  elsif new.available is distinct from old.available then
    new.availability_status := case when new.available then 'available'::public.rider_availability_status else 'offline'::public.rider_availability_status end;
  end if;

  if new.verification_status is distinct from old.verification_status and new.verified is not distinct from old.verified then
    new.verified := (new.verification_status = 'verified');
  elsif new.verified is distinct from old.verified then
    new.verification_status := case when new.verified then 'verified'::public.rider_verification_status else 'pending'::public.rider_verification_status end;
  end if;

  if new.vehicle_registration_number is distinct from old.vehicle_registration_number and new.vehicle_number is not distinct from old.vehicle_number then
    new.vehicle_number := new.vehicle_registration_number;
  elsif new.vehicle_number is distinct from old.vehicle_number then
    new.vehicle_registration_number := new.vehicle_number;
  end if;

  if new.photo_url is distinct from old.photo_url and new.avatar_url is not distinct from old.avatar_url then
    new.avatar_url := new.photo_url;
  elsif new.avatar_url is distinct from old.avatar_url then
    new.photo_url := new.avatar_url;
  end if;

  return new;
end;
$$;

drop trigger if exists riders_sync_compatibility on public.riders;
create trigger riders_sync_compatibility
before update on public.riders
for each row execute function public.sync_rider_compatibility();

alter table public.wallet_transactions
  add column if not exists type public.wallet_transaction_type;

update public.wallet_transactions
set type = transaction_type
where type is distinct from transaction_type;

create or replace function public.sync_wallet_transaction_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.transaction_type is distinct from old.transaction_type and new.type is not distinct from old.type then
    new.type := new.transaction_type;
  elsif new.type is distinct from old.type then
    new.transaction_type := new.type;
  end if;
  return new;
end;
$$;

drop trigger if exists wallet_transactions_sync_compatibility on public.wallet_transactions;
create trigger wallet_transactions_sync_compatibility
before update on public.wallet_transactions
for each row execute function public.sync_wallet_transaction_compatibility();

alter table public.business_earnings
  add column if not exists amount numeric(18,2);

update public.business_earnings
set amount = net_amount
where amount is distinct from net_amount;

create or replace function public.sync_business_earning_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.net_amount is distinct from old.net_amount and new.amount is not distinct from old.amount then
    new.amount := new.net_amount;
  elsif new.amount is distinct from old.amount then
    new.net_amount := new.amount;
  end if;
  return new;
end;
$$;

drop trigger if exists business_earnings_sync_compatibility on public.business_earnings;
create trigger business_earnings_sync_compatibility
before update on public.business_earnings
for each row execute function public.sync_business_earning_compatibility();


-- ------------------------------------------------------------
-- INSERT-SAFE COMPATIBILITY TRIGGERS
-- ------------------------------------------------------------
create or replace function public.sync_business_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.owner_id is null then new.owner_id := new.created_by; end if;
    if new.active is null then new.active := (new.status = 'active'); end if;
    if new.verified is null then new.verified := new.is_verified; end if;
    if new.address is null then new.address := new.address_line; end if;
    if new.logo is null then new.logo := new.logo_url; end if;
    if new.cover is null then new.cover := new.cover_image_url; end if;
    if new.whatsapp is null then new.whatsapp := new.whatsapp_number; end if;
    if new.open is null then new.open := new.is_open; end if;
    if new.verification_status is null then new.verification_status := case when new.is_verified then 'verified' else 'pending' end; end if;
    return new;
  end if;

  if new.created_by is distinct from old.created_by and new.owner_id is not distinct from old.owner_id then
    new.owner_id := new.created_by;
  elsif new.owner_id is distinct from old.owner_id then
    new.created_by := new.owner_id;
  end if;
  if new.status is distinct from old.status and new.active is not distinct from old.active then
    new.active := (new.status = 'active');
  elsif new.active is distinct from old.active then
    new.status := case when new.active then 'active'::public.business_status else 'suspended'::public.business_status end;
  end if;
  if new.is_verified is distinct from old.is_verified and new.verified is not distinct from old.verified then
    new.verified := new.is_verified;
  elsif new.verified is distinct from old.verified then
    new.is_verified := new.verified;
  end if;
  if new.address_line is distinct from old.address_line and new.address is not distinct from old.address then
    new.address := new.address_line;
  elsif new.address is distinct from old.address then
    new.address_line := new.address;
  end if;
  if new.logo_url is distinct from old.logo_url and new.logo is not distinct from old.logo then
    new.logo := new.logo_url;
  elsif new.logo is distinct from old.logo then
    new.logo_url := new.logo;
  end if;
  if new.cover_image_url is distinct from old.cover_image_url and new.cover is not distinct from old.cover then
    new.cover := new.cover_image_url;
  elsif new.cover is distinct from old.cover then
    new.cover_image_url := new.cover;
  end if;
  if new.whatsapp_number is distinct from old.whatsapp_number and new.whatsapp is not distinct from old.whatsapp then
    new.whatsapp := new.whatsapp_number;
  elsif new.whatsapp is distinct from old.whatsapp then
    new.whatsapp_number := new.whatsapp;
  end if;
  if new.is_open is distinct from old.is_open and new.open is not distinct from old.open then
    new.open := new.is_open;
  elsif new.open is distinct from old.open then
    new.is_open := new.open;
  end if;
  new.verification_status := case when new.is_verified then 'verified' else coalesce(new.verification_status, 'pending') end;
  return new;
end;
$$;

drop trigger if exists businesses_sync_compatibility on public.businesses;
create trigger businesses_sync_compatibility before insert or update on public.businesses for each row execute function public.sync_business_compatibility();

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
  if new.status is distinct from old.status and new.active is not distinct from old.active then
    new.active := (new.status = 'active' and new.is_available = true);
  elsif new.active is distinct from old.active then
    if new.active then
      new.status := 'active'::public.product_status; new.is_available := true;
    else
      new.status := 'suspended'::public.product_status; new.is_available := false;
    end if;
  end if;
  if new.stock_quantity is distinct from old.stock_quantity and new.stock is not distinct from old.stock then
    new.stock := new.stock_quantity;
  elsif new.stock is distinct from old.stock then
    new.stock_quantity := greatest(coalesce(new.stock, 0), 0);
  end if;
  if new.is_available is distinct from old.is_available and new.available is not distinct from old.available then
    new.available := new.is_available;
  elsif new.available is distinct from old.available then
    new.is_available := new.available;
  end if;
  if new.is_featured is distinct from old.is_featured and new.featured is not distinct from old.featured then
    new.featured := new.is_featured;
  elsif new.featured is distinct from old.featured then
    new.is_featured := new.featured;
  end if;
  return new;
end;
$$;

drop trigger if exists products_sync_compatibility on public.products;
create trigger products_sync_compatibility before insert or update on public.products for each row execute function public.sync_product_compatibility();

create or replace function public.sync_order_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.reference := coalesce(new.reference, new.order_reference);
    new.total_amount := coalesce(new.total_amount, new.customer_total);
    new.delivery_address := coalesce(new.delivery_address, new.delivery_address_line);
    return new;
  end if;
  if new.order_reference is distinct from old.order_reference and new.reference is not distinct from old.reference then
    new.reference := new.order_reference;
  elsif new.reference is distinct from old.reference then
    new.order_reference := new.reference;
  end if;
  if new.customer_total is distinct from old.customer_total and new.total_amount is not distinct from old.total_amount then
    new.total_amount := new.customer_total;
  elsif new.total_amount is distinct from old.total_amount then
    new.customer_total := new.total_amount;
  end if;
  if new.delivery_address_line is distinct from old.delivery_address_line and new.delivery_address is not distinct from old.delivery_address then
    new.delivery_address := new.delivery_address_line;
  elsif new.delivery_address is distinct from old.delivery_address then
    new.delivery_address_line := new.delivery_address;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_sync_compatibility on public.orders;
create trigger orders_sync_compatibility before insert or update on public.orders for each row execute function public.sync_order_compatibility();

create or replace function public.sync_order_item_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.sku := coalesce(new.sku, new.product_sku);
    new.image_url := coalesce(new.image_url, new.product_image_url);
    new.product_image := coalesce(new.product_image, new.product_image_url);
    new.metadata := coalesce(new.metadata, new.product_metadata);
    new.subtotal := coalesce(new.subtotal, new.line_total);
    new.total_price := coalesce(new.total_price, new.line_total);
    return new;
  end if;
  if new.product_sku is distinct from old.product_sku and new.sku is not distinct from old.sku then new.sku := new.product_sku;
  elsif new.sku is distinct from old.sku then new.product_sku := new.sku; end if;
  if new.product_image_url is distinct from old.product_image_url and new.image_url is not distinct from old.image_url then new.image_url := new.product_image_url; new.product_image := new.product_image_url;
  elsif new.image_url is distinct from old.image_url then new.product_image_url := new.image_url; new.product_image := new.image_url; end if;
  if new.product_metadata is distinct from old.product_metadata and new.metadata is not distinct from old.metadata then new.metadata := new.product_metadata;
  elsif new.metadata is distinct from old.metadata then new.product_metadata := new.metadata; end if;
  if new.line_total is distinct from old.line_total and new.total_price is not distinct from old.total_price then new.total_price := new.line_total; new.subtotal := new.line_total;
  elsif new.total_price is distinct from old.total_price then new.line_total := new.total_price; new.subtotal := new.total_price; end if;
  return new;
end;
$$;

drop trigger if exists order_items_sync_compatibility on public.order_items;
create trigger order_items_sync_compatibility before insert or update on public.order_items for each row execute function public.sync_order_item_compatibility();

create or replace function public.sync_order_status_history_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then new.status := coalesce(new.status, new.new_status); return new; end if;
  if new.new_status is distinct from old.new_status and new.status is not distinct from old.status then new.status := new.new_status;
  elsif new.status is distinct from old.status then new.new_status := new.status; end if;
  return new;
end;
$$;

drop trigger if exists order_status_history_sync_compatibility on public.order_status_history;
create trigger order_status_history_sync_compatibility before insert or update on public.order_status_history for each row execute function public.sync_order_status_history_compatibility();

create or replace function public.sync_wallet_transaction_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then new.type := coalesce(new.type, new.transaction_type); return new; end if;
  if new.transaction_type is distinct from old.transaction_type and new.type is not distinct from old.type then new.type := new.transaction_type;
  elsif new.type is distinct from old.type then new.transaction_type := new.type; end if;
  return new;
end;
$$;

drop trigger if exists wallet_transactions_sync_compatibility on public.wallet_transactions;
create trigger wallet_transactions_sync_compatibility before insert or update on public.wallet_transactions for each row execute function public.sync_wallet_transaction_compatibility();

create or replace function public.sync_business_earning_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then new.amount := coalesce(new.amount, new.net_amount); return new; end if;
  if new.net_amount is distinct from old.net_amount and new.amount is not distinct from old.amount then new.amount := new.net_amount;
  elsif new.amount is distinct from old.amount then new.net_amount := new.amount; end if;
  return new;
end;
$$;

drop trigger if exists business_earnings_sync_compatibility on public.business_earnings;
create trigger business_earnings_sync_compatibility before insert or update on public.business_earnings for each row execute function public.sync_business_earning_compatibility();

commit;
