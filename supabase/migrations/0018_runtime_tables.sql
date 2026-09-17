create table if not exists public.conversations(id uuid primary key default gen_random_uuid(),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.conversation_members(conversation_id uuid references public.conversations(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,role text not null default 'member',created_at timestamptz not null default now(),primary key(conversation_id,user_id));
create table if not exists public.messages(id uuid primary key default gen_random_uuid(),conversation_id uuid references public.conversations(id) on delete cascade,sender_id uuid references auth.users(id) on delete cascade,body text not null,created_at timestamptz not null default now(),read_at timestamptz);
create table if not exists public.delivery_requests(id uuid primary key default gen_random_uuid(),order_id uuid references public.orders(id) on delete cascade,status text not null default 'pending',expires_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.delivery_assignments(id uuid primary key default gen_random_uuid(),order_id uuid references public.orders(id) on delete cascade,rider_id uuid references public.riders(id) on delete cascade,status text not null default 'assigned',pickup_at timestamptz,delivered_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.business_earnings(id uuid primary key default gen_random_uuid(),business_id uuid references public.businesses(id) on delete cascade,order_id uuid references public.orders(id) on delete set null,amount numeric(14,2) not null default 0,status text not null default 'pending',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.rider_earnings(id uuid primary key default gen_random_uuid(),rider_id uuid references public.riders(id) on delete cascade,order_id uuid references public.orders(id) on delete set null,amount numeric(14,2) not null default 0,status text not null default 'pending',available_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.payouts(id uuid primary key default gen_random_uuid(),business_id uuid references public.businesses(id) on delete set null,rider_id uuid references public.riders(id) on delete set null,amount numeric(14,2) not null,status text not null default 'pending',reference text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.audit_logs(id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users(id) on delete set null,action text not null,entity_type text,entity_id uuid,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
drop view if exists public.cart_item_details;

create view public.cart_item_details
with (security_invoker = true)
as
select
  ci.id,
  ci.cart_id,
  ci.product_id,
  ci.quantity,
  p.price as unit_price,
  (p.price * ci.quantity)::numeric(18,2) as subtotal,
  p.name as product_name,
  (
    select pi.storage_path
    from public.product_images pi
    where pi.product_id = p.id
    order by pi.sort_order, pi.created_at
    limit 1
  ) as product_image,
  p.business_id,
  b.name as business_name,
  p.stock_quantity as available_stock,
  ci.created_at,
  ci.updated_at
from public.cart_items ci
join public.products p
  on p.id = ci.product_id
left join public.businesses b
  on b.id = p.business_id;
create or replace view public.payment_refunds as select * from public.refunds;
create or replace function public.update_cart_item_quantity(p_cart_item_id uuid,p_quantity integer) returns public.cart_items language plpgsql security invoker as $$ declare r public.cart_items; begin if p_quantity<1 then raise exception 'Quantity must be at least 1'; end if; update public.cart_items ci set quantity=p_quantity where ci.id=p_cart_item_id and exists(select 1 from public.carts c where c.id=ci.cart_id and c.customer_id=auth.uid()) returning ci.* into r; if r.id is null then raise exception 'Cart item not found'; end if; return r; end; $$;
