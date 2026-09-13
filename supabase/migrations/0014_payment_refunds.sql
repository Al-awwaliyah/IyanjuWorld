-- ============================================================
-- IyanjuWorld
-- Migration: 0014_payment_refunds.sql
--
-- Purpose:
--   Secure refund records and refund lifecycle for marketplace
--   orders and their payment transactions.
--
-- Rules:
--   - Refunds are server-controlled.
--   - Customer cannot create or approve refunds directly.
--   - Full + partial refunds are supported.
--   - Total refunded amount can never exceed amount paid.
--   - Every refund receives a unique reference.
--   - Refund processing is idempotent.
--   - Customer refunds can be credited to the customer wallet.
--   - Flutterwave refunds can be tracked separately.
--   - Order/payment refund statuses remain synchronized.
-- ============================================================

begin;


-- ============================================================
-- 1. REFUND STATUS
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'refund_status'
  ) then

    create type public.refund_status as enum (
      'requested',
      'approved',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'reversed'
    );

  end if;
end
$$;


-- ============================================================
-- 2. REFUND DESTINATION
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'refund_destination'
  ) then

    create type public.refund_destination as enum (
      'wallet',
      'flutterwave'
    );

  end if;
end
$$;


-- ============================================================
-- 3. REFUNDS
--
-- One payment transaction may have multiple partial refunds.
--
-- Example:
--
-- Payment:      ₦50,000
-- Refund #1:    ₦10,000
-- Refund #2:    ₦15,000
-- Remaining:    ₦25,000
-- ============================================================

create table if not exists public.refunds (

  id uuid primary key default gen_random_uuid(),

  refund_reference text not null unique,

  order_id uuid not null
    references public.orders(id)
    on delete restrict,

  payment_transaction_id uuid not null
    references public.payment_transactions(id)
    on delete restrict,

  customer_id uuid not null
    references public.profiles(id)
    on delete restrict,

  status public.refund_status not null
    default 'requested',

  destination public.refund_destination not null
    default 'wallet',

  currency text not null default 'NGN',

  -- Amount being refunded by this refund record.
  amount numeric(14,2) not null,

  -- Amount originally paid for the associated payment.
  payment_amount numeric(14,2) not null,

  -- Amount already refunded before this refund.
  previously_refunded_amount numeric(14,2)
    not null default 0,

  -- Remaining refundable amount at creation time.
  remaining_refundable_amount numeric(14,2)
    not null default 0,

  -- Provider-side refund identifiers.
  provider_refund_id text,

  provider_reference text,

  provider_status text,

  provider_message text,

  -- Wallet transaction created for wallet refunds.
  wallet_transaction_id uuid,

  -- Safe refund reason.
  reason text,

  -- Internal/admin metadata.
  metadata jsonb not null default '{}'::jsonb,

  -- Sanitized provider information.
  provider_metadata jsonb not null default '{}'::jsonb,

  requested_by uuid
    references public.profiles(id)
    on delete set null,

  approved_by uuid
    references public.profiles(id)
    on delete set null,

  processed_by uuid
    references public.profiles(id)
    on delete set null,

  requested_at timestamptz not null default now(),

  approved_at timestamptz,

  processing_started_at timestamptz,

  completed_at timestamptz,

  failed_at timestamptz,

  cancelled_at timestamptz,

  reversed_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint refunds_currency_check
    check (currency = 'NGN'),

  constraint refunds_amount_check
    check (amount > 0),

  constraint refunds_payment_amount_check
    check (payment_amount > 0),

  constraint refunds_previously_refunded_check
    check (previously_refunded_amount >= 0),

  constraint refunds_remaining_refundable_check
    check (remaining_refundable_amount >= 0),

  constraint refunds_amount_limit_check
    check (amount <= remaining_refundable_amount),

  constraint refunds_reference_check
    check (length(trim(refund_reference)) >= 8),

  constraint refunds_provider_refund_id_check
    check (
      provider_refund_id is null
      or length(trim(provider_refund_id)) > 0
    )
);


-- ============================================================
-- 4. REFUND INDEXES
-- ============================================================

create index if not exists refunds_order_id_idx
  on public.refunds(order_id);

create index if not exists refunds_payment_transaction_id_idx
  on public.refunds(payment_transaction_id);

create index if not exists refunds_customer_id_idx
  on public.refunds(customer_id);

create index if not exists refunds_status_idx
  on public.refunds(status);

create index if not exists refunds_destination_idx
  on public.refunds(destination);

create index if not exists refunds_created_at_idx
  on public.refunds(created_at desc);


-- ============================================================
-- 5. PROVIDER REFUND UNIQUENESS
-- ============================================================

