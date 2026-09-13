-- ============================================================
-- IyanjuWorld
-- Migration 0008: Orders
-- ============================================================

-- ============================================================
-- ORDER STATUS
-- ============================================================

do $$
begin
  create type public.order_status as enum (
    'pending_payment',
    'paid',
    'business_confirmed',
    'delivery_requested',
    'rider_assigned',
    'picked_up',
    'out_for_delivery',
    'delivered',
    'completed',
    'cancelled',
    'refund_pending',
    'refunded',
    'disputed'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- ORDER PAYMENT STATUS
-- ============================================================

do $$
begin
  create type public.order_payment_status as enum (
    'unpaid',
    'pending',
    'paid',
    'failed',
    'partially_refunded',
    'refunded'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- ORDER CANCELLATION REASONS
-- ============================================================

do $$
begin
  create type public.order_cancellation_reason as enum (
    'customer_requested',
    'business_rejected',
    'business_unavailable',
    'payment_failed',
    'payment_expired',
    'out_of_stock',
    'delivery_unavailable',
    'admin_cancelled',
    'fraud_prevention',
    'other'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- PLATFORM SETTINGS
-- ============================================================
--
-- Admin-configurable marketplace settings.
--
-- The platform fee is initially 5%.
--
-- IMPORTANT:
-- Orders snapshot the fee rate at creation time.
-- Changing this setting later does NOT alter existing orders.
--
-- ============================================================

create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),

  platform_fee_rate numeric(7,4) not null default 5.0000,

  currency text not null default 'NGN',

  is_active boolean not null default true,

  created_at timestamptz not null
    default timezone('utc', now()),

  updated_at timestamptz not null
    default timezone('utc', now()),

  constraint platform_settings_fee_rate_check
    check (
      platform_fee_rate >= 0
      and platform_fee_rate <= 100
    ),

  constraint platform_settings_currency_check
    check (
      currency = 'NGN'
    )
);

-- ============================================================
-- SINGLE ACTIVE PLATFORM SETTINGS ROW
-- ============================================================

create unique index if not exists platform_settings_single_active_idx
  on public.platform_settings(is_active)
  where is_active = true;

-- ============================================================
-- DEFAULT PLATFORM SETTINGS
-- ============================================================

insert into public.platform_settings (
  platform_fee_rate,
  currency,
  is_active
)
select
  5.0000,
  'NGN',
  true
where not exists (
  select 1
  from public.platform_settings
  where is_active = true
);

-- ============================================================
-- PLATFORM SETTINGS UPDATED_AT
-- ============================================================

drop trigger if exists platform_settings_set_updated_at
on public.platform_settings;

create trigger platform_settings_set_updated_at
before update on public.platform_settings
for each row
execute function public.set_updated_at();

-- ============================================================
-- PLATFORM SETTINGS HELPER
-- ============================================================

create or replace function public.get_platform_fee_rate()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select platform_fee_rate
      from public.platform_settings
      where is_active = true
      order by created_at desc
      limit 1
    ),
    5.0000
  );
$$;

