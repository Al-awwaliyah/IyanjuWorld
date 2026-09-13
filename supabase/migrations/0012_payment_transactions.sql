-- ============================================================
-- IyanjuWorld
-- Migration: 0012_payment_transactions.sql
--
-- Purpose:
--   Secure payment-attempt and provider-transaction tracking
--   for marketplace orders.
--
-- Important:
--   This migration does NOT call Flutterwave.
--   It establishes the database payment boundary that the
--   Flutterwave Edge Functions will use later.
--
-- Financial rules:
--   - Expected amount comes from the authoritative order total.
--   - Customer cannot choose an arbitrary payment amount.
--   - Provider references are unique.
--   - The same provider transaction cannot pay an order twice.
--   - Payment verification is server-side.
--   - Payment status is not trusted from the frontend.
--   - Wallet funding remains a separate payment flow.
-- ============================================================

begin;


-- ============================================================
-- 1. PAYMENT PROVIDER
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'payment_provider'
  ) then

    create type public.payment_provider as enum (
      'flutterwave'
    );

  end if;
end
$$;


-- ============================================================
-- 2. PAYMENT METHOD
--
-- These are normalized internal values.
-- Flutterwave's actual method names can be stored separately
-- in provider_metadata.
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'payment_method'
  ) then

    create type public.payment_method as enum (
      'card',
      'bank_transfer',
      'bank_account',
      'ussd',
      'opay',
      'nqr',
      'enaira',
      'internet_banking',
      'other'
    );

  end if;
end
$$;


-- ============================================================
-- 3. PAYMENT STATUS
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'payment_transaction_status'
  ) then

    create type public.payment_transaction_status as enum (
      'created',
      'pending',
      'processing',
      'successful',
      'failed',
      'cancelled',
      'expired',
      'refunded',
      'partially_refunded'
    );

  end if;
end
$$;


-- ============================================================
-- 4. PAYMENT TRANSACTIONS
--
-- One order can have multiple payment attempts.
--
-- Example:
--
--   PAY-FLW-001 → failed
--   PAY-FLW-002 → successful
--
-- Only one successful payment is permitted for an order.
-- ============================================================

create table if not exists public.payment_transactions (

  id uuid primary key default gen_random_uuid(),

  payment_reference text not null unique,

  order_id uuid not null
    references public.orders(id)
    on delete restrict,

  customer_id uuid not null
    references public.profiles(id)
    on delete restrict,

  provider public.payment_provider not null
    default 'flutterwave',

  payment_method public.payment_method,

  status public.payment_transaction_status not null
    default 'created',

  currency text not null default 'NGN',

  -- The exact amount expected for this payment attempt.
  amount numeric(14,2) not null,

  -- Provider-side transaction identifier.
  provider_transaction_id text,

  -- Provider-side reference used during initialization.
  provider_reference text,

  -- Provider status received during verification/webhook.
  provider_status text,

  -- Provider response/reference information.
  provider_message text,

  -- Normalized payment channel returned by provider.
  provider_channel text,

  -- Provider-specific data.
  provider_metadata jsonb not null default '{}'::jsonb,

  -- Internal audit metadata.
  metadata jsonb not null default '{}'::jsonb,

  initiated_at timestamptz not null default now(),

  processing_started_at timestamptz,

  successful_at timestamptz,

  failed_at timestamptz,

  cancelled_at timestamptz,

  expired_at timestamptz,

  refunded_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint payment_transactions_currency_check
    check (currency = 'NGN'),

  constraint payment_transactions_amount_check
    check (amount > 0),

  constraint payment_transactions_reference_check
    check (length(trim(payment_reference)) >= 8),

  constraint payment_transactions_provider_reference_check
    check (
      provider_reference is null
      or length(trim(provider_reference)) > 0
    ),

  constraint payment_transactions_provider_id_check
    check (
      provider_transaction_id is null
      or length(trim(provider_transaction_id)) > 0
    )
);


-- ============================================================
-- 5. PAYMENT INDEXES
-- ============================================================

create index if not exists payment_transactions_order_id_idx
  on public.payment_transactions(order_id);

create index if not exists payment_transactions_customer_id_idx
  on public.payment_transactions(customer_id);

create index if not exists payment_transactions_status_idx
  on public.payment_transactions(status);

create index if not exists payment_transactions_provider_idx
  on public.payment_transactions(provider);

create index if not exists payment_transactions_provider_reference_idx
  on public.payment_transactions(provider_reference);

create index if not exists payment_transactions_provider_transaction_id_idx
  on public.payment_transactions(provider_transaction_id);