create unique index if not exists
refunds_provider_refund_unique_idx
on public.refunds(
  destination,
  provider_refund_id
)
where provider_refund_id is not null;


create unique index if not exists
refunds_provider_reference_unique_idx
on public.refunds(
  destination,
  provider_reference
)
where provider_reference is not null;


-- ============================================================
-- 6. WALLET TRANSACTION LINK
-- ============================================================
--
-- A wallet refund must point to exactly one wallet transaction.
--

create unique index if not exists
refunds_wallet_transaction_unique_idx
on public.refunds(wallet_transaction_id)
where wallet_transaction_id is not null;


-- ============================================================
-- 7. UPDATED_AT
-- ============================================================

drop trigger if exists set_refunds_updated_at
on public.refunds;

create trigger set_refunds_updated_at
before update
on public.refunds
for each row
execute function public.set_updated_at();


-- ============================================================
-- 8. REFUND REFERENCE GENERATOR
-- ============================================================

create or replace function public.generate_refund_reference()
returns text
language plpgsql
volatile
as $$
declare
  v_reference text;
begin

  loop

    v_reference :=
      'REFUND-FLW-'
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
      from public.refunds
      where refund_reference = v_reference
    );

  end loop;

  return v_reference;

end;
$$;


-- ============================================================
-- 9. AUTOMATIC REFUND REFERENCE
-- ============================================================

create or replace function public.set_refund_reference()
returns trigger
language plpgsql
as $$
begin

  if new.refund_reference is null
     or trim(new.refund_reference) = '' then

    new.refund_reference :=
      public.generate_refund_reference();

  end if;

  return new;

end;
$$;


drop trigger if exists set_refund_reference_trigger
on public.refunds;

create trigger set_refund_reference_trigger
before insert
on public.refunds
for each row
execute function public.set_refund_reference();


-- ============================================================
-- 10. REFUND STATUS TIMESTAMPS
-- ============================================================

create or replace function public.set_refund_status_timestamps()
returns trigger
language plpgsql
as $$
begin

  if new.status = 'approved'
     and old.status <> 'approved' then

    new.approved_at :=
      coalesce(new.approved_at, now());

  end if;


  if new.status = 'processing'
     and old.status <> 'processing' then

    new.processing_started_at :=
      coalesce(
        new.processing_started_at,
        now()
      );

  end if;


  if new.status = 'completed'
     and old.status <> 'completed' then

    new.completed_at :=
      coalesce(new.completed_at, now());

  end if;


  if new.status = 'failed'
     and old.status <> 'failed' then

    new.failed_at :=
      coalesce(new.failed_at, now());

  end if;


  if new.status = 'cancelled'
     and old.status <> 'cancelled' then

    new.cancelled_at :=
      coalesce(new.cancelled_at, now());

  end if;


  if new.status = 'reversed'
     and old.status <> 'reversed' then

    new.reversed_at :=
      coalesce(new.reversed_at, now());

  end if;


  return new;

end;
$$;


drop trigger if exists
set_refund_status_timestamps_trigger
on public.refunds;

create trigger
set_refund_status_timestamps_trigger
before update of status
on public.refunds
for each row
execute function public.set_refund_status_timestamps();


-- ============================================================
-- 11. REFUND STATUS TRANSITION PROTECTION
-- ============================================================

create or replace function public.validate_refund_status_transition()
returns trigger
language plpgsql
as $$
begin

  if new.status = old.status then
    return new;
  end if;


  -- Completed can only become reversed.
  if old.status = 'completed'
     and new.status <> 'reversed' then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_STATUS_TRANSITION_NOT_ALLOWED';

  end if;


  -- Reversed is terminal.
  if old.status = 'reversed'
     and new.status <> 'reversed' then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_STATUS_TRANSITION_NOT_ALLOWED';

  end if;


  -- Cancelled is terminal.
  if old.status = 'cancelled'
     and new.status <> 'cancelled' then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_STATUS_TRANSITION_NOT_ALLOWED';

  end if;


  return new;

end;
$$;


drop trigger if exists
validate_refund_status_transition_trigger
on public.refunds;

create trigger
validate_refund_status_transition_trigger
before update of status
on public.refunds
for each row
execute function public.validate_refund_status_transition();


-- ============================================================
-- 12. VALIDATE REFUND CREATION
--
-- Ensures:
--   - payment belongs to order
--   - payment belongs to customer
--   - payment was successful
--   - amount cannot exceed remaining refundable amount
-- ============================================================

create or replace function public.validate_refund_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payment_transactions%rowtype;
  v_order public.orders%rowtype;
  v_total_refunded numeric(14,2);
  v_remaining numeric(14,2);
