-- ============================================================
-- IyanjuWorld
-- Migration: 0013_payment_webhook_events.sql
--
-- Purpose:
--   Secure, idempotent storage and processing boundary for
--   Flutterwave webhook events.
--
-- Rules:
--   - Webhooks are never trusted blindly.
--   - Duplicate webhook deliveries are harmless.
--   - A webhook cannot directly modify an order from the
--     frontend.
--   - Payment verification remains server-side.
--   - Provider event identifiers are unique.
--   - Raw provider payloads are NOT exposed through customer
--     RLS policies.
--   - Processing failures can be retried safely.
-- ============================================================

begin;


-- ============================================================
-- 1. WEBHOOK EVENT STATUS
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'payment_webhook_event_status'
  ) then

    create type public.payment_webhook_event_status as enum (
      'received',
      'processing',
      'processed',
      'failed',
      'ignored'
    );

  end if;
end
$$;


-- ============================================================
-- 2. PAYMENT WEBHOOK EVENTS
-- ============================================================

create table if not exists public.payment_webhook_events (

  id uuid primary key default gen_random_uuid(),

  -- Internal event reference.
  event_reference text not null unique,

  -- Provider.
  provider public.payment_provider not null
    default 'flutterwave',

  -- Provider event identifier.
  --
  -- This is the primary idempotency key when Flutterwave
  -- supplies a stable event ID.
  provider_event_id text,

  -- Provider event type/name.
  event_type text,

  -- Provider transaction ID, when available.
  provider_transaction_id text,

  -- Provider payment/reference value.
  provider_reference text,

  -- Internal payment transaction discovered from the event.
  payment_transaction_id uuid
    references public.payment_transactions(id)
    on delete set null,

  -- Internal order discovered from the event.
  order_id uuid
    references public.orders(id)
    on delete set null,

  -- Customer discovered from the event.
  customer_id uuid
    references public.profiles(id)
    on delete set null,

  status public.payment_webhook_event_status not null
    default 'received',

  -- Provider signature verification result.
  signature_verified boolean not null
    default false,

  -- Whether the event has been cryptographically/provider
  -- verified and is safe to process.
  verification_status text not null
    default 'unverified',

  -- Safe processing error code.
  error_code text,

  -- Safe internal processing message.
  error_message text,

  -- Sanitized processing metadata.
  metadata jsonb not null default '{}'::jsonb,

  -- Provider payload.
  --
  -- This is deliberately protected by RLS.
  provider_payload jsonb not null default '{}'::jsonb,

  received_at timestamptz not null default now(),

  processing_started_at timestamptz,

  processed_at timestamptz,

  failed_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint payment_webhook_event_reference_check
    check (
      length(trim(event_reference)) >= 8
    ),

  constraint payment_webhook_event_type_check
    check (
      event_type is null
      or length(trim(event_type)) > 0
    ),

  constraint payment_webhook_provider_event_check
    check (
      provider_event_id is null
      or length(trim(provider_event_id)) > 0
    ),

  constraint payment_webhook_verification_status_check
    check (
      verification_status in (
        'unverified',
        'verified',
        'rejected'
      )
    )
);


-- ============================================================
-- 3. IDEMPOTENCY INDEXES
-- ============================================================

create unique index if not exists
payment_webhook_events_provider_event_unique_idx
on public.payment_webhook_events(
  provider,
  provider_event_id
)
where provider_event_id is not null;


create unique index if not exists
payment_webhook_events_provider_transaction_unique_idx
on public.payment_webhook_events(
  provider,
  provider_transaction_id
)
where provider_transaction_id is not null
  and status in (
    'received',
    'processing',
    'processed'
  );


-- ============================================================
-- 4. LOOKUP INDEXES
-- ============================================================

create index if not exists
payment_webhook_events_payment_transaction_idx
on public.payment_webhook_events(
  payment_transaction_id
);

create index if not exists
payment_webhook_events_order_idx
on public.payment_webhook_events(
  order_id
);

create index if not exists
payment_webhook_events_customer_idx
on public.payment_webhook_events(
  customer_id
);

