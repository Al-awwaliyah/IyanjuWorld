-- ============================================================
-- IyanjuWorld
-- Migration: 0011_delivery_pricing.sql
--
-- Purpose:
--   Platform-controlled delivery pricing.
--
-- Financial rules:
--   - Customer pays delivery fee.
--   - Business does not pay delivery fee.
--   - Platform fee is calculated only from product subtotal.
--   - Delivery fee is NOT included in platform fee calculation.
--   - Customer cannot directly modify delivery_fee.
--
-- Pricing supports:
--   - delivery zones
--   - base fee
--   - per-kilometre fee
--   - maximum delivery fee
--   - minimum delivery fee
--   - optional free-delivery threshold
--
-- Distance:
--   Haversine calculation using business coordinates and the
--   customer's delivery coordinates.
--
-- The resulting delivery fee is stored on the order as a
-- historical financial snapshot.
-- ============================================================

begin;


-- ============================================================
-- 1. DELIVERY ZONES
-- ============================================================

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  state text,
  city text,

  base_fee numeric(14,2) not null default 0,
  per_km_fee numeric(14,2) not null default 0,

  minimum_fee numeric(14,2) not null default 0,
  maximum_fee numeric(14,2),

  free_delivery_threshold numeric(14,2),

  max_distance_km numeric(10,2),

  currency text not null default 'NGN',

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint delivery_zones_name_check
    check (length(trim(name)) >= 2),

  constraint delivery_zones_state_check
    check (
      state is null
      or length(trim(state)) >= 2
    ),

  constraint delivery_zones_city_check
    check (
      city is null
      or length(trim(city)) >= 2
    ),

  constraint delivery_zones_base_fee_check
    check (base_fee >= 0),

  constraint delivery_zones_per_km_fee_check
    check (per_km_fee >= 0),

  constraint delivery_zones_minimum_fee_check
    check (minimum_fee >= 0),

  constraint delivery_zones_maximum_fee_check
    check (
      maximum_fee is null
      or maximum_fee >= minimum_fee
    ),

  constraint delivery_zones_free_threshold_check
    check (
      free_delivery_threshold is null
      or free_delivery_threshold >= 0
    ),

  constraint delivery_zones_max_distance_check
    check (
      max_distance_km is null
      or max_distance_km > 0
    ),

  constraint delivery_zones_currency_check
    check (currency = 'NGN')
);


-- ============================================================
-- 2. DELIVERY ZONE INDEXES
-- ============================================================

create index if not exists delivery_zones_active_idx
  on public.delivery_zones(is_active);

create index if not exists delivery_zones_state_city_idx
  on public.delivery_zones(state, city);

create index if not exists delivery_zones_city_idx
  on public.delivery_zones(city);


-- ============================================================
-- 3. UPDATED_AT
-- ============================================================

drop trigger if exists set_delivery_zones_updated_at
  on public.delivery_zones;

create trigger set_delivery_zones_updated_at
before update on public.delivery_zones
for each row
execute function public.set_updated_at();


-- ============================================================
-- 4. DELIVERY ORDER SNAPSHOT
--
-- These fields preserve exactly how the delivery fee was
-- calculated for an order.
--
-- This is important because administrators may later change
-- pricing rules, but historical orders must not change.
-- ============================================================

alter table public.orders
  add column if not exists delivery_zone_id uuid
    references public.delivery_zones(id)
    on delete set null;

alter table public.orders
  add column if not exists delivery_distance_km numeric(10,2);

alter table public.orders
  add column if not exists delivery_base_fee numeric(14,2);

alter table public.orders
  add column if not exists delivery_distance_fee numeric(14,2);

alter table public.orders
  add column if not exists delivery_pricing_snapshot jsonb;


-- ============================================================
-- 5. DELIVERY ORDER SNAPSHOT CONSTRAINTS
-- ============================================================