-- ============================================================
-- ORDERS
-- ============================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),

  order_reference text not null unique,

  customer_id uuid not null
    references public.profiles(id)
    on delete restrict,

  business_id uuid not null
    references public.businesses(id)
    on delete restrict,

  status public.order_status not null
    default 'pending_payment',

  payment_status public.order_payment_status not null
    default 'unpaid',

  currency text not null default 'NGN',

  -- ==========================================================
  -- FINANCIAL SNAPSHOT
  -- ==========================================================

  subtotal numeric(18,2) not null default 0,

  delivery_fee numeric(18,2) not null default 0,

  -- Platform fee rate used for THIS order.
  -- This is a historical snapshot and must never be changed
  -- automatically when platform_settings changes.
  platform_fee_rate numeric(7,4) not null default 5.0000,

  -- Actual platform fee amount charged to the business.
  platform_fee numeric(18,2) not null default 0,

  -- Customer pays subtotal + delivery.
  -- Platform fee is NOT included.
  customer_total numeric(18,2) not null default 0,

  -- Business receives subtotal - platform fee.
  business_net_amount numeric(18,2) not null default 0,

  refunded_amount numeric(18,2) not null default 0,

  -- ==========================================================
  -- DELIVERY ADDRESS SNAPSHOT
  -- ==========================================================

  delivery_full_name text not null,

  delivery_phone text not null,

  delivery_address_line text not null,

  delivery_address_line_2 text,

  delivery_city text not null,

  delivery_state text not null,

  delivery_country text not null default 'Nigeria',

  delivery_postal_code text,

  delivery_landmark text,

  delivery_latitude numeric(10,7),

  delivery_longitude numeric(10,7),

  delivery_notes text,

  -- ==========================================================
  -- CUSTOMER NOTE
  -- ==========================================================

  customer_note text,

  -- ==========================================================
  -- CANCELLATION
  -- ==========================================================

  cancellation_reason public.order_cancellation_reason,

  cancellation_note text,

  cancelled_at timestamptz,

  cancelled_by uuid
    references public.profiles(id)
    on delete set null,

  -- ==========================================================
  -- COMPLETION
  -- ==========================================================

  delivered_at timestamptz,

  completed_at timestamptz,

  -- ==========================================================
  -- TIMESTAMPS
  -- ==========================================================

  created_at timestamptz not null
    default timezone('utc', now()),

  updated_at timestamptz not null
    default timezone('utc', now()),

  -- ==========================================================
  -- CONSTRAINTS
  -- ==========================================================

  constraint orders_reference_check
    check (
      length(trim(order_reference)) >= 6
    ),

  constraint orders_currency_check
    check (
      currency = 'NGN'
    ),

  constraint orders_subtotal_check
    check (
      subtotal >= 0
    ),

  constraint orders_delivery_fee_check
    check (
      delivery_fee >= 0
    ),

  constraint orders_platform_fee_rate_check
    check (
      platform_fee_rate >= 0
      and platform_fee_rate <= 100
    ),

  constraint orders_platform_fee_check
    check (
      platform_fee >= 0
    ),

  constraint orders_customer_total_check
    check (
      customer_total >= 0
    ),

  constraint orders_business_net_amount_check
    check (
      business_net_amount >= 0
    ),

  constraint orders_refunded_amount_check
    check (
      refunded_amount >= 0
      and refunded_amount <= customer_total
    ),

  constraint orders_customer_total_calculation_check
    check (
      customer_total = subtotal + delivery_fee
    ),

  constraint orders_business_net_calculation_check
    check (
      business_net_amount = subtotal - platform_fee
    ),

  constraint orders_platform_fee_limit_check
    check (
      platform_fee <= subtotal
    ),

  constraint orders_delivery_latitude_check
    check (
      delivery_latitude is null
      or delivery_latitude between -90 and 90
    ),

  constraint orders_delivery_longitude_check
    check (
      delivery_longitude is null
      or delivery_longitude between -180 and 180
    ),

  constraint orders_refund_status_check
    check (
      refunded_amount = 0
      or payment_status in (
        'paid',
        'partially_refunded',
        'refunded'
      )
    )
);

-- ============================================================
-- ORDER INDEXES
-- ============================================================

create index if not exists orders_reference_idx
  on public.orders(order_reference);

create index if not exists orders_customer_id_idx
  on public.orders(customer_id);

create index if not exists orders_business_id_idx
  on public.orders(business_id);

create index if not exists orders_status_idx
  on public.orders(status);

create index if not exists orders_payment_status_idx
  on public.orders(payment_status);

create index if not exists orders_created_at_idx
  on public.orders(created_at desc);

create index if not exists orders_business_status_idx
  on public.orders(business_id, status);

create index if not exists orders_customer_status_idx
  on public.orders(customer_id, status);

-- ============================================================
-- ORDER ITEMS
-- ============================================================

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id)
    on delete cascade,

  product_id uuid
    references public.products(id)
    on delete set null,

  -- Historical product snapshot.
  product_name text not null,

  product_sku text,

  product_image_url text,

  quantity integer not null,

  unit_price numeric(18,2) not null,

  line_total numeric(18,2) not null,

  product_metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null
    default timezone('utc', now()),

  constraint order_items_quantity_check
    check (
      quantity > 0
    ),

  constraint order_items_unit_price_check
    check (
      unit_price >= 0
    ),

  constraint order_items_line_total_check
    check (
      line_total = unit_price * quantity
    ),

  constraint order_items_product_name_check
    check (
      length(trim(product_name)) >= 1
    )
);