create index if not exists payment_transactions_created_at_idx
  on public.payment_transactions(created_at desc);


-- ============================================================
-- 6. PROVIDER REFERENCE UNIQUENESS
--
-- A provider reference must never be associated with two
-- different payment records.
-- ============================================================

create unique index if not exists
payment_transactions_provider_reference_unique_idx
on public.payment_transactions(provider, provider_reference)
where provider_reference is not null;


create unique index if not exists
payment_transactions_provider_transaction_unique_idx
on public.payment_transactions(provider, provider_transaction_id)
where provider_transaction_id is not null;


-- ============================================================
-- 7. ONLY ONE SUCCESSFUL PAYMENT PER ORDER
-- ============================================================

create unique index if not exists
payment_transactions_one_successful_order_idx
on public.payment_transactions(order_id)
where status = 'successful';


-- ============================================================
-- 8. UPDATED_AT
-- ============================================================

drop trigger if exists set_payment_transactions_updated_at
  on public.payment_transactions;

create trigger set_payment_transactions_updated_at
before update on public.payment_transactions
for each row
execute function public.set_updated_at();


-- ============================================================
-- 9. PAYMENT REFERENCE GENERATOR
-- ============================================================

create or replace function public.generate_payment_reference()
returns text
language plpgsql
volatile
as $$
declare
  v_reference text;
begin

  loop

    v_reference :=
      'PAY-FLW-'
      || upper(
        substr(
          encode(
            gen_random_bytes(8),
            'hex'
          ),
          1,
          12
        )
      );

    exit when not exists (
      select 1
      from public.payment_transactions
      where payment_reference = v_reference
    );

  end loop;

  return v_reference;

end;
$$;


-- ============================================================
-- 10. AUTOMATIC PAYMENT REFERENCE
-- ============================================================

create or replace function public.set_payment_reference()
returns trigger
language plpgsql
as $$
begin

  if new.payment_reference is null
     or trim(new.payment_reference) = '' then

    new.payment_reference :=
      public.generate_payment_reference();

  end if;

  return new;

end;
$$;


drop trigger if exists set_payment_reference_trigger
  on public.payment_transactions;

create trigger set_payment_reference_trigger
before insert
on public.payment_transactions
for each row
execute function public.set_payment_reference();


-- ============================================================
-- 11. PAYMENT CUSTOMER/ORDER VALIDATION
--
-- The payment must belong to the same customer as the order.
-- The amount must exactly match the current order total.
-- ============================================================

create or replace function public.validate_payment_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin

  select *
  into v_order
  from public.orders
  where id = new.order_id;

  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_ORDER_NOT_FOUND';

  end if;


  if new.customer_id <> v_order.customer_id then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_CUSTOMER_MISMATCH';

  end if;


  if new.currency <> v_order.currency then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_CURRENCY_MISMATCH';

  end if;


  if new.amount <> v_order.customer_total then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_AMOUNT_MISMATCH';

  end if;


  if v_order.payment_status in (
    'paid',
    'refunded'
  ) then

    raise exception using
      errcode = 'P0001',
      message = 'ORDER_ALREADY_PAID';

  end if;


  return new;

end;
$$;


drop trigger if exists validate_payment_transaction_trigger
  on public.payment_transactions;

create trigger validate_payment_transaction_trigger
before insert or update
on public.payment_transactions
for each row
execute function public.validate_payment_transaction();


-- ============================================================
-- 12. PAYMENT STATUS TRANSITION VALIDATION
--
-- Prevents arbitrary status jumps.
-- ============================================================

create or replace function public.validate_payment_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  -- No change.
  if new.status = old.status then
    return new;
  end if;


  -- ----------------------------------------------------------
  -- Successful is terminal except refund operations.
  -- ----------------------------------------------------------

  if old.status = 'successful'
     and new.status not in (
       'successful',
       'refunded',
       'partially_refunded'
     ) then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_STATUS_TRANSITION_NOT_ALLOWED';

  end if;


  -- ----------------------------------------------------------
  -- Refunded is terminal.
  -- ----------------------------------------------------------

  if old.status = 'refunded'
     and new.status <> 'refunded' then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_STATUS_TRANSITION_NOT_ALLOWED';

  end if;


  -- ----------------------------------------------------------
  -- Partially refunded can become fully refunded.
  -- ----------------------------------------------------------

  if old.status = 'partially_refunded'
     and new.status not in (
       'partially_refunded',
       'refunded'
     ) then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_STATUS_TRANSITION_NOT_ALLOWED';

  end if;


  -- ----------------------------------------------------------
  -- Failed/cancelled/expired attempts can be retried by
  -- creating a NEW payment transaction, but should not be
  -- silently changed back to pending.
  -- ----------------------------------------------------------

  if old.status in (
    'failed',
    'cancelled',
    'expired'
  )
  and new.status not in (
    old.status
  ) then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_STATUS_TRANSITION_NOT_ALLOWED';

  end if;


  return new;

