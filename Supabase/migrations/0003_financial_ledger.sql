-- ============================================================
-- IyanjuWorld
-- Migration 0003: Financial Ledger
-- ============================================================

-- ============================================================
-- LEDGER ACCOUNT TYPES
-- ============================================================

do $$
begin
  create type public.ledger_account_type as enum (
    'asset',
    'liability',
    'equity',
    'revenue',
    'expense'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- LEDGER ACCOUNTS
-- ============================================================

create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),

  account_code text not null unique,

  account_name text not null,

  account_type public.ledger_account_type not null,

  currency text not null default 'NGN',

  is_active boolean not null default true,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint ledger_accounts_currency_check
    check (currency = 'NGN')
);

-- ============================================================
-- LEDGER ACCOUNT INDEXES
-- ============================================================

create index if not exists ledger_accounts_type_idx
  on public.ledger_accounts(account_type);

create index if not exists ledger_accounts_active_idx
  on public.ledger_accounts(is_active);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

drop trigger if exists ledger_accounts_set_updated_at
on public.ledger_accounts;

create trigger ledger_accounts_set_updated_at
before update on public.ledger_accounts
for each row
execute function public.set_updated_at();

-- ============================================================
-- LEDGER ENTRIES
-- ============================================================

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),

  account_id uuid not null
    references public.ledger_accounts(id)
    on delete restrict,

  transaction_reference text not null,

  entry_type text not null,

  debit numeric(18,2) not null default 0,

  credit numeric(18,2) not null default 0,

  currency text not null default 'NGN',

  description text,

  source_type text,

  source_id uuid,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default timezone('utc', now()),

  constraint ledger_entries_debit_check
    check (debit >= 0),

  constraint ledger_entries_credit_check
    check (credit >= 0),

  constraint ledger_entries_currency_check
    check (currency = 'NGN'),

  constraint ledger_entries_amount_check
    check (
      (debit > 0 and credit = 0)
      or
      (credit > 0 and debit = 0)
    )
);

-- ============================================================
-- LEDGER ENTRY INDEXES
-- ============================================================

create index if not exists ledger_entries_account_id_idx
  on public.ledger_entries(account_id);

create index if not exists ledger_entries_transaction_reference_idx
  on public.ledger_entries(transaction_reference);

create index if not exists ledger_entries_source_idx
  on public.ledger_entries(source_type, source_id);

create index if not exists ledger_entries_created_at_idx
  on public.ledger_entries(created_at desc);

-- ============================================================
-- UNIQUE TRANSACTION REFERENCE + ACCOUNT
-- ============================================================

create unique index if not exists
ledger_entries_transaction_account_unique_idx
on public.ledger_entries(
  transaction_reference,
  account_id
);

-- ============================================================
-- PLATFORM DEFAULT ACCOUNTS
-- ============================================================

insert into public.ledger_accounts (
  account_code,
  account_name,
  account_type
)
values
  (
    '1000',
    'Flutterwave Settlement Asset',
    'asset'
  ),
  (
    '1010',
    'Customer Wallet Funds',
    'liability'
  ),
  (
    '1020',
    'Business Settlement Receivable',
    'asset'
  ),
  (
    '1030',
    'Rider Settlement Receivable',
    'asset'
  ),
  (
    '2000',
    'Customer Refund Liability',
    'liability'
  ),
  (
    '2010',
    'Business Payable',
    'liability'
  ),
  (
    '2020',
    'Rider Payable',
    'liability'
  ),
  (
    '4000',
    'Marketplace Platform Fees',
    'revenue'
  ),
  (
    '5000',
    'Refund Expense',
    'expense'
  )
on conflict (account_code) do nothing;

-- ============================================================
-- LEDGER BALANCE VIEW
-- ============================================================

create or replace view public.ledger_account_balances
with (security_invoker = true)
as
select
  la.id,
  la.account_code,
  la.account_name,
  la.account_type,
  la.currency,
  la.is_active,

  coalesce(sum(le.debit), 0)::numeric(18,2)
    as total_debits,

  coalesce(sum(le.credit), 0)::numeric(18,2)
    as total_credits,

  case
    when la.account_type in ('asset', 'expense')
      then (
        coalesce(sum(le.debit), 0)
        - coalesce(sum(le.credit), 0)
      )::numeric(18,2)

    else (
        coalesce(sum(le.credit), 0)
        - coalesce(sum(le.debit), 0)
      )::numeric(18,2)
  end as balance

from public.ledger_accounts la

left join public.ledger_entries le
  on le.account_id = la.id

group by
  la.id,
  la.account_code,
  la.account_name,
  la.account_type,
  la.currency,
  la.is_active;

-- ============================================================
-- LEDGER INTEGRITY FUNCTION
-- ============================================================

create or replace function public.verify_ledger_transaction(
  p_transaction_reference text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  total_debits numeric(18,2);
  total_credits numeric(18,2);
begin
  select
    coalesce(sum(debit), 0),
    coalesce(sum(credit), 0)
  into
    total_debits,
    total_credits
  from public.ledger_entries
  where transaction_reference = p_transaction_reference;

  return total_debits = total_credits;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.ledger_accounts enable row level security;

alter table public.ledger_entries enable row level security;

-- ============================================================
-- LEDGER ACCOUNT POLICIES
-- ============================================================

drop policy if exists "Admins can view ledger accounts"
on public.ledger_accounts;

create policy "Admins can view ledger accounts"
on public.ledger_accounts
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- LEDGER ENTRY POLICIES
-- ============================================================

drop policy if exists "Admins can view ledger entries"
on public.ledger_entries;

create policy "Admins can view ledger entries"
on public.ledger_entries
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- NO DIRECT CLIENT INSERT/UPDATE/DELETE
-- ============================================================
--
-- Ledger entries must only be created by secure database
-- functions or trusted server-side operations.
--
-- Customers, businesses and riders must never be allowed
-- to directly modify accounting records.
--
-- ============================================================

grant select
on public.ledger_account_balances
to authenticated;

grant select
on public.ledger_accounts
to authenticated;

grant select
on public.ledger_entries
to authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.ledger_accounts is
  'Double-entry accounting accounts used by IyanjuWorld.';

comment on table public.ledger_entries is
  'Immutable-style double-entry accounting records.';

comment on column public.ledger_entries.transaction_reference is
  'Unique business transaction reference shared by all entries belonging to one accounting event.';

comment on column public.ledger_entries.debit is
  'Debit amount for this ledger entry.';

comment on column public.ledger_entries.credit is
  'Credit amount for this ledger entry.';

comment on view public.ledger_account_balances is
  'Calculated balances for internal financial reporting and reconciliation.';