begin

  select *
  into v_payment
  from public.payment_transactions
  where id = new.payment_transaction_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_PAYMENT_NOT_FOUND';

  end if;


  select *
  into v_order
  from public.orders
  where id = new.order_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_ORDER_NOT_FOUND';

  end if;


  if v_payment.order_id <> new.order_id then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_ORDER_PAYMENT_MISMATCH';

  end if;


  if v_payment.customer_id <> new.customer_id then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_CUSTOMER_MISMATCH';

  end if;


  if v_payment.status not in (
    'successful',
    'partially_refunded'
  ) then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_NOT_REFUNDABLE';

  end if;


  -- ----------------------------------------------------------
  -- Calculate completed refunds only.
  -- Failed/cancelled refund attempts do not consume the
  -- refundable amount.
  -- ----------------------------------------------------------

  select coalesce(
    sum(amount),
    0
  )
  into v_total_refunded
  from public.refunds
  where payment_transaction_id =
    new.payment_transaction_id
    and status = 'completed';


  v_remaining :=
    greatest(
      v_payment.amount - v_total_refunded,
      0
    );


  if new.amount > v_remaining then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_AMOUNT_EXCEEDS_REMAINING';

  end if;


  new.payment_amount := v_payment.amount;

  new.previously_refunded_amount :=
    v_total_refunded;

  new.remaining_refundable_amount :=
    v_remaining;


  return new;

end;
$$;


drop trigger if exists
validate_refund_record_trigger
on public.refunds;

create trigger
validate_refund_record_trigger
before insert
on public.refunds
for each row
execute function public.validate_refund_record();


-- ============================================================
-- 13. CREATE REFUND REQUEST
--
-- Backend/admin-controlled.
--
-- The amount is validated against the actual successful
-- payment, never against a frontend-supplied balance.
-- ============================================================

create or replace function public.create_refund_request(
  p_order_id uuid,
  p_payment_transaction_id uuid,
  p_amount numeric,
  p_destination public.refund_destination default 'wallet',
  p_reason text default null
)
returns public.refunds
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payment_transactions%rowtype;
  v_order public.orders%rowtype;
  v_total_refunded numeric(14,2);
  v_remaining numeric(14,2);
  v_refund public.refunds%rowtype;
begin

  if not public.is_trusted_payment_operation()
     and not public.is_admin() then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_OPERATION_NOT_ALLOWED';

  end if;


  if p_amount is null
     or p_amount <= 0 then

    raise exception using
      errcode = 'P0001',
      message = 'INVALID_REFUND_AMOUNT';

  end if;


  select *
  into v_payment
  from public.payment_transactions
  where id = p_payment_transaction_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_PAYMENT_NOT_FOUND';

  end if;


  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_ORDER_NOT_FOUND';

  end if;


  if v_payment.order_id <> p_order_id then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_ORDER_PAYMENT_MISMATCH';

  end if;


  if v_payment.status not in (
    'successful',
    'partially_refunded'
  ) then

    raise exception using
      errcode = 'P0001',
      message = 'PAYMENT_NOT_REFUNDABLE';

  end if;


  select coalesce(
    sum(amount),
    0
  )
  into v_total_refunded
  from public.refunds
  where payment_transaction_id =
    p_payment_transaction_id
    and status = 'completed';


  v_remaining :=
    greatest(
      v_payment.amount - v_total_refunded,
      0
    );


  if p_amount > v_remaining then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_AMOUNT_EXCEEDS_REMAINING';

  end if;


  insert into public.refunds (
    order_id,
    payment_transaction_id,
    customer_id,
    status,
    destination,
    currency,
    amount,
    payment_amount,
    previously_refunded_amount,
    remaining_refundable_amount,
    reason,
    requested_by
  )
  values (
    p_order_id,
    p_payment_transaction_id,
    v_payment.customer_id,
    case
      when public.is_admin()
        then 'approved'::public.refund_status
      else 'requested'::public.refund_status
    end,
    p_destination,
    v_payment.currency,
    p_amount,
    v_payment.amount,
    v_total_refunded,
    v_remaining,
    nullif(trim(coalesce(p_reason, '')), ''),
    auth.uid()
  )
  returning *
  into v_refund;


  return v_refund;

exception
  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_CREATION_FAILED';

end;
$$;


-- ============================================================
-- 14. BEGIN REFUND PROCESSING
-- ============================================================