do $$
begin

  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_delivery_distance_check'
      and conrelid = 'public.orders'::regclass
  ) then

    alter table public.orders
      add constraint orders_delivery_distance_check
      check (
        delivery_distance_km is null
        or delivery_distance_km >= 0
      );

  end if;


  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_delivery_base_fee_check'
      and conrelid = 'public.orders'::regclass
  ) then

    alter table public.orders
      add constraint orders_delivery_base_fee_check
      check (
        delivery_base_fee is null
        or delivery_base_fee >= 0
      );

  end if;


  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_delivery_distance_fee_check'
      and conrelid = 'public.orders'::regclass
  ) then

    alter table public.orders
      add constraint orders_delivery_distance_fee_check
      check (
        delivery_distance_fee is null
        or delivery_distance_fee >= 0
      );

  end if;

end
$$;


-- ============================================================
-- 6. HAVERSINE DISTANCE
--
-- Returns approximate straight-line distance between two
-- latitude/longitude coordinates.
--
-- This is suitable for the first delivery-pricing layer.
-- Actual road distance can be introduced later without
-- changing the order financial architecture.
-- ============================================================

create or replace function public.calculate_distance_km(
  p_latitude_1 numeric,
  p_longitude_1 numeric,
  p_latitude_2 numeric,
  p_longitude_2 numeric
)
returns numeric(10,2)
language plpgsql
immutable
as $$
declare
  v_lat1 double precision;
  v_lon1 double precision;
  v_lat2 double precision;
  v_lon2 double precision;

  v_a double precision;
  v_c double precision;

  v_earth_radius_km constant double precision := 6371.0088;
begin

  if p_latitude_1 is null
     or p_longitude_1 is null
     or p_latitude_2 is null
     or p_longitude_2 is null then

    return null;

  end if;


  if p_latitude_1 < -90
     or p_latitude_1 > 90
     or p_latitude_2 < -90
     or p_latitude_2 > 90
     or p_longitude_1 < -180
     or p_longitude_1 > 180
     or p_longitude_2 < -180
     or p_longitude_2 > 180 then

    raise exception using
      errcode = 'P0001',
      message = 'DELIVERY_INVALID_COORDINATES';

  end if;


  v_lat1 := radians(p_latitude_1::double precision);
  v_lon1 := radians(p_longitude_1::double precision);

  v_lat2 := radians(p_latitude_2::double precision);
  v_lon2 := radians(p_longitude_2::double precision);


  v_a :=
    power(sin((v_lat2 - v_lat1) / 2), 2)
    +
    cos(v_lat1)
    * cos(v_lat2)
    * power(sin((v_lon2 - v_lon1) / 2), 2);


  v_c :=
    2 * atan2(
      sqrt(v_a),
      sqrt(greatest(0, 1 - v_a))
    );


  return round(
    (v_earth_radius_km * v_c)::numeric,
    2
  );

end;
$$;


-- ============================================================
-- 7. FIND DELIVERY ZONE
--
-- Priority:
--
--   1. Exact state + city
--   2. State-wide zone
--   3. Global/default zone
--
-- More specific zones win.
-- ============================================================

create or replace function public.get_delivery_zone(
  p_state text,
  p_city text
)
returns public.delivery_zones
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_zone public.delivery_zones;
begin

  select *
  into v_zone
  from public.delivery_zones
  where is_active = true
    and lower(trim(state)) = lower(trim(p_state))
    and lower(trim(city)) = lower(trim(p_city))
  order by created_at asc
  limit 1;


  if found then
    return v_zone;
  end if;


  select *
  into v_zone
  from public.delivery_zones
  where is_active = true
    and lower(trim(state)) = lower(trim(p_state))
    and city is null
  order by created_at asc
  limit 1;


  if found then
    return v_zone;
  end if;


  select *
  into v_zone
  from public.delivery_zones
  where is_active = true
    and state is null
    and city is null
  order by created_at asc
  limit 1;


  if found then
    return v_zone;
  end if;


  raise exception using
    errcode = 'P0001',
    message = 'DELIVERY_ZONE_UNAVAILABLE';