end;
$$;


drop trigger if exists validate_payment_status_transition_trigger
  on public.payment_transactions;

create trigger validate_payment_status_transition_trigger
before update of status
on public.payment_transactions
for each row
execute function public.validate_payment_status_transition();


-- ============================================================
-- 13. PAYMENT TIMESTAMP MANAGEMENT
-- ============================================================

create or replace function public.set_payment_status_timestamps()
returns trigger
language plpgsql
as $$
begin

  if new.status = 'processing'
     and old.status <> 'processing' then

    new.processing_started_at := coalesce(
      new.processing_started_at,
      now()
    );

  end if;


  if new.status = 'successful'
     and old.status <> 'successful' then

    new.successful_at := coalesce(
      new.successful_at,
      now()
    );

  end if;


  if new.status = 'failed'
     and old.status <> 'failed' then

    new.failed_at := coalesce(
      new.failed_at,
      now()
    );

  end if;


  if new.status = 'cancelled'
     and old.status <> 'cancelled' then

    new.cancelled_at := coalesce(
      new.cancelled_at,
      now()
    );

  end if;


  if new.status = 'expired'
     and old.status <> 'expired' then

    new.expired_at := coalesce(
      new.expired_at,
      now()
    );

  end if;


  if new.status = 'refunded'
     and old.status <> 'refunded' then

    new.refunded_at := coalesce(
      new.refunded_at,
      now()
    );

  end if;


  return new;

end;
$$;


drop trigger if exists set_payment_status_timestamps_trigger
  on public.payment_transactions;

create trigger set_payment_status_timestamps_trigger
before update of status
on public.payment_transactions
for each row
execute function public.set_payment_status_timestamps();


-- ============================================================
-- 14. TRUSTED PAYMENT OPERATION FLAG
--
-- Payment verification/webhook functions will use this
-- transaction-local flag later.
-- ============================================================

create or replace function public.is_trusted_payment_operation()
returns boolean
language sql
stable
as $$
  select coalesce(
    current_setting(
      'app.trusted_payment_operation',
      true
    ),
    'false'
  ) = 'true';
$$;


-- ============================================================
-- 15. CREATE PAYMENT ATTEMPT
--
-- Customer-facing function.
--
-- The amount is NEVER supplied by the customer.
-- It is read from orders.customer_total.
-- ============================================================

create or replace function public.create_payment_transaction(
  p_order_id uuid,
  p_payment_method public.payment_method default null
)
returns public.payment_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_payment public.payment_transactions%rowtype;
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
      message = 'PAYMENT_ORDER_NOT_FOUND';

  end if;


  -- ----------------------------------------------------------
  -- Customer ownership.
  -- ----------------------------------------------------------

  if v_order.customer_id <> auth.uid() then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_ACCESS_DENIED';

  end if;


  -- ----------------------------------------------------------
  -- Order must be ready for payment.
  -- ----------------------------------------------------------

  if v_order.status <> 'pending_payment'
     or v_order.payment_status <> 'unpaid' then

    raise exception using
      errcode = 'P0001',
      message = 'ORDER_NOT_READY_FOR_PAYMENT';

  end if;


  -- ----------------------------------------------------------
  -- Delivery pricing must already be applied.
  --
  -- We do not initialize Flutterwave against a zero or stale
  -- delivery fee.
  -- ----------------------------------------------------------

  if v_order.delivery_pricing_snapshot is null then

    raise exception using
      errcode = 'P0001',
      message = 'DELIVERY_PRICING_REQUIRED';

  end if;


  if v_order.customer_total <= 0 then

    raise exception using
      errcode = 'P0001',
      message = 'INVALID_PAYMENT_AMOUNT';

  end if;


  -- ----------------------------------------------------------
  -- Return an existing active payment attempt if one exists.
  --
  -- This prevents duplicate initialization when a customer
  -- double-clicks Pay.
  -- ----------------------------------------------------------

  select *
  into v_payment
  from public.payment_transactions
  where order_id = p_order_id
    and status in (
      'created',
      'pending',
      'processing'
    )
  order by created_at desc
  limit 1;


  if found then
    return v_payment;
  end if;


  -- ----------------------------------------------------------
  -- Create a fresh payment attempt.
  -- ----------------------------------------------------------

  insert into public.payment_transactions (
    order_id,
    customer_id,
    provider,
    payment_method,
    status,
    currency,
    amount,
    metadata
  )
  values (
    p_order_id,
    auth.uid(),
    'flutterwave',
    p_payment_method,
    'created',
    v_order.currency,
    v_order.customer_total,
    jsonb_build_object(
      'order_reference',
      v_order.order_reference,
      'created_from',
      'customer_checkout'
    )
  )
  returning *
  into v_payment;


  return v_payment;