create or replace function public.begin_refund_processing(
  p_refund_id uuid
)
returns public.refunds
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refund public.refunds%rowtype;
begin

  if not public.is_trusted_payment_operation()
     and not public.is_admin() then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_OPERATION_NOT_ALLOWED';

  end if;


  select *
  into v_refund
  from public.refunds
  where id = p_refund_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_NOT_FOUND';

  end if;


  if v_refund.status = 'completed' then
    return v_refund;
  end if;


  if v_refund.status in (
    'cancelled',
    'reversed'
  ) then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_NOT_PROCESSABLE';

  end if;


  if v_refund.status = 'requested' then

    update public.refunds
    set status = 'approved',
        approved_by = coalesce(
          approved_by,
          auth.uid()
        )
    where id = p_refund_id;

  end if;


  update public.refunds
  set
    status = 'processing',
    processed_by = coalesce(
      processed_by,
      auth.uid()
    )
  where id = p_refund_id
  returning *
  into v_refund;


  return v_refund;

exception
  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_PROCESSING_FAILED';

end;
$$;


-- ============================================================
-- 15. COMPLETE REFUND
--
-- This records successful completion.
--
-- The actual wallet credit or Flutterwave provider refund is
-- performed by the trusted Edge Function. This function then
-- records the authoritative result.
-- ============================================================

create or replace function public.complete_refund(
  p_refund_id uuid,
  p_provider_refund_id text default null,
  p_provider_reference text default null,
  p_provider_status text default null,
  p_provider_message text default null,
  p_provider_metadata jsonb default '{}'::jsonb
)
returns public.refunds
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refund public.refunds%rowtype;
  v_payment public.payment_transactions%rowtype;
  v_total_completed numeric(14,2);
  v_payment_refunded numeric(14,2);
begin

  if not public.is_trusted_payment_operation() then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_OPERATION_NOT_ALLOWED';

  end if;


  select *
  into v_refund
  from public.refunds
  where id = p_refund_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_NOT_FOUND';

  end if;


  if v_refund.status = 'completed' then
    return v_refund;
  end if;


  select *
  into v_payment
  from public.payment_transactions
  where id = v_refund.payment_transaction_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_PAYMENT_NOT_FOUND';

  end if;


  -- ----------------------------------------------------------
  -- Recalculate completed refund amount while payment is
  -- locked.
  -- ----------------------------------------------------------

  select coalesce(
    sum(amount),
    0
  )
  into v_total_completed
  from public.refunds
  where payment_transaction_id =
    v_refund.payment_transaction_id
    and status = 'completed'
    and id <> v_refund.id;


  if v_total_completed + v_refund.amount
     > v_payment.amount then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_AMOUNT_EXCEEDS_PAYMENT';

  end if;


  update public.refunds
  set
    status = 'completed',

    provider_refund_id =
      nullif(
        trim(coalesce(p_provider_refund_id, '')),
        ''
      ),

    provider_reference =
      nullif(
        trim(coalesce(p_provider_reference, '')),
        ''
      ),

    provider_status =
      nullif(
        trim(coalesce(p_provider_status, '')),
        ''
      ),

    provider_message =
      nullif(
        trim(coalesce(p_provider_message, '')),
        ''
      ),

    provider_metadata =
      coalesce(
        p_provider_metadata,
        '{}'::jsonb
      )

  where id = p_refund_id

  returning *
  into v_refund;


  -- ----------------------------------------------------------
  -- Calculate total refunded amount after this refund.
  -- ----------------------------------------------------------

  select coalesce(
    sum(amount),
    0
  )
  into v_payment_refunded
  from public.refunds
  where payment_transaction_id =
    v_refund.payment_transaction_id
    and status = 'completed';


  -- ----------------------------------------------------------
  -- Synchronize payment status.
  -- ----------------------------------------------------------

  update public.payment_transactions
  set status =
    case
      when v_payment_refunded >= v_payment.amount
        then 'refunded'::public.payment_transaction_status
      else
        'partially_refunded'::public.payment_transaction_status
    end
  where id = v_payment.id;


  -- ----------------------------------------------------------
  -- Synchronize order payment status.
  -- ----------------------------------------------------------

  update public.orders
  set
    refunded_amount = v_payment_refunded,

    payment_status =
      case
        when v_payment_refunded >= customer_total
          then 'refunded'::public.order_payment_status

        else
          'partially_refunded'::public.order_payment_status
      end

  where id = v_refund.order_id;


  return v_refund;


exception
  when unique_violation then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_ALREADY_PROCESSED';

  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_COMPLETION_FAILED';

end;
$$;


-- ============================================================
-- 16. FAIL REFUND
-- ============================================================