end;
$$;


-- ============================================================
-- 8. DELIVERY FEE CALCULATION
--
-- Customer total:
--
--   product subtotal
--   + delivery fee
--
-- Business net:
--
--   product subtotal
--   - platform fee
--
-- Delivery fee is NOT included in platform fee.
-- ============================================================

create or replace function public.calculate_delivery_fee(
  p_business_id uuid,
  p_delivery_state text,
  p_delivery_city text,
  p_delivery_latitude numeric,
  p_delivery_longitude numeric,
  p_order_subtotal numeric
)
returns numeric(14,2)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_business public.businesses%rowtype;
  v_zone public.delivery_zones%rowtype;

  v_distance_km numeric(10,2);

  v_base_fee numeric(14,2);
  v_distance_fee numeric(14,2);
  v_delivery_fee numeric(14,2);

begin

  if p_order_subtotal is null
     or p_order_subtotal <= 0 then

    raise exception using
      errcode = 'P0001',
      message = 'DELIVERY_INVALID_ORDER_SUBTOTAL';

  end if;


  -- ----------------------------------------------------------
  -- Business
  -- ----------------------------------------------------------

  select *
  into v_business
  from public.businesses
  where id = p_business_id
    and status = 'active';

  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'DELIVERY_BUSINESS_UNAVAILABLE';

  end if;


  -- ----------------------------------------------------------
  -- Delivery zone
  -- ----------------------------------------------------------

  v_zone :=
    public.get_delivery_zone(
      p_delivery_state,
      p_delivery_city
    );


  -- ----------------------------------------------------------
  -- Free delivery threshold
  -- ----------------------------------------------------------

  if v_zone.free_delivery_threshold is not null
     and p_order_subtotal >= v_zone.free_delivery_threshold then

    return 0::numeric(14,2);

  end if;


  -- ----------------------------------------------------------
  -- Distance
  -- ----------------------------------------------------------

  v_distance_km :=
    public.calculate_distance_km(
      v_business.latitude,
      v_business.longitude,
      p_delivery_latitude,
      p_delivery_longitude
    );


  -- ----------------------------------------------------------
  -- Coordinates are required when the active pricing rule
  -- requires distance.
  -- ----------------------------------------------------------

  if v_zone.per_km_fee > 0
     and v_distance_km is null then

    raise exception using
      errcode = 'P0001',
      message = 'DELIVERY_LOCATION_REQUIRED';

  end if;


  -- ----------------------------------------------------------
  -- Maximum delivery distance
  -- ----------------------------------------------------------

  if v_zone.max_distance_km is not null
     and v_distance_km is not null
     and v_distance_km > v_zone.max_distance_km then

    raise exception using
      errcode = 'P0001',
      message = 'DELIVERY_DISTANCE_UNAVAILABLE';

  end if;


  -- ----------------------------------------------------------
  -- Base fee
  -- ----------------------------------------------------------

  v_base_fee := v_zone.base_fee;


  -- ----------------------------------------------------------
  -- Distance component
  -- ----------------------------------------------------------

  v_distance_fee := round(
    coalesce(v_distance_km, 0)
    * v_zone.per_km_fee,
    2
  );


  -- ----------------------------------------------------------
  -- Total
  -- ----------------------------------------------------------

  v_delivery_fee := round(
    v_base_fee + v_distance_fee,
    2
  );


  -- ----------------------------------------------------------
  -- Minimum fee
  -- ----------------------------------------------------------

  if v_delivery_fee < v_zone.minimum_fee then
    v_delivery_fee := v_zone.minimum_fee;
  end if;


  -- ----------------------------------------------------------
  -- Maximum fee
  -- ----------------------------------------------------------

  if v_zone.maximum_fee is not null
     and v_delivery_fee > v_zone.maximum_fee then

    v_delivery_fee := v_zone.maximum_fee;

  end if;


  return greatest(
    0,
    round(v_delivery_fee, 2)
  )::numeric(14,2);