create index if not exists
payment_webhook_events_status_idx
on public.payment_webhook_events(
  status
);

create index if not exists
payment_webhook_events_received_at_idx
on public.payment_webhook_events(
  received_at desc
);

create index if not exists
payment_webhook_events_event_type_idx
on public.payment_webhook_events(
  event_type
);


-- ============================================================
-- 5. UPDATED_AT
-- ============================================================

drop trigger if exists set_payment_webhook_events_updated_at
on public.payment_webhook_events;

create trigger set_payment_webhook_events_updated_at
before update
on public.payment_webhook_events
for each row
execute function public.set_updated_at();


-- ============================================================
-- 6. EVENT REFERENCE GENERATOR
-- ============================================================

create or replace function public.generate_payment_webhook_event_reference()
returns text
language plpgsql
volatile
as $$
declare
  v_reference text;
begin

  loop

    v_reference :=
      'WH-FLW-'
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
      from public.payment_webhook_events
      where event_reference = v_reference
    );

  end loop;

  return v_reference;

end;
$$;


-- ============================================================
-- 7. AUTOMATIC EVENT REFERENCE
-- ============================================================

create or replace function public.set_payment_webhook_event_reference()
returns trigger
language plpgsql
as $$
begin

  if new.event_reference is null
     or trim(new.event_reference) = '' then

    new.event_reference :=
      public.generate_payment_webhook_event_reference();

  end if;

  return new;

end;
$$;


drop trigger if exists
set_payment_webhook_event_reference_trigger
on public.payment_webhook_events;

create trigger
set_payment_webhook_event_reference_trigger
before insert
on public.payment_webhook_events
for each row
execute function public.set_payment_webhook_event_reference();


-- ============================================================
-- 8. WEBHOOK STATUS TIMESTAMPS
-- ============================================================

create or replace function public.set_payment_webhook_status_timestamps()
returns trigger
language plpgsql
as $$
begin

  if new.status = 'processing'
     and old.status <> 'processing' then

    new.processing_started_at :=
      coalesce(
        new.processing_started_at,
        now()
      );

  end if;


  if new.status = 'processed'
     and old.status <> 'processed' then

    new.processed_at :=
      coalesce(
        new.processed_at,
        now()
      );

  end if;


  if new.status = 'failed'
     and old.status <> 'failed' then

    new.failed_at :=
      coalesce(
        new.failed_at,
        now()
      );

  end if;


  return new;

end;
$$;


drop trigger if exists
set_payment_webhook_status_timestamps_trigger
on public.payment_webhook_events;

create trigger
set_payment_webhook_status_timestamps_trigger
before update of status
on public.payment_webhook_events
for each row
execute function public.set_payment_webhook_status_timestamps();


-- ============================================================
-- 9. STATUS TRANSITION PROTECTION
-- ============================================================

create or replace function public.validate_payment_webhook_status_transition()
returns trigger
language plpgsql
as $$
begin

  if new.status = old.status then
    return new;
  end if;


  -- A processed event cannot be moved backwards.
  if old.status = 'processed' then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_STATUS_TRANSITION_NOT_ALLOWED';

  end if;


  -- Ignored is terminal.
  if old.status = 'ignored'
     and new.status <> 'ignored' then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_STATUS_TRANSITION_NOT_ALLOWED';

  end if;


  return new;

end;
$$;


drop trigger if exists
validate_payment_webhook_status_transition_trigger
on public.payment_webhook_events;

create trigger
validate_payment_webhook_status_transition_trigger
before update of status
on public.payment_webhook_events
for each row
execute function public.validate_payment_webhook_status_transition();


-- ============================================================
-- 10. RECEIVE WEBHOOK EVENT
--
-- Called by the Flutterwave webhook Edge Function.
--
-- This function stores the event without trusting it yet.
--
-- Signature verification happens before the event is allowed
-- to progress to processing.
-- ============================================================

