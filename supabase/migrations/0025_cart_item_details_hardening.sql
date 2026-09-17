-- ============================================================
-- IyanjuWorld
-- Migration 0024: Cart item details hardening
--
-- Fixes the runtime cart error caused by migration 0018 replacing
-- cart_item_details without created_at/updated_at, while also
-- restoring security-invoker semantics so cart RLS is respected.
-- ============================================================

begin;

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

grant select on public.cart_item_details to authenticated;

comment on view public.cart_item_details is
'Frontend-friendly cart item information using authoritative product data, cart timestamps, and invoker RLS.';

commit;