end;
$$;


-- ============================================================
-- 9. TRUSTED FINANCIAL UPDATE FLAG
--
-- 0010 protected financial fields from ordinary customer
-- updates. The delivery-pricing RPC needs a controlled way
-- to update delivery_fee.
--
-- This transaction-local setting is only enabled inside the
-- security-definer delivery function.
-- ============================================================

create or replace function public.is_trusted_financial_operation()
returns boolean
language sql
stable
as $$
  select coalesce(
    current_setting(
      'app.trusted_financial_operation',
      true
    ),
    'false'
  ) = 'true';
$$;


-- ============================================================
-- 10. UPDATE ORDER FINANCIAL PROTECTION
--
-- Replace the previous protection function so trusted backend
-- functions can update delivery pricing while normal frontend
-- requests remain blocked.
-- ============================================================

create or replace function public.protect_customer_order_financials()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  -- ----------------------------------------------------------
  -- Trusted server-side financial operation.
  -- ----------------------------------------------------------

  if public.is_trusted_financial_operation() then
    return new;
  end if;


  -- ----------------------------------------------------------
  -- Admins may manage financial fields.
  -- ----------------------------------------------------------

  if public.is_admin() then
    return new;
  end if;


  -- ----------------------------------------------------------
  -- Normal customer/business requests cannot alter historical
  -- financial values.
  -- ----------------------------------------------------------

  if old.customer_id <> auth.uid() then

    raise exception using
      errcode = 'P0001',
      message = 'ORDER_ACCESS_DENIED';

  end if;


  if new.subtotal is distinct from old.subtotal
     or new.delivery_fee is distinct from old.delivery_fee
     or new.platform_fee is distinct from old.platform_fee
     or new.platform_fee_rate is distinct from old.platform_fee_rate
     or new.customer_total is distinct from old.customer_total
     or new.business_net_amount is distinct from old.business_net_amount
     or new.refunded_amount is distinct from old.refunded_amount then

    raise exception using
      errcode = 'P0001',
      message = 'ORDER_FINANCIAL_UPDATE_NOT_ALLOWED';

  end if;


  return new;
end;
$$;


-- ============================================================
-- 11. APPLY DELIVERY PRICING TO ORDER
--
-- This is the authoritative function used after checkout.
--
-- It:
--   - verifies customer ownership
--   - locks the order
--   - verifies pending payment state
--   - calculates delivery fee
--   - stores delivery pricing snapshot
--   - updates customer_total
--   - keeps platform fee based ONLY on subtotal
--   - keeps business_net_amount based ONLY on subtotal
-- ============================================================