create or replace function public.fail_refund(
  p_refund_id uuid,
  p_provider_status text default null,
  p_provider_message text default null,
  p_provider_metadata jsonb default '{}'::jsonb
)
returns public.refunds
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refund public.refunds%rowtype;
begin

  if not public.is_trusted_payment_operation() then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_OPERATION_NOT_ALLOWED';

  end if;


  select *
  into v_refund
  from public.refunds
  where id = p_refund_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_NOT_FOUND';

  end if;


  if v_refund.status = 'completed' then
    return v_refund;
  end if;


  update public.refunds
  set
    status = 'failed',

    provider_status =
      nullif(
        trim(coalesce(p_provider_status, '')),
        ''
      ),

    provider_message =
      nullif(
        trim(coalesce(p_provider_message, '')),
        ''
      ),

    provider_metadata =
      coalesce(
        p_provider_metadata,
        '{}'::jsonb
      )

  where id = p_refund_id

  returning *
  into v_refund;


  return v_refund;


exception
  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'REFUND_FAILURE_RECORD_FAILED';

end;
$$;


-- ============================================================
-- 17. REFUND SUMMARY VIEW
--
-- Admin/internal reconciliation view.
-- ============================================================

create or replace view public.refund_summary
with (security_invoker = true)
as
select
  r.id,
  r.refund_reference,
  r.order_id,
  o.order_reference,
  r.payment_transaction_id,
  pt.payment_reference,
  r.customer_id,
  r.status,
  r.destination,
  r.currency,
  r.amount,
  r.payment_amount,
  r.previously_refunded_amount,
  r.remaining_refundable_amount,
  r.provider_refund_id,
  r.provider_reference,
  r.provider_status,
  r.requested_at,
  r.approved_at,
  r.processing_started_at,
  r.completed_at,
  r.failed_at,
  r.created_at,
  r.updated_at
from public.refunds r
join public.orders o
  on o.id = r.order_id
join public.payment_transactions pt
  on pt.id = r.payment_transaction_id;


-- ============================================================
-- 18. RLS
-- ============================================================

alter table public.refunds
enable row level security;


-- ------------------------------------------------------------
-- Customers can view only their own refund records.
-- ------------------------------------------------------------

drop policy if exists
"Customers can view own refunds"
on public.refunds;

create policy
"Customers can view own refunds"
on public.refunds
for select
to authenticated
using (
  customer_id = auth.uid()
  or public.is_admin()
);


-- ------------------------------------------------------------
-- Admins can create refunds directly.
-- Backend security-definer functions handle trusted
-- operations.
-- ------------------------------------------------------------

drop policy if exists
"Admins can insert refunds"
on public.refunds;

create policy
"Admins can insert refunds"
on public.refunds
for insert
to authenticated
with check (
  public.is_admin()
);


-- ------------------------------------------------------------
-- Admins can update refund records.
-- ------------------------------------------------------------

drop policy if exists
"Admins can update refunds"
on public.refunds;

create policy
"Admins can update refunds"
on public.refunds
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- ------------------------------------------------------------
-- No customer DELETE.
-- ------------------------------------------------------------

drop policy if exists
"Admins can delete refunds"
on public.refunds;

create policy
"Admins can delete refunds"
on public.refunds
for delete
to authenticated
using (
  public.is_admin()
);


-- ============================================================
-- 19. FUNCTION PERMISSIONS
-- ============================================================

revoke all
on function public.create_refund_request(
  uuid,
  uuid,
  numeric,
  public.refund_destination,
  text
)
from public;


revoke all
on function public.begin_refund_processing(
  uuid
)
from public;


revoke all
on function public.complete_refund(
  uuid,
  text,
  text,
  text,
  text,
  jsonb
)
from public;


revoke all
on function public.fail_refund(
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
on public.refunds
to authenticated;


-- ============================================================
-- 21. COMMENTS
-- ============================================================

comment on table public.refunds is
'Secure marketplace refund records supporting full and partial refunds to customer wallet or Flutterwave.';

comment on column public.refunds.amount is
'Amount refunded by this individual refund record.';

comment on column public.refunds.payment_amount is
'Original successful payment amount associated with the refund.';

comment on column public.refunds.previously_refunded_amount is
'Completed refund amount before this refund was created.';

comment on column public.refunds.remaining_refundable_amount is
'Amount still available for refund at refund creation time.';

comment on function public.create_refund_request(
  uuid,
  uuid,
  numeric,
  public.refund_destination,
  text
) is
'Creates a validated full or partial refund request against a successful marketplace payment.';

comment on function public.complete_refund(
  uuid,
  text,
  text,
  text,
  text,
  jsonb
) is
'Trusted backend operation that records successful refund completion and synchronizes payment/order refund status.';


commit;