-- ============================================================
-- ORDER ITEM INDEXES
-- ============================================================

create index if not exists order_items_order_id_idx
  on public.order_items(order_id);

create index if not exists order_items_product_id_idx
  on public.order_items(product_id);

create index if not exists order_items_created_at_idx
  on public.order_items(created_at desc);

-- ============================================================
-- ORDER STATUS HISTORY
-- ============================================================

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id)
    on delete cascade,

  previous_status public.order_status,

  new_status public.order_status not null,

  changed_by uuid
    references public.profiles(id)
    on delete set null,

  note text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null
    default timezone('utc', now())
);

create index if not exists order_status_history_order_id_idx
  on public.order_status_history(order_id);

create index if not exists order_status_history_created_at_idx
  on public.order_status_history(created_at desc);

-- ============================================================
-- ORDER UPDATED_AT
-- ============================================================

drop trigger if exists orders_set_updated_at
on public.orders;

create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

-- ============================================================
-- ORDER REFERENCE GENERATOR
-- ============================================================

create or replace function public.generate_order_reference()
returns text
language plpgsql
as $$
declare
  generated_reference text;
begin
  loop
    generated_reference :=
      'ORD-' ||
      upper(
        substr(
          encode(gen_random_bytes(6), 'hex'),
          1,
          10
        )
      );

    exit when not exists (
      select 1
      from public.orders
      where order_reference = generated_reference
    );
  end loop;

  return generated_reference;
end;
$$;

-- ============================================================
-- ORDER REFERENCE TRIGGER
-- ============================================================

create or replace function public.set_order_reference()
returns trigger
language plpgsql
as $$
begin
  if new.order_reference is null
     or length(trim(new.order_reference)) = 0 then

    new.order_reference :=
      public.generate_order_reference();

  end if;

  return new;
end;
$$;

drop trigger if exists orders_set_reference
on public.orders;

create trigger orders_set_reference
before insert on public.orders
for each row
execute function public.set_order_reference();

-- ============================================================
-- ORDER FINANCIAL SNAPSHOT
-- ============================================================
--
-- On creation:
--
-- 1. Read current admin-configured platform fee.
-- 2. Save that percentage into the order.
-- 3. Calculate the platform fee.
-- 4. Calculate customer total.
-- 5. Calculate business net amount.
--
-- Once the order exists, its rate becomes historical data.
--
-- ============================================================

create or replace function public.set_order_financial_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_platform_fee_rate numeric(7,4);
begin

  if tg_op = 'INSERT' then

    current_platform_fee_rate :=
      public.get_platform_fee_rate();

    new.platform_fee_rate :=
      current_platform_fee_rate;

  end if;

  new.platform_fee :=
    round(
      new.subtotal * new.platform_fee_rate / 100,
      2
    );

  new.customer_total :=
    new.subtotal + new.delivery_fee;

  new.business_net_amount :=
    new.subtotal - new.platform_fee;

  return new;
end;
$$;

drop trigger if exists orders_set_financial_snapshot
on public.orders;

create trigger orders_set_financial_snapshot
before insert or update on public.orders
for each row
execute function public.set_order_financial_snapshot();

-- ============================================================
-- ORDER INITIAL STATUS HISTORY
-- ============================================================

create or replace function public.create_initial_order_status_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.order_status_history (
    order_id,
    previous_status,
    new_status,
    changed_by,
    note
  )
  values (
    new.id,
    null,
    new.status,
    new.customer_id,
    'Order created'
  );

  return new;
end;
$$;

drop trigger if exists orders_create_initial_status_history
on public.orders;

create trigger orders_create_initial_status_history
after insert on public.orders
for each row
execute function public.create_initial_order_status_history();

-- ============================================================
-- ORDER STATUS HISTORY ON STATUS CHANGE
-- ============================================================