exception
  when unique_violation then

    select *
    into v_payment
    from public.payment_transactions
    where order_id = p_order_id
      and status in (
        'created',
        'pending',
        'processing'
      )
    order by created_at desc
    limit 1;


    if v_payment.id is not null then
      return v_payment;
    end if;


    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_CREATION_FAILED';

  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_CREATION_FAILED';

end;
$$;


-- ============================================================
-- 16. INTERNAL PAYMENT VERIFICATION
--
-- This function is intentionally NOT directly exposed as a
-- normal customer operation.
--
-- The Flutterwave webhook/verification Edge Function will use
-- it later.
--
-- It accepts only provider-confirmed information and performs
-- the final order transition.
-- ============================================================

create or replace function public.complete_payment_transaction(
  p_payment_id uuid,
  p_provider_transaction_id text,
  p_provider_reference text,
  p_provider_status text,
  p_provider_channel text default null,
  p_provider_message text default null,
  p_provider_metadata jsonb default '{}'::jsonb
)
returns public.payment_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payment_transactions%rowtype;
  v_order public.orders%rowtype;
begin

  -- ----------------------------------------------------------
  -- This function must only be used by trusted backend logic.
  -- ----------------------------------------------------------

  if not public.is_trusted_payment_operation() then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_VERIFICATION_NOT_ALLOWED';

  end if;


  -- ----------------------------------------------------------
  -- Lock payment.
  -- ----------------------------------------------------------

  select *
  into v_payment
  from public.payment_transactions
  where id = p_payment_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_NOT_FOUND';

  end if;


  -- ----------------------------------------------------------
  -- Lock order.
  -- ----------------------------------------------------------

  select *
  into v_order
  from public.orders
  where id = v_payment.order_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_ORDER_NOT_FOUND';

  end if;


  -- ----------------------------------------------------------
  -- Idempotency:
  --
  -- If this payment is already successful, return it rather
  -- than processing the transaction twice.
  -- ----------------------------------------------------------

  if v_payment.status = 'successful' then

    return v_payment;

  end if;


  -- ----------------------------------------------------------
  -- Provider transaction must be present.
  -- ----------------------------------------------------------

  if p_provider_transaction_id is null
     or trim(p_provider_transaction_id) = '' then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_PROVIDER_TRANSACTION_REQUIRED';

  end if;


  if p_provider_reference is null
     or trim(p_provider_reference) = '' then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_PROVIDER_REFERENCE_REQUIRED';

  end if;


  -- ----------------------------------------------------------
  -- Protect against the same provider transaction being used
  -- by another payment.
  -- ----------------------------------------------------------

  if exists (
    select 1
    from public.payment_transactions p
    where p.provider = v_payment.provider
      and p.provider_transaction_id =
        trim(p_provider_transaction_id)
      and p.id <> v_payment.id
  ) then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_PROVIDER_TRANSACTION_ALREADY_USED';

  end if;


  if exists (
    select 1
    from public.payment_transactions p
    where p.provider = v_payment.provider
      and p.provider_reference =
        trim(p_provider_reference)
      and p.id <> v_payment.id
  ) then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_PROVIDER_REFERENCE_ALREADY_USED';

  end if;


  -- ----------------------------------------------------------
  -- Update provider information.
  -- ----------------------------------------------------------

  update public.payment_transactions
  set
    provider_transaction_id =
      trim(p_provider_transaction_id),

    provider_reference =
      trim(p_provider_reference),

    provider_status =
      nullif(trim(coalesce(p_provider_status, '')), ''),

    provider_channel =
      nullif(trim(coalesce(p_provider_channel, '')), ''),

    provider_message =
      nullif(trim(coalesce(p_provider_message, '')), ''),

    provider_metadata =
      coalesce(p_provider_metadata, '{}'::jsonb),

    status = 'successful'

  where id = p_payment_id

  returning *
  into v_payment;


  -- ----------------------------------------------------------
  -- Mark order paid.
  --
  -- Payment verification is the ONLY path that should make an
  -- order paid.
  -- ----------------------------------------------------------

  update public.orders
  set
    payment_status = 'paid',
    status = 'paid'
  where id = v_order.id
    and payment_status = 'unpaid';


  if not found then

    -- Another trusted process may already have marked the order
    -- paid. Do not create another successful payment.
    if exists (
      select 1
      from public.orders
      where id = v_order.id
        and payment_status = 'paid'
    ) then

      return v_payment;

    end if;


    raise exception using
      errcode = 'P0001',
      message = 'ORDER_PAYMENT_UPDATE_FAILED';

  end if;


  return v_payment;