create or replace function public.receive_payment_webhook_event(
  p_provider public.payment_provider,
  p_provider_event_id text,
  p_event_type text,
  p_provider_transaction_id text default null,
  p_provider_reference text default null,
  p_provider_payload jsonb default '{}'::jsonb
)
returns public.payment_webhook_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.payment_webhook_events%rowtype;
begin

  -- ----------------------------------------------------------
  -- Only trusted backend code may create webhook events.
  -- ----------------------------------------------------------

  if not public.is_trusted_payment_operation() then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_OPERATION_NOT_ALLOWED';

  end if;


  -- ----------------------------------------------------------
  -- Existing event = idempotent replay.
  -- ----------------------------------------------------------

  if p_provider_event_id is not null then

    select *
    into v_event
    from public.payment_webhook_events
    where provider = p_provider
      and provider_event_id = trim(p_provider_event_id)
    limit 1;

    if found then
      return v_event;
    end if;

  end if;


  -- ----------------------------------------------------------
  -- Create event.
  -- ----------------------------------------------------------

  insert into public.payment_webhook_events (
    provider,
    provider_event_id,
    event_type,
    provider_transaction_id,
    provider_reference,
    status,
    signature_verified,
    verification_status,
    provider_payload
  )
  values (
    p_provider,
    nullif(trim(coalesce(p_provider_event_id, '')), ''),
    nullif(trim(coalesce(p_event_type, '')), ''),
    nullif(
      trim(coalesce(p_provider_transaction_id, '')),
      ''
    ),
    nullif(
      trim(coalesce(p_provider_reference, '')),
      ''
    ),
    'received',
    false,
    'unverified',
    coalesce(
      p_provider_payload,
      '{}'::jsonb
    )
  )
  returning *
  into v_event;


  return v_event;


exception
  when unique_violation then

    if p_provider_event_id is not null then

      select *
      into v_event
      from public.payment_webhook_events
      where provider = p_provider
        and provider_event_id =
          trim(p_provider_event_id)
      limit 1;

      if found then
        return v_event;
      end if;

    end if;


    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_EVENT_ALREADY_EXISTS';


  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_EVENT_RECEIVE_FAILED';

end;
$$;


-- ============================================================
-- 11. MARK WEBHOOK VERIFIED
--
-- Signature verification must happen before payment processing.
-- ============================================================

create or replace function public.verify_payment_webhook_event(
  p_event_id uuid
)
returns public.payment_webhook_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.payment_webhook_events%rowtype;
begin

  if not public.is_trusted_payment_operation() then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_OPERATION_NOT_ALLOWED';

  end if;


  select *
  into v_event
  from public.payment_webhook_events
  where id = p_event_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_EVENT_NOT_FOUND';

  end if;


  if v_event.status = 'processed' then
    return v_event;
  end if;


  update public.payment_webhook_events
  set
    signature_verified = true,
    verification_status = 'verified'
  where id = p_event_id
  returning *
  into v_event;


  return v_event;

exception
  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_VERIFICATION_FAILED';

end;
$$;


-- ============================================================
-- 12. REJECT WEBHOOK
-- ============================================================

create or replace function public.reject_payment_webhook_event(
  p_event_id uuid,
  p_error_code text default 'WEBHOOK_SIGNATURE_INVALID',
  p_error_message text default 'Webhook verification failed'
)
returns public.payment_webhook_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.payment_webhook_events%rowtype;
begin

  if not public.is_trusted_payment_operation() then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_OPERATION_NOT_ALLOWED';

  end if;


  select *
  into v_event
  from public.payment_webhook_events
  where id = p_event_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_EVENT_NOT_FOUND';

  end if;


  update public.payment_webhook_events
  set
    status = 'ignored',
    signature_verified = false,
    verification_status = 'rejected',
    error_code = nullif(
      trim(coalesce(p_error_code, '')),
      ''
    ),
    error_message = nullif(
      trim(coalesce(p_error_message, '')),
      ''
    )
  where id = p_event_id
  returning *
  into v_event;


  return v_event;

exception
  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_REJECTION_FAILED';

end;
$$;


-- ============================================================
-- 13. BEGIN WEBHOOK PROCESSING
--
-- Locks the event so concurrent webhook workers cannot process
-- the same event simultaneously.
-- ============================================================

