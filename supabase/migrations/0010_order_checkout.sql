-- ============================================================
-- IyanjuWorld
-- Migration: 0010_order_checkout.sql
--
-- Purpose:
--   Securely convert a customer's active cart into one or more
--   orders, split by business.
--
-- Important financial rules:
--   - Product prices come from products.price.
--   - Platform fee comes from platform_settings.
--   - Customer platform fee = 0.
--   - Business pays the platform fee.
--   - Delivery fee is NOT accepted as a trusted customer value.
--   - Delivery pricing will be calculated by the delivery layer.
--
-- Important checkout rules:
--   - Customer must own the cart.
--   - Cart must be active.
--   - Cart cannot be empty.
--   - Every product is revalidated.
--   - Current price is read directly from products.
--   - Stock is checked atomically.
--   - One order is created per business.
--   - Product details are snapshotted into order_items.
--   - Cart becomes checked_out only after all orders succeed.
--   - No partial checkout is allowed.
-- ============================================================

begin;


-- ============================================================
-- 1. CHECKOUT ERROR HELPER
--
-- These application error codes are intentionally stable and
-- do not expose PostgreSQL table/constraint information.
-- ============================================================

create or replace function public.checkout_error(
  p_code text
)
returns void
language plpgsql
immutable
as $$
begin
  raise exception using
    errcode = 'P0001',
    message = p_code;
end;
$$;


-- ============================================================
-- 2. DELIVERY ADDRESS VALIDATION
--
-- Checkout stores a snapshot of the delivery information.
--
-- Required:
--   address_line
--   city
--   state
--
-- Optional:
--   postal_code
--   landmark
--   latitude
--   longitude
--
-- The customer may supply the destination address, but NOT
-- the delivery fee.
-- ============================================================

create or replace function public.validate_checkout_address(
  p_delivery_address jsonb
)
returns void
language plpgsql
immutable
as $$
declare
  v_address_line text;
  v_city text;
  v_state text;
begin
  if p_delivery_address is null
     or jsonb_typeof(p_delivery_address) <> 'object' then
    perform public.checkout_error(
      'CHECKOUT_DELIVERY_ADDRESS_REQUIRED'
    );
  end if;

  v_address_line := trim(
    coalesce(
      p_delivery_address->>'address_line',
      ''
    )
  );

  v_city := trim(
    coalesce(
      p_delivery_address->>'city',
      ''
    )
  );

  v_state := trim(
    coalesce(
      p_delivery_address->>'state',
      ''
    )
  );

  if v_address_line = '' then
    perform public.checkout_error(
      'CHECKOUT_ADDRESS_LINE_REQUIRED'
    );
  end if;

  if v_city = '' then
    perform public.checkout_error(
      'CHECKOUT_CITY_REQUIRED'
    );
  end if;

  if v_state = '' then
    perform public.checkout_error(
      'CHECKOUT_STATE_REQUIRED'
    );
  end if;

  if length(v_address_line) > 500 then
    perform public.checkout_error(
      'CHECKOUT_ADDRESS_TOO_LONG'
    );
  end if;

  if length(v_city) > 100 then
    perform public.checkout_error(
      'CHECKOUT_CITY_TOO_LONG'
    );
  end if;

  if length(v_state) > 100 then
    perform public.checkout_error(
      'CHECKOUT_STATE_TOO_LONG'
    );
  end if;
end;
$$;


-- ============================================================
-- 3. CHECKOUT RESULT TYPE
--
-- One checkout can create multiple orders because a cart can
-- contain products from multiple businesses.
-- ============================================================

drop type if exists public.checkout_order_result cascade;

create type public.checkout_order_result as (
  order_id uuid,
  order_reference text,
  business_id uuid,
  subtotal numeric(14,2),
  delivery_fee numeric(14,2),
  platform_fee numeric(14,2),
  customer_total numeric(14,2),
  business_net_amount numeric(14,2)
);


-- ============================================================
-- 4. SECURE CHECKOUT FUNCTION
--
-- This function is the authoritative cart -> order boundary.
--
-- Delivery fee is intentionally initialized to 0 here.
-- A later delivery-pricing step will calculate the actual
-- customer delivery fee and update the order before payment.
--
-- This prevents a customer from submitting:
--
--   "delivery_fee": 1
--
-- and bypassing platform-controlled delivery pricing.
-- ============================================================

