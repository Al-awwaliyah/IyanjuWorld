-- ============================================================
-- IyanjuWorld
-- Migration 0002: Customer Wallets
-- ============================================================

-- ============================================================
-- CUSTOMER WALLETS
-- ============================================================

create table if not exists public.customer_wallets (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null
    references public.profiles(id)
    on delete cascade,

  available_balance numeric(18,2) not null default 0,
  pending_balance numeric(18,2) not null default 0,

  currency text not null default 'NGN',

  is_active boolean not null default true,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint customer_wallets_customer_unique
    unique (customer_id),

  constraint customer_wallets_available_balance_check
    check (available_balance >= 0),

  constraint customer_wallets_pending_balance_check
    check (pending_balance >= 0),

  constraint customer_wallets_currency_check
    check (currency = 'NGN')
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists customer_wallets_customer_id_idx
  on public.customer_wallets(customer_id);

create index if not exists customer_wallets_is_active_idx
  on public.customer_wallets(is_active);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

drop trigger if exists customer_wallets_set_updated_at
on public.customer_wallets;

create trigger customer_wallets_set_updated_at
before update on public.customer_wallets
for each row
execute function public.set_updated_at();

-- ============================================================
-- WALLET TRANSACTION TYPES
-- ============================================================

do $$
begin
  create type public.wallet_transaction_type as enum (
    'deposit',
    'order_payment',
    'refund',
    'withdrawal',
    'withdrawal_reversal',
    'adjustment',
    'promotion',
    'referral',
    'reversal'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- WALLET TRANSACTION STATUS
-- ============================================================

do $$
begin
  create type public.wallet_transaction_status as enum (
    'pending',
    'available',
    'completed',
    'withdrawal_pending',
    'withdrawn',
    'reversed',
    'failed'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- WALLET TRANSACTIONS
-- ============================================================

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),

  wallet_id uuid not null
    references public.customer_wallets(id)
    on delete restrict,

  customer_id uuid not null
    references public.profiles(id)
    on delete restrict,

  transaction_type public.wallet_transaction_type not null,

  status public.wallet_transaction_status not null default 'pending',

  amount numeric(18,2) not null,

  balance_before numeric(18,2) not null default 0,
  balance_after numeric(18,2) not null default 0,

  currency text not null default 'NGN',

  reference text not null,

  description text,

  order_id uuid,

  payment_id uuid,

  parent_transaction_id uuid
    references public.wallet_transactions(id)
    on delete restrict,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  constraint wallet_transactions_amount_check
    check (amount > 0),

  constraint wallet_transactions_balance_before_check
    check (balance_before >= 0),

  constraint wallet_transactions_balance_after_check
    check (balance_after >= 0),

  constraint wallet_transactions_currency_check
    check (currency = 'NGN'),

  constraint wallet_transactions_reference_unique
    unique (reference)
);

-- ============================================================
-- WALLET TRANSACTION INDEXES
-- ============================================================

create index if not exists wallet_transactions_wallet_id_idx
  on public.wallet_transactions(wallet_id);

create index if not exists wallet_transactions_customer_id_idx
  on public.wallet_transactions(customer_id);

create index if not exists wallet_transactions_type_idx
  on public.wallet_transactions(transaction_type);

create index if not exists wallet_transactions_status_idx
  on public.wallet_transactions(status);

create index if not exists wallet_transactions_order_id_idx
  on public.wallet_transactions(order_id);

create index if not exists wallet_transactions_payment_id_idx
  on public.wallet_transactions(payment_id);

create index if not exists wallet_transactions_created_at_idx
  on public.wallet_transactions(created_at desc);

create index if not exists wallet_transactions_parent_transaction_idx
  on public.wallet_transactions(parent_transaction_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

drop trigger if exists wallet_transactions_set_updated_at
on public.wallet_transactions;

create trigger wallet_transactions_set_updated_at
before update on public.wallet_transactions
for each row
execute function public.set_updated_at();

-- ============================================================
-- AUTOMATIC CUSTOMER WALLET CREATION
-- ============================================================

create or replace function public.create_customer_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'customer' then
    insert into public.customer_wallets (
      customer_id
    )
    values (
      new.id
    )
    on conflict (customer_id) do nothing;
  end if;

  return new;
end;
$$;

-- ============================================================
-- PROFILE WALLET TRIGGER
-- ============================================================

drop trigger if exists on_customer_profile_created
on public.profiles;

create trigger on_customer_profile_created
after insert on public.profiles
for each row
execute function public.create_customer_wallet();

-- ============================================================
-- CREATE WALLETS FOR EXISTING CUSTOMERS
-- ============================================================

insert into public.customer_wallets (
  customer_id
)
select id
from public.profiles
where role = 'customer'
on conflict (customer_id) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.customer_wallets enable row level security;

alter table public.wallet_transactions enable row level security;

-- ============================================================
-- CUSTOMER WALLET POLICIES
-- ============================================================

drop policy if exists "Customers can view own wallet"
on public.customer_wallets;

create policy "Customers can view own wallet"
on public.customer_wallets
for select
to authenticated
using (
  customer_id = auth.uid()
);

drop policy if exists "Admins can view customer wallets"
on public.customer_wallets;

create policy "Admins can view customer wallets"
on public.customer_wallets
for select
to authenticated
using (
  public.is_admin()
);

-- Wallet balances must NOT be directly modified by customers.
-- Balance-changing operations will be performed by secure
-- database functions created in later migrations.

drop policy if exists "Customers can view own wallet transactions"
on public.wallet_transactions;

create policy "Customers can view own wallet transactions"
on public.wallet_transactions
for select
to authenticated
using (
  customer_id = auth.uid()
);

drop policy if exists "Admins can view wallet transactions"
on public.wallet_transactions;

create policy "Admins can view wallet transactions"
on public.wallet_transactions
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- GRANTS
-- ============================================================

grant select
on public.customer_wallets
to authenticated;

grant select
on public.wallet_transactions
to authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.customer_wallets is
  'One NGN wallet for every IyanjuWorld customer.';

comment on column public.customer_wallets.available_balance is
  'Funds currently available for purchases or withdrawal.';

comment on column public.customer_wallets.pending_balance is
  'Funds temporarily unavailable until the related transaction is completed.';

comment on table public.wallet_transactions is
  'Immutable-style financial history for customer wallet movements.';

comment on column public.wallet_transactions.reference is
  'Unique business reference for idempotency and financial reconciliation.';