create or replace function public.apply_delivery_pricing(
  p_order_id uuid
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_business public.businesses%rowtype;
  v_zone public.delivery_zones%rowtype;

  v_distance_km numeric(10,2);
  v_delivery_fee numeric(14,2);
  v_base_fee numeric(14,2);
  v_distance_fee numeric(14,2);

  v_platform_fee_rate numeric(7,4);
  v_platform_fee numeric(14,2);
  v_customer_total numeric(14,2);
  v_business_net_amount numeric(14,2);

  v_snapshot jsonb;

begin

  if auth.uid() is null then

    raise exception using
      errcode = 'P0001',
      message = 'AUTHENTICATION_REQUIRED';

  end if;


  -- ----------------------------------------------------------
  -- Lock order.
  -- ----------------------------------------------------------

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'ORDER_NOT_FOUND';

  end if;


  -- ----------------------------------------------------------
  -- Customer ownership.
  -- ----------------------------------------------------------

  if not public.is_admin()
     and v_order.customer_id <> auth.uid() then

    raise exception using
      errcode = 'P0001',
      message = 'ORDER_ACCESS_DENIED';

  end if;


  -- ----------------------------------------------------------
  -- Only unpaid pending orders can receive initial delivery
  -- pricing.
  -- ----------------------------------------------------------

  if v_order.status <> 'pending_payment'
     or v_order.payment_status <> 'unpaid' then

    raise exception using
      errcode = 'P0001',
      message = 'ORDER_NOT_PRICABLE';

  end if;


  -- ----------------------------------------------------------
  -- Business.
  -- ----------------------------------------------------------

  select *
  into v_business
  from public.businesses
  where id = v_order.business_id
    and status = 'active';


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'DELIVERY_BUSINESS_UNAVAILABLE';

  end if;


  -- ----------------------------------------------------------
  -- Delivery zone.
  -- ----------------------------------------------------------

  v_zone :=
    public.get_delivery_zone(
      v_order.delivery_state,
      v_order.delivery_city
    );


  -- ----------------------------------------------------------
  -- Distance.
  -- ----------------------------------------------------------

  v_distance_km :=
    public.calculate_distance_km(
      v_business.latitude,
      v_business.longitude,
      v_order.delivery_latitude,
      v_order.delivery_longitude
    );


  -- ----------------------------------------------------------
  -- Free delivery.
  -- ----------------------------------------------------------

  if v_zone.free_delivery_threshold is not null
     and v_order.subtotal >= v_zone.free_delivery_threshold then

    v_delivery_fee := 0;
    v_base_fee := 0;
    v_distance_fee := 0;

  else

    if v_zone.per_km_fee > 0
       and v_distance_km is null then

      raise exception using
        errcode = 'P0001',
        message = 'DELIVERY_LOCATION_REQUIRED';

    end if;


    if v_zone.max_distance_km is not null
       and v_distance_km is not null
       and v_distance_km > v_zone.max_distance_km then

      raise exception using
        errcode = 'P0001',
        message = 'DELIVERY_DISTANCE_UNAVAILABLE';

    end if;


    v_base_fee := v_zone.base_fee;

    v_distance_fee := round(
      coalesce(v_distance_km, 0)
      * v_zone.per_km_fee,
      2
    );


    v_delivery_fee := round(
      v_base_fee + v_distance_fee,
      2
    );


    if v_delivery_fee < v_zone.minimum_fee then
      v_delivery_fee := v_zone.minimum_fee;
    end if;


    if v_zone.maximum_fee is not null
       and v_delivery_fee > v_zone.maximum_fee then

      v_delivery_fee := v_zone.maximum_fee;

    end if;

  end if;


  -- ----------------------------------------------------------
  -- Recalculate platform fee from product subtotal only.
  -- ----------------------------------------------------------

  v_platform_fee_rate :=
    public.get_platform_fee_rate();


  v_platform_fee := round(
    v_order.subtotal
    * v_platform_fee_rate
    / 100,
    2
  );


  -- ----------------------------------------------------------
  -- Customer pays:
  --
  -- subtotal + delivery
  -- ----------------------------------------------------------

  v_customer_total := round(
    v_order.subtotal + v_delivery_fee,
    2
  );


  -- ----------------------------------------------------------
  -- Business receives:
  --
  -- subtotal - platform fee
  --
  -- Delivery fee is deliberately excluded.
  -- ----------------------------------------------------------

  v_business_net_amount := round(
    v_order.subtotal - v_platform_fee,
    2
  );


  -- ----------------------------------------------------------
  -- Historical pricing snapshot.
  -- ----------------------------------------------------------

  v_snapshot := jsonb_build_object(
    'pricing_version', 1,
    'zone_id', v_zone.id,
    'zone_name', v_zone.name,

    'state', v_order.delivery_state,
    'city', v_order.delivery_city,

    'distance_km', v_distance_km,

    'base_fee', v_base_fee,
    'per_km_fee', v_zone.per_km_fee,
    'distance_fee', v_distance_fee,

    'minimum_fee', v_zone.minimum_fee,
    'maximum_fee', v_zone.maximum_fee,

    'free_delivery_threshold',
      v_zone.free_delivery_threshold,

    'calculated_delivery_fee',
      v_delivery_fee,

    'platform_fee_rate',
      v_platform_fee_rate,

    'platform_fee',
      v_platform_fee,

    'customer_total',
      v_customer_total,

    'business_net_amount',
      v_business_net_amount,

    'currency', 'NGN'
  );


  -- ----------------------------------------------------------
  -- Enable trusted financial operation only for this
  -- transaction.
  -- ----------------------------------------------------------

  perform set_config(
    'app.trusted_financial_operation',
    'true',
    true
  );


  update public.orders
  set
    delivery_zone_id = v_zone.id,

    delivery_distance_km = v_distance_km,

    delivery_base_fee = v_base_fee,

    delivery_distance_fee = v_distance_fee,

    delivery_fee = v_delivery_fee,

    platform_fee_rate = v_platform_fee_rate,

    platform_fee = v_platform_fee,

    customer_total = v_customer_total,

    business_net_amount = v_business_net_amount,

    delivery_pricing_snapshot = v_snapshot

  where id = p_order_id

  returning *
  into v_order;


  -- ----------------------------------------------------------
  -- Disable trusted financial operation before returning.
  -- ----------------------------------------------------------

  perform set_config(
    'app.trusted_financial_operation',
    'false',
    true
  );


  return v_order;

exception
  when others then

    -- Always clear trusted mode if anything fails.
    perform set_config(
      'app.trusted_financial_operation',
      'false',
      true
    );

    -- Preserve our safe application errors.
    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'DELIVERY_PRICING_FAILED';

end;
$$;


-- ============================================================
-- 12. DELIVERY PRICE PREVIEW
--
-- This lets the frontend display the delivery amount before
-- final payment without modifying the order.
--
-- It returns a safe amount only after ownership validation.
-- ============================================================

create or replace function public.preview_delivery_fee(
  p_order_id uuid
)
returns table (
  delivery_fee numeric(14,2),
  distance_km numeric(10,2),
  zone_name text,
  currency text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_business public.businesses%rowtype;
  v_zone public.delivery_zones%rowtype;

  v_distance_km numeric(10,2);
  v_delivery_fee numeric(14,2);

begin

  select *
  into v_order
  from public.orders
  where id = p_order_id;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'ORDER_NOT_FOUND';

  end if;


  if not public.is_admin()
     and v_order.customer_id <> auth.uid() then

    raise exception using
      errcode = 'P0001',
      message = 'ORDER_ACCESS_DENIED';

  end if;


  select *
  into v_business
  from public.businesses
  where id = v_order.business_id
    and status = 'active';


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'DELIVERY_BUSINESS_UNAVAILABLE';

  end if;


  v_zone :=
    public.get_delivery_zone(
      v_order.delivery_state,
      v_order.delivery_city
    );


  v_distance_km :=
    public.calculate_distance_km(
      v_business.latitude,
      v_business.longitude,
      v_order.delivery_latitude,
      v_order.delivery_longitude
    );


  if v_zone.free_delivery_threshold is not null
     and v_order.subtotal >= v_zone.free_delivery_threshold then

    v_delivery_fee := 0;

  else

    if v_zone.per_km_fee > 0
       and v_distance_km is null then

      raise exception using
        errcode = 'P0001',
        message = 'DELIVERY_LOCATION_REQUIRED';

    end if;


    if v_zone.max_distance_km is not null
       and v_distance_km is not null
       and v_distance_km > v_zone.max_distance_km then

      raise exception using
        errcode = 'P0001',
        message = 'DELIVERY_DISTANCE_UNAVAILABLE';

    end if;


    v_delivery_fee := round(
      v_zone.base_fee
      + (
        coalesce(v_distance_km, 0)
        * v_zone.per_km_fee
      ),
      2
    );


    if v_delivery_fee < v_zone.minimum_fee then
      v_delivery_fee := v_zone.minimum_fee;
    end if;


    if v_zone.maximum_fee is not null
       and v_delivery_fee > v_zone.maximum_fee then

      v_delivery_fee := v_zone.maximum_fee;

    end if;

  end if;


  return query
  select
    v_delivery_fee,
    v_distance_km,
    v_zone.name,
    'NGN'::text;

end;
$$;


-- ============================================================
-- 13. RLS — DELIVERY ZONES
--
-- Customers can read active pricing rules.
-- Only admins can create/update/delete them.
-- ============================================================

alter table public.delivery_zones enable row level security;


drop policy if exists "Authenticated users can view active delivery zones"
  on public.delivery_zones;

create policy "Authenticated users can view active delivery zones"
on public.delivery_zones
for select
to authenticated
using (
  is_active = true
  or public.is_admin()
);


drop policy if exists "Admins can insert delivery zones"
  on public.delivery_zones;

create policy "Admins can insert delivery zones"
on public.delivery_zones
for insert
to authenticated
with check (
  public.is_admin()
);


drop policy if exists "Admins can update delivery zones"
  on public.delivery_zones;

create policy "Admins can update delivery zones"
on public.delivery_zones
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


drop policy if exists "Admins can delete delivery zones"
  on public.delivery_zones;

create policy "Admins can delete delivery zones"
on public.delivery_zones
for delete
to authenticated
using (
  public.is_admin()
);


-- ============================================================
-- 14. ORDER DELIVERY SNAPSHOT RLS
--
-- Delivery pricing is historical financial information.
-- Customers/business members can view it through their order
-- permissions, but cannot directly modify it.
-- ============================================================

-- No direct INSERT/UPDATE/DELETE policy is added for these
-- fields. Existing order policies remain responsible for
-- row visibility.


-- ============================================================
-- 15. FUNCTION PERMISSIONS
-- ============================================================

revoke all
on function public.calculate_distance_km(
  numeric,
  numeric,
  numeric,
  numeric
)
from public;

grant execute
on function public.calculate_distance_km(
  numeric,
  numeric,
  numeric,
  numeric
)
to authenticated;


revoke all
on function public.get_delivery_zone(
  text,
  text
)
from public;

grant execute
on function public.get_delivery_zone(
  text,
  text
)
to authenticated;


revoke all
on function public.calculate_delivery_fee(
  uuid,
  text,
  text,
  numeric,
  numeric,
  numeric
)
from public;

grant execute
on function public.calculate_delivery_fee(
  uuid,
  text,
  text,
  numeric,
  numeric,
  numeric
)
to authenticated;


revoke all
on function public.apply_delivery_pricing(
  uuid
)
from public;

grant execute
on function public.apply_delivery_pricing(
  uuid
)
to authenticated;


revoke all
on function public.preview_delivery_fee(
  uuid
)
from public;

grant execute
on function public.preview_delivery_fee(
  uuid
)
to authenticated;


-- ============================================================
-- 16. TABLE GRANTS
-- ============================================================

grant select
on public.delivery_zones
to authenticated;


-- ============================================================
-- 17. COMMENTS
-- ============================================================

comment on table public.delivery_zones is
'Admin-controlled delivery pricing zones for IyanjuWorld.';

comment on column public.delivery_zones.base_fee is
'Fixed delivery charge before distance pricing.';

comment on column public.delivery_zones.per_km_fee is
'Additional delivery charge per kilometre.';

comment on column public.delivery_zones.minimum_fee is
'Lowest delivery fee permitted by this pricing zone.';

comment on column public.delivery_zones.maximum_fee is
'Highest delivery fee permitted by this pricing zone.';

comment on column public.delivery_zones.free_delivery_threshold is
'Order subtotal at or above which delivery becomes free.';

comment on column public.orders.delivery_pricing_snapshot is
'Historical JSON snapshot of the delivery pricing calculation used for this order.';

comment on function public.apply_delivery_pricing(uuid) is
'Authoritatively calculates and stores delivery pricing for an unpaid order.';

comment on function public.preview_delivery_fee(uuid) is
'Previews the current delivery fee without modifying the order.';


commit;