create or replace function public.begin_payment_webhook_processing(
  p_event_id uuid
)
returns public.payment_webhook_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.payment_webhook_events%rowtype;
begin

  if not public.is_trusted_payment_operation() then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_OPERATION_NOT_ALLOWED';

  end if;


  select *
  into v_event
  from public.payment_webhook_events
  where id = p_event_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_EVENT_NOT_FOUND';

  end if;


  if v_event.status = 'processed' then
    return v_event;
  end if;


  if v_event.status = 'ignored' then
    return v_event;
  end if;


  if v_event.verification_status <> 'verified'
     or not v_event.signature_verified then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_NOT_VERIFIED';

  end if;


  update public.payment_webhook_events
  set
    status = 'processing'
  where id = p_event_id
  returning *
  into v_event;


  return v_event;

exception
  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_PROCESSING_START_FAILED';

end;
$$;


-- ============================================================
-- 14. LINK EVENT TO INTERNAL PAYMENT
--
-- Uses provider transaction ID first, then provider reference.
-- ============================================================

create or replace function public.link_payment_webhook_event(
  p_event_id uuid
)
returns public.payment_webhook_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.payment_webhook_events%rowtype;
  v_payment public.payment_transactions%rowtype;
begin

  if not public.is_trusted_payment_operation() then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_OPERATION_NOT_ALLOWED';

  end if;


  select *
  into v_event
  from public.payment_webhook_events
  where id = p_event_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_EVENT_NOT_FOUND';

  end if;


  -- ----------------------------------------------------------
  -- Already linked.
  -- ----------------------------------------------------------

  if v_event.payment_transaction_id is not null then
    return v_event;
  end if;


  -- ----------------------------------------------------------
  -- Match provider transaction ID.
  -- ----------------------------------------------------------

  if v_event.provider_transaction_id is not null then

    select *
    into v_payment
    from public.payment_transactions
    where provider = v_event.provider
      and provider_transaction_id =
        v_event.provider_transaction_id
    limit 1;

  end if;


  -- ----------------------------------------------------------
  -- Match provider reference.
  -- ----------------------------------------------------------

  if v_payment.id is null
     and v_event.provider_reference is not null then

    select *
    into v_payment
    from public.payment_transactions
    where provider = v_event.provider
      and provider_reference =
        v_event.provider_reference
    limit 1;

  end if;


  if v_payment.id is null then

    update public.payment_webhook_events
    set
      error_code = 'PAYMENT_TRANSACTION_NOT_FOUND',
      error_message =
        'No matching payment transaction was found.'
    where id = p_event_id
    returning *
    into v_event;

    return v_event;

  end if;


  update public.payment_webhook_events
  set
    payment_transaction_id = v_payment.id,
    order_id = v_payment.order_id,
    customer_id = v_payment.customer_id
  where id = p_event_id
  returning *
  into v_event;


  return v_event;


exception
  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_PAYMENT_LINK_FAILED';

end;
$$;


-- ============================================================
-- 15. MARK WEBHOOK PROCESSED
-- ============================================================

