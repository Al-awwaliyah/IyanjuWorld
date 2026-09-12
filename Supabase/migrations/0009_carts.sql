-- ============================================================
-- IyanjuWorld
-- Migration: 0009_carts.sql
-- Purpose:
--   Customer shopping carts with multi-business support,
--   authoritative product pricing, stock validation,
--   secure ownership, and checkout preparation.
-- ============================================================

begin;

-- ============================================================
-- 1. CART STATUS
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'cart_status'
  ) then
    create type public.cart_status as enum (
      'active',
      'checked_out',
      'abandoned'
    );
  end if;
end
$$;


-- ============================================================
-- 2. CARTS
-- ============================================================

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null
    references public.profiles(id)
    on delete cascade,

  status public.cart_status not null default 'active',

  currency text not null default 'NGN',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint carts_currency_check
    check (currency = 'NGN')
);


-- ============================================================
-- 3. ONE ACTIVE CART PER CUSTOMER
-- ============================================================

create unique index if not exists carts_one_active_per_customer_idx
  on public.carts(customer_id)
  where status = 'active';


-- ============================================================
-- 4. CART INDEXES
-- ============================================================

create index if not exists carts_customer_id_idx
  on public.carts(customer_id);

create index if not exists carts_status_idx
  on public.carts(status);

create index if not exists carts_customer_status_idx
  on public.carts(customer_id, status);

create index if not exists carts_updated_at_idx
  on public.carts(updated_at desc);


-- ============================================================
-- 5. CART ITEMS
-- ============================================================

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),

  cart_id uuid not null
    references public.carts(id)
    on delete cascade,

  product_id uuid not null
    references public.products(id)
    on delete restrict,

  quantity integer not null default 1,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cart_items_quantity_check
    check (quantity > 0),

  constraint cart_items_unique_product_per_cart
    unique (cart_id, product_id)
);


-- ============================================================
-- 6. CART ITEM INDEXES
-- ============================================================

create index if not exists cart_items_cart_id_idx
  on public.cart_items(cart_id);

create index if not exists cart_items_product_id_idx
  on public.cart_items(product_id);

create index if not exists cart_items_cart_product_idx
  on public.cart_items(cart_id, product_id);


-- ============================================================
-- 7. UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists set_carts_updated_at
  on public.carts;

create trigger set_carts_updated_at
before update on public.carts
for each row
execute function public.set_updated_at();


drop trigger if exists set_cart_items_updated_at
  on public.cart_items;

create trigger set_cart_items_updated_at
before update on public.cart_items
for each row
execute function public.set_updated_at();


-- ============================================================
-- 8. CART OWNERSHIP HELPERS
-- ============================================================

create or replace function public.is_cart_owner(
  p_cart_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.carts c
    where c.id = p_cart_id
      and c.customer_id = auth.uid()
  );
$$;