create or replace function public.checkout_cart(
  p_cart_id uuid,
  p_delivery_address jsonb,
  p_customer_note text default null
)
returns setof public.checkout_order_result
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart public.carts%rowtype;
  v_platform_fee_rate numeric(7,4);

  v_business_id uuid;
  v_business_name text;

  v_subtotal numeric(14,2);
  v_delivery_fee numeric(14,2);
  v_platform_fee numeric(14,2);
  v_customer_total numeric(14,2);
  v_business_net_amount numeric(14,2);

  v_order public.orders%rowtype;

  v_item record;
  v_business record;

  v_created_order_count integer := 0;
  v_remaining_stock integer;

  v_address_line text;
  v_city text;
  v_state text;
  v_country text;
  v_postal_code text;
  v_landmark text;

  v_latitude numeric(10,7);
  v_longitude numeric(10,7);

  v_customer_note text;
begin

  -- ----------------------------------------------------------
  -- Authentication
  -- ----------------------------------------------------------

  if auth.uid() is null then
    perform public.checkout_error(
      'AUTHENTICATION_REQUIRED'
    );
  end if;


  -- ----------------------------------------------------------
  -- Validate customer account
  -- ----------------------------------------------------------

  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'customer'
      and p.is_active = true
  ) then
    perform public.checkout_error(
      'CUSTOMER_ACCOUNT_REQUIRED'
    );
  end if;


  -- ----------------------------------------------------------
  -- Validate delivery address
  -- ----------------------------------------------------------

  perform public.validate_checkout_address(
    p_delivery_address
  );


  -- ----------------------------------------------------------
  -- Validate customer note
  -- ----------------------------------------------------------

  v_customer_note := nullif(
    trim(coalesce(p_customer_note, '')),
    ''
  );

  if v_customer_note is not null
     and length(v_customer_note) > 1000 then
    perform public.checkout_error(
      'CHECKOUT_NOTE_TOO_LONG'
    );
  end if;


  -- ----------------------------------------------------------
  -- Extract delivery address snapshot
  -- ----------------------------------------------------------

  v_address_line := trim(
    p_delivery_address->>'address_line'
  );

  v_city := trim(
    p_delivery_address->>'city'
  );

  v_state := trim(
    p_delivery_address->>'state'
  );

  v_country := trim(
    coalesce(
      p_delivery_address->>'country',
      'Nigeria'
    )
  );

  v_postal_code := nullif(
    trim(
      coalesce(
        p_delivery_address->>'postal_code',
        ''
      )
    ),
    ''
  );

  v_landmark := nullif(
    trim(
      coalesce(
        p_delivery_address->>'landmark',
        ''
      )
    ),
    ''
  );


  -- ----------------------------------------------------------
  -- Optional coordinates
  -- ----------------------------------------------------------

  begin
    if p_delivery_address ? 'latitude' then
      v_latitude := (
        p_delivery_address->>'latitude'
      )::numeric;
    end if;

    if p_delivery_address ? 'longitude' then
      v_longitude := (
        p_delivery_address->>'longitude'
      )::numeric;
    end if;
  exception
    when invalid_text_representation
      or numeric_value_out_of_range then

      perform public.checkout_error(
        'CHECKOUT_INVALID_LOCATION'
      );
  end;


  if v_latitude is not null
     and (
       v_latitude < -90
       or v_latitude > 90
     ) then
    perform public.checkout_error(
      'CHECKOUT_INVALID_LOCATION'
    );
  end if;


  if v_longitude is not null
     and (
       v_longitude < -180
       or v_longitude > 180
     ) then
    perform public.checkout_error(
      'CHECKOUT_INVALID_LOCATION'
    );
  end if;


  -- ----------------------------------------------------------
  -- Lock the cart.
  --
  -- This prevents two simultaneous checkout requests from
  -- processing the same cart at the same time.
  -- ----------------------------------------------------------

  select *
  into v_cart
  from public.carts
  where id = p_cart_id
  for update;

  if not found then
    perform public.checkout_error(
      'CART_NOT_FOUND'
    );
  end if;


  -- ----------------------------------------------------------
  -- Verify cart ownership.
  -- ----------------------------------------------------------

  if v_cart.customer_id <> auth.uid() then
    perform public.checkout_error(
      'CART_ACCESS_DENIED'
    );
  end if;


  -- ----------------------------------------------------------
  -- Cart must still be active.
  -- ----------------------------------------------------------

  if v_cart.status <> 'active' then
    perform public.checkout_error(
      'CART_NOT_ACTIVE'
    );
  end if;


  -- ----------------------------------------------------------
  -- Cart must contain at least one item.
  -- ----------------------------------------------------------

  if not exists (
    select 1
    from public.cart_items ci
    where ci.cart_id = p_cart_id
  ) then
    perform public.checkout_error(
      'CART_IS_EMPTY'
    );
  end if;


  -- ----------------------------------------------------------
  -- Get the current platform fee.
  --
  -- The historical fee snapshot is ultimately stored on each
  -- order by the existing order trigger.
  -- ----------------------------------------------------------

  v_platform_fee_rate :=
    public.get_platform_fee_rate();


  -- ----------------------------------------------------------
  -- Revalidate every product while locking the product row.
  --
  -- FOR UPDATE prevents another checkout transaction from
  -- simultaneously consuming the same stock.
  -- ----------------------------------------------------------

  for v_item in
    select
      ci.id as cart_item_id,
      ci.product_id,
      ci.quantity,

      p.business_id,
      p.name as product_name,
      p.slug as product_slug,
      p.sku,
      p.price,
      p.stock_quantity,
      p.status as product_status,
      p.is_available,
      p.compare_at_price,

      b.name as business_name,
      b.status as business_status,

      c.is_active as category_active

    from public.cart_items ci

    join public.products p
      on p.id = ci.product_id

    join public.businesses b
      on b.id = p.business_id

    left join public.categories c
      on c.id = p.category_id

    where ci.cart_id = p_cart_id

    order by
      p.business_id,
      ci.id

    for update of p
  loop

    -- --------------------------------------------------------
    -- Product status
    -- --------------------------------------------------------

    if v_item.product_status <> 'active'
       or not v_item.is_available then

      perform public.checkout_error(
        'CHECKOUT_PRODUCT_UNAVAILABLE'
      );

    end if;


    -- --------------------------------------------------------
    -- Business status
    -- --------------------------------------------------------

    if v_item.business_status <> 'active' then

      perform public.checkout_error(
        'CHECKOUT_BUSINESS_UNAVAILABLE'
      );

    end if;


    -- --------------------------------------------------------
    -- Category status
    -- --------------------------------------------------------

    if v_item.category_active is distinct from true then

      perform public.checkout_error(
        'CHECKOUT_CATEGORY_UNAVAILABLE'
      );

    end if;


    -- --------------------------------------------------------
    -- Price validation
    -- --------------------------------------------------------

    if v_item.price <= 0 then

      perform public.checkout_error(
        'CHECKOUT_INVALID_PRODUCT_PRICE'
      );

    end if;


    -- --------------------------------------------------------
    -- Stock validation
    -- --------------------------------------------------------

    if v_item.stock_quantity < v_item.quantity then

      perform public.checkout_error(
        'CHECKOUT_INSUFFICIENT_STOCK'
      );

    end if;


    -- --------------------------------------------------------
    -- Quantity validation
    -- --------------------------------------------------------

    if v_item.quantity <= 0 then

      perform public.checkout_error(
        'CHECKOUT_INVALID_QUANTITY'
      );

    end if;

  end loop;


  -- ==========================================================
  -- CREATE ONE ORDER PER BUSINESS
  -- ==========================================================

  for v_business in
    select
      p.business_id,
      b.name as business_name
    from public.cart_items ci
    join public.products p
      on p.id = ci.product_id
    join public.businesses b
      on b.id = p.business_id
    where ci.cart_id = p_cart_id
    group by
      p.business_id,
      b.name
    order by p.business_id
  loop

    v_business_id := v_business.business_id;
    v_business_name := v_business.business_name;


    -- --------------------------------------------------------
    -- Calculate authoritative subtotal.
    --
    -- IMPORTANT:
    -- This uses products.price, never a frontend-submitted
    -- cart price.
    -- --------------------------------------------------------

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
    where ci.cart_id = p_cart_id
      and p.business_id = v_business_id;


    if v_subtotal <= 0 then

      perform public.checkout_error(
        'CHECKOUT_INVALID_SUBTOTAL'
      );

    end if;


    -- --------------------------------------------------------
    -- Delivery fee is intentionally zero at this stage.
    --
    -- A dedicated delivery-pricing function will calculate the
    -- actual customer delivery charge before payment.
    -- --------------------------------------------------------

    v_delivery_fee := 0;


    -- --------------------------------------------------------
    -- Platform fee:
    --
    -- Business pays the platform fee.
    -- Customer does NOT pay it.
    -- --------------------------------------------------------

    v_platform_fee := round(
      v_subtotal
      * v_platform_fee_rate
      / 100,
      2
    );


    -- --------------------------------------------------------
    -- Customer total:
    --
    -- subtotal + delivery only.
    -- Platform fee is NOT added.
    -- --------------------------------------------------------

    v_customer_total := round(
      v_subtotal + v_delivery_fee,
      2
    );


    -- --------------------------------------------------------
    -- Business net:
    --
    -- subtotal - platform fee.
    -- Delivery is not business revenue.
    -- --------------------------------------------------------

    v_business_net_amount := round(
      v_subtotal - v_platform_fee,
      2
    );


    if v_business_net_amount < 0 then

      perform public.checkout_error(
        'CHECKOUT_INVALID_BUSINESS_TOTAL'
      );

    end if;


    -- --------------------------------------------------------
    -- Create order.
    --
    -- The existing order trigger will also establish the
    -- historical platform_fee_rate snapshot.
    -- --------------------------------------------------------

    insert into public.orders (
      customer_id,
      business_id,
      status,
      payment_status,
      currency,

      subtotal,
      delivery_fee,

      platform_fee,
      customer_total,
      business_net_amount,

      delivery_address_line,
      delivery_city,
      delivery_state,
      delivery_country,
      delivery_postal_code,
      delivery_landmark,

      delivery_latitude,
      delivery_longitude,

      customer_note
    )
    values (
      auth.uid(),
      v_business_id,

      'pending_payment',
      'unpaid',
      'NGN',

      v_subtotal,
      v_delivery_fee,

      v_platform_fee,
      v_customer_total,
      v_business_net_amount,

      v_address_line,
      v_city,
      v_state,
      v_country,
      v_postal_code,
      v_landmark,

      v_latitude,
      v_longitude,

      v_customer_note
    )
    returning *
    into v_order;


    -- --------------------------------------------------------
    -- Create authoritative order-item snapshots.
    -- --------------------------------------------------------

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      sku,
      image_url,
      quantity,
      unit_price,
      line_total,
      metadata
    )
    select
      v_order.id,
      p.id,

      p.name,
      p.sku,

      (
        select pi.storage_path
        from public.product_images pi
        where pi.product_id = p.id
          and pi.is_primary = true
        order by pi.sort_order asc, pi.created_at asc
        limit 1
      ),

      ci.quantity,
      p.price,

      round(
        p.price * ci.quantity,
        2
      ),

      jsonb_build_object(
        'business_id', p.business_id,
        'business_name', v_business_name,
        'cart_item_id', ci.id,
        'price_source', 'products.price'
      )

    from public.cart_items ci

    join public.products p
      on p.id = ci.product_id

    where ci.cart_id = p_cart_id
      and p.business_id = v_business_id;


    -- --------------------------------------------------------
    -- Make sure the order actually received items.
    -- --------------------------------------------------------

    if not exists (
      select 1
      from public.order_items oi
      where oi.order_id = v_order.id
    ) then

      perform public.checkout_error(
        'CHECKOUT_ORDER_ITEMS_FAILED'
      );

    end if;


    -- --------------------------------------------------------
    -- Atomically decrement stock.
    --
    -- Product rows were locked above.
    -- The additional condition protects against unexpected
    -- stock changes.
    -- --------------------------------------------------------

    for v_item in
      select
        ci.product_id,
        ci.quantity
      from public.cart_items ci
      join public.products p
        on p.id = ci.product_id
      where ci.cart_id = p_cart_id
        and p.business_id = v_business_id
    loop

      update public.products
      set
        stock_quantity = stock_quantity - v_item.quantity,

        status = case
          when stock_quantity - v_item.quantity <= 0
            then 'out_of_stock'::public.product_status
          else status
        end,

        is_available = case
          when stock_quantity - v_item.quantity <= 0
            then false
          else is_available
        end

      where id = v_item.product_id
        and stock_quantity >= v_item.quantity;

      if not found then

        perform public.checkout_error(
          'CHECKOUT_STOCK_CHANGED'
        );

      end if;

    end loop;


    -- --------------------------------------------------------
    -- Return checkout result.
    -- --------------------------------------------------------

    v_created_order_count :=
      v_created_order_count + 1;

    return next (
      v_order.id,
      v_order.order_reference,
      v_order.business_id,
      v_order.subtotal,
      v_order.delivery_fee,
      v_order.platform_fee,
      v_order.customer_total,
      v_order.business_net_amount
    )::public.checkout_order_result;

  end loop;


  -- ==========================================================
  -- ALL ORDERS CREATED SUCCESSFULLY
  --
  -- Only now do we close the cart.
  -- If anything above fails, PostgreSQL rolls the entire
  -- transaction back automatically.
  -- ==========================================================

  if v_created_order_count <= 0 then

    perform public.checkout_error(
      'CHECKOUT_NO_ORDERS_CREATED'
    );

  end if;


  update public.carts
  set status = 'checked_out'
  where id = p_cart_id
    and status = 'active';


  if not found then

    perform public.checkout_error(
      'CHECKOUT_CART_FINALIZATION_FAILED'
    );

  end if;