create or replace function public.record_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if old.status is distinct from new.status then

    insert into public.order_status_history (
      order_id,
      previous_status,
      new_status,
      changed_by,
      note
    )
    values (
      new.id,
      old.status,
      new.status,
      auth.uid(),
      null
    );

  end if;

  return new;
end;
$$;

drop trigger if exists orders_record_status_change
on public.orders;

create trigger orders_record_status_change
after update on public.orders
for each row
when (old.status is distinct from new.status)
execute function public.record_order_status_change();

-- ============================================================
-- PROTECT HISTORICAL PLATFORM FEE RATE
-- ============================================================
--
-- After an order has been created, changing the global setting
-- must never alter the order's stored platform_fee_rate.
--
-- Only trusted administrative/backend workflows may deliberately
-- modify the historical financial snapshot.
--
-- ============================================================

create or replace function public.protect_order_financial_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if tg_op = 'UPDATE' then

    if new.platform_fee_rate is distinct from old.platform_fee_rate then

      if not public.is_admin() then
        new.platform_fee_rate := old.platform_fee_rate;
      end if;

    end if;

  end if;

  return new;
end;
$$;

drop trigger if exists orders_protect_financial_snapshot
on public.orders;

create trigger orders_protect_financial_snapshot
before update on public.orders
for each row
execute function public.protect_order_financial_snapshot();

-- ============================================================
-- ORDER FINANCIAL VALIDATION
-- ============================================================

create or replace function public.validate_order_financial_totals()
returns trigger
language plpgsql
as $$
declare
  expected_platform_fee numeric(18,2);