create or replace function public.complete_payment_webhook_event(
  p_event_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns public.payment_webhook_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.payment_webhook_events%rowtype;
begin

  if not public.is_trusted_payment_operation() then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_OPERATION_NOT_ALLOWED';

  end if;


  select *
  into v_event
  from public.payment_webhook_events
  where id = p_event_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_EVENT_NOT_FOUND';

  end if;


  if v_event.status = 'processed' then
    return v_event;
  end if;


  if v_event.status = 'ignored' then
    return v_event;
  end if;


  if v_event.payment_transaction_id is null then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_PAYMENT_NOT_LINKED';

  end if;


  update public.payment_webhook_events
  set
    status = 'processed',
    metadata =
      coalesce(
        metadata,
        '{}'::jsonb
      )
      ||
      coalesce(
        p_metadata,
        '{}'::jsonb
      )
  where id = p_event_id
  returning *
  into v_event;


  return v_event;

exception
  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_COMPLETION_FAILED';

end;
$$;


-- ============================================================
-- 16. MARK WEBHOOK FAILED
--
-- Failed events can be retried by trusted backend logic.
-- ============================================================

create or replace function public.fail_payment_webhook_event(
  p_event_id uuid,
  p_error_code text,
  p_error_message text
)
returns public.payment_webhook_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.payment_webhook_events%rowtype;
begin

  if not public.is_trusted_payment_operation() then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_OPERATION_NOT_ALLOWED';

  end if;


  select *
  into v_event
  from public.payment_webhook_events
  where id = p_event_id
  for update;


  if not found then

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_EVENT_NOT_FOUND';

  end if;


  if v_event.status = 'processed' then
    return v_event;
  end if;


  update public.payment_webhook_events
  set
    status = 'failed',
    error_code = nullif(
      trim(coalesce(p_error_code, '')),
      ''
    ),
    error_message = nullif(
      trim(coalesce(p_error_message, '')),
      ''
    )
  where id = p_event_id
  returning *
  into v_event;


  return v_event;

exception
  when others then

    if sqlstate = 'P0001' then
      raise;
    end if;

    raise exception using
      errcode = 'P0001',
      message = 'WEBHOOK_FAILURE_RECORD_FAILED';

end;
$$;


-- ============================================================
-- 17. RLS
--
-- Customers should NOT see webhook payloads.
--
-- Admins may inspect webhook records for reconciliation.
-- ============================================================

alter table public.payment_webhook_events
enable row level security;


drop policy if exists
"Admins can view payment webhook events"
on public.payment_webhook_events;

create policy
"Admins can view payment webhook events"
on public.payment_webhook_events
for select
to authenticated
using (
  public.is_admin()
);


drop policy if exists
"Admins can insert payment webhook events"
on public.payment_webhook_events;

create policy
"Admins can insert payment webhook events"
on public.payment_webhook_events
for insert
to authenticated
with check (
  public.is_admin()
);


drop policy if exists
"Admins can update payment webhook events"
on public.payment_webhook_events;

create policy
"Admins can update payment webhook events"
on public.payment_webhook_events
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);


-- No customer INSERT/UPDATE/DELETE policies.
-- Webhook processing is backend-only.


-- ============================================================
-- 18. FUNCTION PERMISSIONS
-- ============================================================

revoke all
on function public.receive_payment_webhook_event(
  public.payment_provider,
  text,
  text,
  text,
  text,
  jsonb
)
from public;


revoke all
on function public.verify_payment_webhook_event(
  uuid
)
from public;


revoke all
on function public.reject_payment_webhook_event(
  uuid,
  text,
  text
)
from public;


revoke all
on function public.begin_payment_webhook_processing(
  uuid
)
from public;


revoke all
on function public.link_payment_webhook_event(
  uuid
)
from public;


revoke all
on function public.complete_payment_webhook_event(
  uuid,
  jsonb
)
from public;


revoke all
on function public.fail_payment_webhook_event(
  uuid,
  text,
  text
)
from public;


-- ============================================================
-- 19. TABLE GRANTS
-- ============================================================

grant select
on public.payment_webhook_events
to authenticated;


-- ============================================================
-- 20. COMMENTS
-- ============================================================

comment on table public.payment_webhook_events is
'Idempotent server-side storage and processing boundary for payment provider webhook events.';

comment on column public.payment_webhook_events.provider_event_id is
'Provider event identifier used to prevent duplicate webhook processing.';

comment on column public.payment_webhook_events.signature_verified is
'Indicates that the webhook signature/authenticity has been verified by trusted backend code.';

comment on column public.payment_webhook_events.provider_payload is
'Provider webhook payload. Restricted to backend/admin access and never exposed to customers.';

comment on function public.receive_payment_webhook_event(
  public.payment_provider,
  text,
  text,
  text,
  text,
  jsonb
) is
'Stores a provider webhook event idempotently before verification and processing.';

comment on function public.complete_payment_webhook_event(
  uuid,
  jsonb
) is
'Marks a verified webhook event as processed after the associated payment operation succeeds.';


commit;