create or replace function public.can_manage_cart(
  p_cart_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or public.is_cart_owner(p_cart_id);
$$;


-- ============================================================
-- 9. CART PRODUCT VALIDATION
--
-- Price is intentionally NOT copied into cart_items.
-- The products table remains the authoritative price source.
--
-- Cart validation checks:
--   - product exists
--   - product is active
--   - product is available
--   - product has stock
--   - business is active
--   - category is active
--   - requested quantity does not exceed current stock
--
-- Checkout must revalidate these conditions again because
-- inventory or availability can change after an item is added.
-- ============================================================

create or replace function public.validate_cart_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_business_status public.business_status;
  v_category_active boolean;
begin
  if new.quantity <= 0 then
    raise exception using
      errcode = 'P0001',
      message = 'CART_INVALID_QUANTITY';
  end if;

  select p.*
  into v_product
  from public.products p
  where p.id = new.product_id;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'CART_PRODUCT_NOT_FOUND';
  end if;

  if v_product.status <> 'active'
     or not v_product.is_available then
    raise exception using
      errcode = 'P0001',
      message = 'CART_PRODUCT_UNAVAILABLE';
  end if;

  if v_product.stock_quantity <= 0 then
    raise exception using
      errcode = 'P0001',
      message = 'CART_PRODUCT_OUT_OF_STOCK';
  end if;

  if new.quantity > v_product.stock_quantity then
    raise exception using
      errcode = 'P0001',
      message = 'CART_QUANTITY_EXCEEDS_STOCK';
  end if;

  select b.status
  into v_business_status
  from public.businesses b
  where b.id = v_product.business_id;

  if v_business_status is distinct from 'active' then
    raise exception using
      errcode = 'P0001',
      message = 'CART_BUSINESS_UNAVAILABLE';
  end if;

  select c.is_active
  into v_category_active
  from public.categories c
  where c.id = v_product.category_id;

  if v_category_active is distinct from true then
    raise exception using
      errcode = 'P0001',
      message = 'CART_CATEGORY_UNAVAILABLE';
  end if;

  return new;
end;
$$;


drop trigger if exists validate_cart_item_trigger
  on public.cart_items;

create trigger validate_cart_item_trigger
before insert or update of product_id, quantity
on public.cart_items
for each row
execute function public.validate_cart_item();


-- ============================================================
-- 10. CART OWNERSHIP / STATUS VALIDATION
--
-- Prevents adding items to another customer's cart and prevents
-- modifying a cart that is no longer active.
-- ============================================================

create or replace function public.validate_cart_item_cart()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_customer uuid;
  v_cart_status public.cart_status;
begin
  select c.customer_id, c.status
  into v_cart_customer, v_cart_status
  from public.carts c
  where c.id = new.cart_id;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'CART_NOT_FOUND';
  end if;

  if v_cart_status <> 'active' then
    raise exception using
      errcode = 'P0001',
      message = 'CART_NOT_ACTIVE';
  end if;

  if not public.is_admin()
     and v_cart_customer <> auth.uid() then
    raise exception using
      errcode = 'P0001',
      message = 'CART_ACCESS_DENIED';
  end if;

  return new;
end;
$$;


drop trigger if exists validate_cart_item_cart_trigger
  on public.cart_items;

create trigger validate_cart_item_cart_trigger
before insert or update of cart_id
on public.cart_items
for each row
execute function public.validate_cart_item_cart();


-- ============================================================
-- 11. SECURE GET OR CREATE ACTIVE CART
--
-- This is the preferred frontend entry point.
--
-- It ensures:
--   - only authenticated customers can create/use carts
--   - exactly one active cart exists per customer
--   - an existing active cart is reused
-- ============================================================

create or replace function public.get_or_create_active_cart()
returns public.carts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart public.carts;
begin
  if auth.uid() is null then
    raise exception using
      errcode = 'P0001',
      message = 'AUTHENTICATION_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'customer'
      and p.is_active = true
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'CUSTOMER_ACCOUNT_REQUIRED';
  end if;

  select *
  into v_cart
  from public.carts
  where customer_id = auth.uid()
    and status = 'active'
  order by created_at desc
  limit 1;

  if found then
    return v_cart;
  end if;

  begin
    insert into public.carts (
      customer_id,
      status,
      currency
    )
    values (
      auth.uid(),
      'active',
      'NGN'
    )
    returning *
    into v_cart;

  exception
    when unique_violation then
      select *
      into v_cart
      from public.carts
      where customer_id = auth.uid()
        and status = 'active'
      order by created_at desc
      limit 1;
  end;

  if v_cart.id is null then
    raise exception using
      errcode = 'P0001',
      message = 'CART_CREATION_FAILED';
  end if;

  return v_cart;
end;
$$;


-- ============================================================
-- 12. CART SUBTOTAL
--
-- The subtotal is calculated dynamically from products.price.
-- No mutable subtotal is stored in the cart.
--
-- This means a changed product price is automatically reflected
-- before checkout, while checkout itself must perform another
-- authoritative validation.
-- ============================================================

create or replace function public.get_cart_subtotal(
  p_cart_id uuid
)
returns numeric(14,2)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_subtotal numeric(14,2);
begin
  if not public.can_manage_cart(p_cart_id) then
    raise exception using
      errcode = 'P0001',
      message = 'CART_ACCESS_DENIED';
  end if;

  select coalesce(
    sum(
      round(
        p.price * ci.quantity,
        2
      )
    ),
    0
  )::numeric(14,2)
  into v_subtotal
  from public.cart_items ci
  join public.products p
    on p.id = ci.product_id
  where ci.cart_id = p_cart_id;

  return v_subtotal;
end;
$$;


-- ============================================================
-- 13. CART ITEM DETAILS VIEW
--
-- Provides frontend-friendly authoritative product information
-- without storing duplicated product pricing in cart_items.
-- ============================================================

create or replace view public.cart_item_details
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
  p.compare_at_price,
  p.stock_quantity,
  p.status as product_status,
  p.is_available,

  (
    round(
      p.price * ci.quantity,
      2
    )
  )::numeric(14,2) as line_total,

  (
    p.status = 'active'
    and p.is_available = true
    and p.stock_quantity >= ci.quantity
    and b.status = 'active'
    and c.is_active = true
  ) as is_checkout_ready,

  ci.created_at,
  ci.updated_at

from public.cart_items ci
join public.products p
  on p.id = ci.product_id
join public.businesses b
  on b.id = p.business_id
left join public.categories c
  on c.id = p.category_id;


-- ============================================================
-- 14. BUSINESS-LEVEL CART TOTALS
--
-- A single customer cart can contain products from multiple
-- businesses. Checkout will later create one order per business.
-- ============================================================

create or replace view public.cart_business_totals
with (security_invoker = true)
as
select
  ci.cart_id,
  p.business_id,
  b.name as business_name,
  b.slug as business_slug,

  count(ci.id)::integer as item_count,

  coalesce(
    sum(ci.quantity),
    0
  )::integer as total_quantity,

  coalesce(
    sum(
      round(
        p.price * ci.quantity,
        2
      )
    ),
    0
  )::numeric(14,2) as subtotal

from public.cart_items ci
join public.products p
  on p.id = ci.product_id
join public.businesses b
  on b.id = p.business_id

group by
  ci.cart_id,
  p.business_id,
  b.name,
  b.slug;


-- ============================================================
-- 15. CART CHECKOUT VALIDATION
--
-- This function is intentionally stricter than the add-to-cart
-- validation. Checkout must validate every item again because:
--
--   - price may have changed
--   - stock may have changed
--   - business may have been suspended
--   - product may have been disabled
--   - category may have been disabled
--
-- It returns TRUE only when every item is currently valid.
-- ============================================================

create or replace function public.validate_cart_for_checkout(
  p_cart_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cart_customer uuid;
  v_cart_status public.cart_status;
  v_invalid_count integer;
begin
  select c.customer_id, c.status
  into v_cart_customer, v_cart_status
  from public.carts c
  where c.id = p_cart_id;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'CART_NOT_FOUND';
  end if;

  if not public.is_admin()
     and v_cart_customer <> auth.uid() then
    raise exception using
      errcode = 'P0001',
      message = 'CART_ACCESS_DENIED';
  end if;

  if v_cart_status <> 'active' then
    raise exception using
      errcode = 'P0001',
      message = 'CART_NOT_ACTIVE';
  end if;

  select count(*)
  into v_invalid_count
  from public.cart_items ci
  join public.products p
    on p.id = ci.product_id
  join public.businesses b
    on b.id = p.business_id
  left join public.categories c
    on c.id = p.category_id
  where ci.cart_id = p_cart_id
    and not (
      p.status = 'active'
      and p.is_available = true
      and p.stock_quantity >= ci.quantity
      and b.status = 'active'
      and c.is_active = true
    );

  if v_invalid_count > 0 then
    raise exception using
      errcode = 'P0001',
      message = 'CART_HAS_UNAVAILABLE_ITEMS';
  end if;

  if not exists (
    select 1
    from public.cart_items ci
    where ci.cart_id = p_cart_id
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'CART_IS_EMPTY';
  end if;

  return true;
end;
$$;


-- ============================================================
-- 16. MARK CART AS CHECKED OUT
--
-- The actual order/payment transaction will be implemented later.
-- This helper only allows a trusted backend process to transition
-- an active cart after successful checkout processing.
-- ============================================================

create or replace function public.mark_cart_checked_out(
  p_cart_id uuid
)
returns public.carts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart public.carts;
begin
  if auth.uid() is null then
    raise exception using
      errcode = 'P0001',
      message = 'AUTHENTICATION_REQUIRED';
  end if;

  select *
  into v_cart
  from public.carts
  where id = p_cart_id;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'CART_NOT_FOUND';
  end if;

  if not public.is_admin()
     and v_cart.customer_id <> auth.uid() then
    raise exception using
      errcode = 'P0001',
      message = 'CART_ACCESS_DENIED';
  end if;

  if v_cart.status <> 'active' then
    raise exception using
      errcode = 'P0001',
      message = 'CART_NOT_ACTIVE';
  end if;

  update public.carts
  set status = 'checked_out'
  where id = p_cart_id
  returning *
  into v_cart;

  return v_cart;
end;
$$;


-- ============================================================
-- 17. RLS — CARTS
-- ============================================================

alter table public.carts enable row level security;

drop policy if exists "Customers can view own carts"
  on public.carts;

create policy "Customers can view own carts"
on public.carts
for select
to authenticated
using (
  customer_id = auth.uid()
  or public.is_admin()
);


drop policy if exists "Customers can create own carts"
  on public.carts;

create policy "Customers can create own carts"
on public.carts
for insert
to authenticated
with check (
  customer_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'customer'
      and p.is_active = true
  )
);


drop policy if exists "Customers can update own active carts"
  on public.carts;

create policy "Customers can update own active carts"
on public.carts
for update
to authenticated
using (
  customer_id = auth.uid()
  or public.is_admin()
)
with check (
  customer_id = auth.uid()
  or public.is_admin()
);


drop policy if exists "Customers can delete own carts"
  on public.carts;

create policy "Customers can delete own carts"
on public.carts
for delete
to authenticated
using (
  customer_id = auth.uid()
  or public.is_admin()
);


-- ============================================================
-- 18. RLS — CART ITEMS
-- ============================================================

alter table public.cart_items enable row level security;


drop policy if exists "Customers can view own cart items"
  on public.cart_items;

create policy "Customers can view own cart items"
on public.cart_items
for select
to authenticated
using (
  public.can_manage_cart(cart_id)
);


drop policy if exists "Customers can add own cart items"
  on public.cart_items;

create policy "Customers can add own cart items"
on public.cart_items
for insert
to authenticated
with check (
  public.is_cart_owner(cart_id)
);


drop policy if exists "Customers can update own cart items"
  on public.cart_items;

create policy "Customers can update own cart items"
on public.cart_items
for update
to authenticated
using (
  public.is_cart_owner(cart_id)
  or public.is_admin()
)
with check (
  public.is_cart_owner(cart_id)
  or public.is_admin()
);


drop policy if exists "Customers can remove own cart items"
  on public.cart_items;

create policy "Customers can remove own cart items"
on public.cart_items
for delete
to authenticated
using (
  public.is_cart_owner(cart_id)
  or public.is_admin()
);


-- ============================================================
-- 19. VIEW ACCESS
-- ============================================================

grant select on public.cart_item_details
to authenticated;

grant select on public.cart_business_totals
to authenticated;


-- ============================================================
-- 20. FUNCTION ACCESS
-- ============================================================

revoke all
on function public.get_or_create_active_cart()
from public;

grant execute
on function public.get_or_create_active_cart()
to authenticated;


revoke all
on function public.get_cart_subtotal(uuid)
from public;

grant execute
on function public.get_cart_subtotal(uuid)
to authenticated;


revoke all
on function public.validate_cart_for_checkout(uuid)
from public;

grant execute
on function public.validate_cart_for_checkout(uuid)
to authenticated;


revoke all
on function public.mark_cart_checked_out(uuid)
from public;

grant execute
on function public.mark_cart_checked_out(uuid)
to authenticated;


-- ============================================================
-- 21. TABLE GRANTS
-- ============================================================

grant select, insert, update, delete
on public.carts
to authenticated;

grant select, insert, update, delete
on public.cart_items
to authenticated;


-- ============================================================
-- 22. COMMENTS
-- ============================================================

comment on table public.carts is
'Customer shopping carts. One active cart per customer.';

comment on table public.cart_items is
'Products currently selected by a customer. Product price remains authoritative in products.price.';

comment on column public.cart_items.quantity is
'Requested quantity. Current stock is validated when added/updated and must be revalidated again at checkout.';

comment on function public.get_or_create_active_cart() is
'Returns the authenticated customer active cart or creates one if none exists.';

comment on function public.get_cart_subtotal(uuid) is
'Calculates cart subtotal dynamically from current authoritative product prices.';

comment on function public.validate_cart_for_checkout(uuid) is
'Performs authoritative final cart validation before checkout.';

comment on view public.cart_item_details is
'Frontend-friendly cart item information using authoritative product and business data.';

comment on view public.cart_business_totals is
'Groups cart items by business so checkout can create separate business orders.';


commit;