exception
  when unique_violation then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_ALREADY_PROCESSED';

  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_VERIFICATION_FAILED';

end;
$$;


-- ============================================================
-- 17. MARK PAYMENT FAILED
--
-- Trusted backend only.
-- ============================================================

create or replace function public.fail_payment_transaction(
  p_payment_id uuid,
  p_provider_status text default null,
  p_provider_message text default null,
  p_provider_metadata jsonb default '{}'::jsonb
)
returns public.payment_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payment_transactions%rowtype;
begin

  if not public.is_trusted_payment_operation() then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_UPDATE_NOT_ALLOWED';

  end if;


  select *
  into v_payment
  from public.payment_transactions
  where id = p_payment_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_NOT_FOUND';

  end if;


  if v_payment.status = 'successful' then
    return v_payment;
  end if;


  update public.payment_transactions
  set
    status = 'failed',

    provider_status =
      nullif(trim(coalesce(p_provider_status, '')), ''),

    provider_message =
      nullif(trim(coalesce(p_provider_message, '')), ''),

    provider_metadata =
      coalesce(p_provider_metadata, '{}'::jsonb)

  where id = p_payment_id

  returning *
  into v_payment;


  return v_payment;

exception
  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_UPDATE_FAILED';

end;
$$;


-- ============================================================
-- 18. RLS
--
-- Customers can view their own payment attempts.
-- They cannot directly insert/update/delete them.
-- Admins can view/manage payment records.
--
-- Creation is through create_payment_transaction().
-- Successful verification is through trusted backend logic.
-- ============================================================

alter table public.payment_transactions enable row level security;


drop policy if exists "Customers can view own payment transactions"
  on public.payment_transactions;

create policy "Customers can view own payment transactions"
on public.payment_transactions
for select
to authenticated
using (
  customer_id = auth.uid()
  or public.is_admin()
);


drop policy if exists "Admins can insert payment transactions"
  on public.payment_transactions;

create policy "Admins can insert payment transactions"
on public.payment_transactions
for insert
to authenticated
with check (
  public.is_admin()
);


drop policy if exists "Admins can update payment transactions"
  on public.payment_transactions;

create policy "Admins can update payment transactions"
on public.payment_transactions
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


drop policy if exists "Admins can delete payment transactions"
  on public.payment_transactions;

create policy "Admins can delete payment transactions"
on public.payment_transactions
for delete
to authenticated
using (
  public.is_admin()
);


-- ============================================================
-- 19. FUNCTION PERMISSIONS
-- ============================================================

revoke all
on function public.create_payment_transaction(
  uuid,
  public.payment_method
)
from public;

grant execute
on function public.create_payment_transaction(
  uuid,
  public.payment_method
)
to authenticated;


revoke all
on function public.complete_payment_transaction(
  uuid,
  text,
  text,
  text,
  text,
  text,
  jsonb
)
from public;


revoke all
on function public.fail_payment_transaction(
  uuid,
  text,
  text,
  jsonb
)
from public;


-- ============================================================
-- 20. TABLE GRANTS
-- ============================================================

grant select
on public.payment_transactions
to authenticated;


-- ============================================================
-- 21. COMMENTS
-- ============================================================

comment on table public.payment_transactions is
'Marketplace order payment attempts and provider transaction records. Wallet funding is intentionally handled separately.';

comment on column public.payment_transactions.amount is
'Authoritative payment amount copied from orders.customer_total at payment creation.';

comment on column public.payment_transactions.provider_transaction_id is
'Unique provider-side transaction identifier returned by Flutterwave.';

comment on column public.payment_transactions.provider_reference is
'Provider-side payment/reference identifier used for idempotency and reconciliation.';

comment on column public.payment_transactions.provider_metadata is
'Raw provider information retained for server-side reconciliation and audit.';

comment on function public.create_payment_transaction(uuid, public.payment_method) is
'Creates a customer payment attempt using the authoritative order customer_total.';

comment on function public.complete_payment_transaction(uuid, text, text, text, text, text, jsonb) is
'Trusted backend operation that records verified provider payment and marks the order paid.';


commit;
