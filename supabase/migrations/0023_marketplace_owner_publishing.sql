-- ============================================================
-- IyanjuWorld Migration 0019
-- Marketplace is database-driven and only business owners can publish.
-- Managers may prepare/edit products while they remain non-public.
-- ============================================================

-- A product can only become marketplace-visible when its business owner
-- performs the transition to an active/available product.
drop policy if exists "Business managers can update products" on public.products;

create policy "Business members can edit products but owners publish"
on public.products
for update
to authenticated
using (
  public.can_manage_product(id)
)
with check (
  public.can_manage_product(id)
  and (
    status <> 'active'
    or public.is_business_owner(business_id)
  )
);

-- Prevent non-owners from inserting a product that is immediately public.
drop policy if exists "Business managers can create products" on public.products;

create policy "Business members can create nonpublic products"
on public.products
for insert
to authenticated
with check (
  public.is_business_owner(business_id)
  and created_by = auth.uid()
);

-- Keep the database invariant explicit: only an owner can own a public
-- product state. This trigger also protects direct SQL/API paths that
-- might otherwise bypass the intended publication workflow.
create or replace function public.enforce_business_owner_product_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.status = 'active' or coalesce(new.active, false) = true) and not public.is_business_owner(new.business_id) then
    raise exception 'Only the business owner can publish products';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_business_owner_product_publish on public.products;
create trigger enforce_business_owner_product_publish
before insert or update on public.products
for each row
execute function public.enforce_business_owner_product_publish();