end;
$$;


-- ============================================================
-- 5. FUNCTION PERMISSIONS
-- ============================================================

revoke all
on function public.checkout_cart(
  uuid,
  jsonb,
  text
)
from public;

grant execute
on function public.checkout_cart(
  uuid,
  jsonb,
  text
)
to authenticated;


revoke all
on function public.validate_checkout_address(
  jsonb
)
from public;


-- ============================================================
-- 6. PREVENT DIRECT CUSTOMER FINANCIAL MANIPULATION
--
-- Customers should not be able to manually create or alter
-- financial order fields and bypass checkout.
--
-- The existing order RLS currently allows customer INSERT.
-- This trigger makes direct customer-created orders unusable
-- for checkout because the financial snapshot must be produced
-- by the trusted checkout function.
--
-- Admins remain able to manage orders.
-- ============================================================

create or replace function public.protect_order_creation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if public.is_admin() then
    return new;
  end if;


  if auth.uid() is null then
    raise exception using
      errcode = 'P0001',
      message = 'AUTHENTICATION_REQUIRED';
  end if;


  if new.customer_id <> auth.uid() then
    raise exception using
      errcode = 'P0001',
      message = 'ORDER_CUSTOMER_ACCESS_DENIED';
  end if;


  -- Customer-created orders must begin as unpaid/pending.
  if new.status <> 'pending_payment' then
    raise exception using
      errcode = 'P0001',
      message = 'ORDER_STATUS_NOT_ALLOWED';
  end if;


  if new.payment_status <> 'unpaid' then
    raise exception using
      errcode = 'P0001',
      message = 'ORDER_PAYMENT_STATUS_NOT_ALLOWED';
  end if;


  return new;