begin

  expected_platform_fee :=
    round(
      new.subtotal * new.platform_fee_rate / 100,
      2
    );

  if new.platform_fee <> expected_platform_fee then
    raise exception using
      errcode = 'P0001',
      message = 'INVALID_PLATFORM_FEE';
  end if;

  if new.customer_total <> (
    new.subtotal + new.delivery_fee
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'INVALID_CUSTOMER_TOTAL';
  end if;

  if new.business_net_amount <> (
    new.subtotal - new.platform_fee
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'INVALID_BUSINESS_NET_AMOUNT';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_validate_financial_totals
on public.orders;

create trigger orders_validate_financial_totals
before insert or update on public.orders
for each row
execute function public.validate_order_financial_totals();

-- ============================================================
-- ORDER OWNERSHIP HELPERS
-- ============================================================

create or replace function public.is_order_customer(
  p_order_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders
    where id = p_order_id
      and customer_id = auth.uid()
  );
$$;

create or replace function public.is_order_business_member(
  p_order_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and public.can_manage_business(o.business_id)
  );
$$;

create or replace function public.is_order_business_member_read_only(
  p_order_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and public.is_business_member(o.business_id)
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.platform_settings enable row level security;

alter table public.orders enable row level security;

alter table public.order_items enable row level security;

alter table public.order_status_history enable row level security;

-- ============================================================
-- PLATFORM SETTINGS: ADMIN READ
-- ============================================================

drop policy if exists "Admins can view platform settings"
on public.platform_settings;

create policy "Admins can view platform settings"
on public.platform_settings
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- PLATFORM SETTINGS: ADMIN UPDATE
-- ============================================================

drop policy if exists "Admins can update platform settings"
on public.platform_settings;

create policy "Admins can update platform settings"
on public.platform_settings
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- ============================================================
-- PLATFORM SETTINGS: NO PUBLIC INSERT/DELETE
-- ============================================================
--
-- Configuration rows are controlled by trusted backend/admin
-- workflows. This prevents arbitrary creation of competing
-- active settings.
--
-- ============================================================

grant select, update
on public.platform_settings
to authenticated;

-- ============================================================
-- ORDERS: CUSTOMER READ
-- ============================================================

drop policy if exists "Customers can view own orders"
on public.orders;

create policy "Customers can view own orders"
on public.orders
for select
to authenticated
using (
  customer_id = auth.uid()
);

-- ============================================================
-- ORDERS: CUSTOMER CREATE
-- ============================================================

drop policy if exists "Customers can create own orders"
on public.orders;

create policy "Customers can create own orders"
on public.orders
for insert
to authenticated
with check (
  customer_id = auth.uid()
);

-- ============================================================
-- ORDERS: BUSINESS READ
-- ============================================================

drop policy if exists "Business members can view business orders"
on public.orders;

create policy "Business members can view business orders"
on public.orders
for select
to authenticated
using (
  public.is_business_member(business_id)
);

-- ============================================================
-- ORDERS: BUSINESS UPDATE
-- ============================================================

drop policy if exists "Business managers can update business orders"
on public.orders;

create policy "Business managers can update business orders"
on public.orders
for update
to authenticated
using (
  public.can_manage_business(business_id)
)
with check (
  public.can_manage_business(business_id)
);

-- ============================================================
-- ORDERS: ADMIN READ
-- ============================================================

drop policy if exists "Admins can view all orders"
on public.orders;

create policy "Admins can view all orders"
on public.orders
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- ORDERS: ADMIN UPDATE
-- ============================================================

drop policy if exists "Admins can update all orders"
on public.orders;

create policy "Admins can update all orders"
on public.orders
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- ============================================================
-- ORDER ITEMS: CUSTOMER READ
-- ============================================================

drop policy if exists "Customers can view own order items"
on public.order_items;

create policy "Customers can view own order items"
on public.order_items
for select
to authenticated
using (
  public.is_order_customer(order_id)
);

-- ============================================================
-- ORDER ITEMS: BUSINESS READ
-- ============================================================

drop policy if exists "Business members can view order items"
on public.order_items;

create policy "Business members can view order items"
on public.order_items
for select
to authenticated
using (
  public.is_order_business_member_read_only(order_id)
);

-- ============================================================
-- ORDER ITEMS: CUSTOMER INSERT
-- ============================================================

drop policy if exists "Customers can create order items"
on public.order_items;

create policy "Customers can create order items"
on public.order_items
for insert
to authenticated
with check (
  public.is_order_customer(order_id)
);

-- ============================================================
-- ORDER ITEMS: ADMIN READ
-- ============================================================

drop policy if exists "Admins can view all order items"
on public.order_items;

create policy "Admins can view all order items"
on public.order_items
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- ORDER STATUS HISTORY: CUSTOMER READ
-- ============================================================

drop policy if exists "Customers can view own order history"
on public.order_status_history;

create policy "Customers can view own order history"
on public.order_status_history
for select
to authenticated
using (
  public.is_order_customer(order_id)
);

-- ============================================================
-- ORDER STATUS HISTORY: BUSINESS READ
-- ============================================================

drop policy if exists "Business members can view order history"
on public.order_status_history;

create policy "Business members can view order history"
on public.order_status_history
for select
to authenticated
using (
  public.is_order_business_member_read_only(order_id)
);

-- ============================================================
-- ORDER STATUS HISTORY: ADMIN READ
-- ============================================================

drop policy if exists "Admins can view all order history"
on public.order_status_history;

create policy "Admins can view all order history"
on public.order_status_history
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- NO DIRECT CLIENT WRITE TO STATUS HISTORY
-- ============================================================

-- Status history is generated by trusted database triggers.

-- ============================================================
-- GRANTS
-- ============================================================

grant select, insert, update
on public.orders
to authenticated;

grant select, insert
on public.order_items
to authenticated;

grant select
on public.order_status_history
to authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.platform_settings is
  'Admin-controlled marketplace configuration.';

comment on column public.platform_settings.platform_fee_rate is
  'Current platform fee percentage applied to newly created orders.';

comment on table public.orders is
  'IyanjuWorld marketplace orders. Each order belongs to one customer and one business.';

comment on column public.orders.platform_fee_rate is
  'Historical platform fee percentage captured when this order was created.';

comment on column public.orders.subtotal is
  'Total product value before delivery fee and platform fee.';

comment on column public.orders.delivery_fee is
  'Delivery amount paid by the customer.';

comment on column public.orders.platform_fee is
  'Platform fee charged to the business.';

comment on column public.orders.customer_total is
  'Total amount charged to the customer: subtotal plus delivery fee.';

comment on column public.orders.business_net_amount is
  'Business product revenue after the platform fee.';

comment on table public.order_items is
  'Historical snapshot of products purchased in an order.';

comment on table public.order_status_history is
  'Audit trail of every order status transition.';