end;
$$;


drop trigger if exists protect_order_creation_trigger
  on public.orders;

create trigger protect_order_creation_trigger
before insert
on public.orders
for each row
execute function public.protect_order_creation();


-- ============================================================
-- 7. PROTECT CUSTOMER ORDER FINANCIAL FIELDS
--
-- Once an order has been created, a normal customer request
-- cannot alter:
--
--   subtotal
--   delivery_fee
--   platform_fee
--   platform_fee_rate
--   customer_total
--   business_net_amount
--   refunded_amount
--
-- Admin/backend workflows can update them when appropriate.
-- ============================================================

create or replace function public.protect_customer_order_financials()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if public.is_admin() then
    return new;
  end if;


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


drop trigger if exists protect_customer_order_financials_trigger
  on public.orders;

create trigger protect_customer_order_financials_trigger
before update
on public.orders
for each row
execute function public.protect_customer_order_financials();


-- ============================================================
-- 8. PROTECT ORDER ITEM FINANCIAL SNAPSHOTS
--
-- Customers/business users must not alter historical item
-- prices after checkout.
-- ============================================================

create or replace function public.protect_order_item_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if public.is_admin() then
    return new;
  end if;


  if new.product_name is distinct from old.product_name
     or new.sku is distinct from old.sku
     or new.quantity is distinct from old.quantity
     or new.unit_price is distinct from old.unit_price
     or new.line_total is distinct from old.line_total then

    raise exception using
      errcode = 'P0001',
      message = 'ORDER_ITEM_SNAPSHOT_UPDATE_NOT_ALLOWED';

  end if;


  return new;
end;
$$;


drop trigger if exists protect_order_item_snapshot_trigger
  on public.order_items;

create trigger protect_order_item_snapshot_trigger
before update
on public.order_items
for each row
execute function public.protect_order_item_snapshot();


-- ============================================================
-- 9. COMMENTS
-- ============================================================

comment on function public.checkout_cart(
  uuid,
  jsonb,
  text
) is
'Securely converts an active customer cart into one or more business orders using authoritative product prices and atomic stock validation.';

comment on function public.validate_checkout_address(
  jsonb
) is
'Validates the customer delivery address supplied during checkout.';

comment on type public.checkout_order_result is
'Result returned for each business order created during a multi-business checkout.';


commit;
