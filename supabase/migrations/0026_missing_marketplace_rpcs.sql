-- ============================================================
-- 0025_missing_marketplace_rpcs.sql
-- IyanjuWorld marketplace RPC hardening
--
-- IMPORTANT:
-- This migration is written against the actual IyanjuWorld
-- products schema.
--
-- Authoritative products columns used here:
--   id
--   business_id
--   category_id
--   name
--   slug
--   description
--   sku
--   price
--   compare_at_price
--   stock_quantity
--   status
--   is_available
--   is_featured
--   sort_order
--   metadata
--   created_by
--   created_at
--   updated_at
--
-- There is NO products.currency column.
-- There is NO products.low_stock_threshold column.
-- ============================================================

begin;


-- ============================================================
-- 1. CREATE BUSINESS
-- ============================================================

create or replace function public.create_business(
  p_name text,
  p_slug text,
  p_description text default null,
  p_phone text default null,
  p_address text default null,
  p_logo_url text default null
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'business_owner'
      and p.is_active = true
  ) then
    raise exception 'Only active business owners can create businesses';
  end if;

  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'Business name is required';
  end if;

  if nullif(trim(coalesce(p_slug, '')), '') is null then
    raise exception 'Business slug is required';
  end if;

  insert into public.businesses (
    owner_id,
    name,
    slug,
    description,
    phone,
    address,
    logo_url
  )
  values (
    auth.uid(),
    trim(p_name),
    trim(p_slug),
    nullif(trim(p_description), ''),
    nullif(trim(p_phone), ''),
    nullif(trim(p_address), ''),
    nullif(trim(p_logo_url), '')
  )
  returning * into v_business;

  return v_business;
end;
$$;


-- ============================================================
-- 2. CREATE BUSINESS PRODUCT
-- ============================================================

create or replace function public.create_business_product(
  p_business_id uuid,
  p_category_id uuid,
  p_name text,
  p_slug text,
  p_description text default null,
  p_sku text default null,
  p_currency text default 'NGN',
  p_price numeric default 0,
  p_compare_at_price numeric default null,
  p_stock integer default 0,
  p_available boolean default true,
  p_featured boolean default false,
  p_low_stock_threshold integer default 5,
  p_metadata jsonb default '{}'::jsonb
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and b.owner_id = auth.uid()
  ) then
    raise exception 'You do not own this business';
  end if;

  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'Product name is required';
  end if;

  if nullif(trim(coalesce(p_slug, '')), '') is null then
    raise exception 'Product slug is required';
  end if;

  if p_price is null or p_price < 0 then
    raise exception 'Product price cannot be negative';
  end if;

  if p_stock is null or p_stock < 0 then
    raise exception 'Product stock cannot be negative';
  end if;

  if p_compare_at_price is not null
     and p_compare_at_price < 0 then
    raise exception 'Compare-at price cannot be negative';
  end if;

  /*
   * p_currency is intentionally accepted for frontend/API
   * compatibility, but products does not have a currency column.
   *
   * IyanjuWorld marketplace prices are currently treated as NGN.
   */

  insert into public.products (
    business_id,
    category_id,
    name,
    slug,
    description,
    sku,
    price,
    compare_at_price,
    stock_quantity,
    is_available,
    is_featured,
    metadata
  )
  values (
    p_business_id,
    p_category_id,
    trim(p_name),
    trim(p_slug),
    nullif(trim(p_description), ''),
    nullif(trim(p_sku), ''),
    p_price,
    p_compare_at_price,
    p_stock,
    coalesce(p_available, true),
    coalesce(p_featured, false),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_product;

  return v_product;
end;
$$;


-- ============================================================
-- 3. ADD PRODUCT IMAGE
-- ============================================================

create or replace function public.add_product_image(
  p_product_id uuid,
  p_storage_path text,
  p_alt_text text default null,
  p_sort_order integer default 0,
  p_is_primary boolean default false
)
returns public.product_images
language plpgsql
security definer
set search_path = public
as $$
declare
  v_image public.product_images;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(coalesce(p_storage_path, '')), '') is null then
    raise exception 'Product image storage path is required';
  end if;

  if not exists (
    select 1
    from public.products pr
    join public.businesses b
      on b.id = pr.business_id
    where pr.id = p_product_id
      and b.owner_id = auth.uid()
  ) then
    raise exception 'You do not own this product';
  end if;

  if p_is_primary then
    update public.product_images
    set is_primary = false
    where product_id = p_product_id;
  end if;

  insert into public.product_images (
    product_id,
    storage_path,
    alt_text,
    sort_order,
    is_primary
  )
  values (
    p_product_id,
    trim(p_storage_path),
    nullif(trim(p_alt_text), ''),
    coalesce(p_sort_order, 0),
    coalesce(p_is_primary, false)
  )
  returning * into v_image;

  return v_image;
end;
$$;


-- ============================================================
-- 4. PUBLIC MARKETPLACE PRODUCT RPC
-- ============================================================

drop function if exists public.get_marketplace_products(
  boolean,
  uuid,
  uuid,
  text,
  integer
);

create function public.get_marketplace_products(
  p_featured boolean default false,
  p_category_id uuid default null,
  p_business_id uuid default null,
  p_search text default null,
  p_limit integer default 1000
)
returns setof jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id,
    'business_id', p.business_id,
    'category_id', p.category_id,
    'name', p.name,
    'slug', p.slug,
    'description', p.description,
    'sku', p.sku,

    /*
     * IyanjuWorld currently uses NGN marketplace pricing.
     * products.currency does not exist in the schema.
     */
    'currency', 'NGN',

    'price', p.price,
    'compare_at_price', p.compare_at_price,

    'stock', p.stock_quantity,
    'available', p.is_available,
    'featured', p.is_featured,

    'metadata', coalesce(p.metadata, '{}'::jsonb),
    'created_at', p.created_at,
    'updated_at', p.updated_at,

    'business', jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'slug', b.slug,
      'logo_url', b.logo_url
    ),

    'category',
    case
      when c.id is null then null
      else jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug
      )
    end,

    'images',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', pi.id,
            'storage_path', pi.storage_path,
            'alt_text', pi.alt_text,
            'sort_order', pi.sort_order,
            'is_primary', pi.is_primary
          )
          order by
            pi.is_primary desc,
            pi.sort_order asc,
            pi.created_at asc
        )
        from public.product_images pi
        where pi.product_id = p.id
      ),
      '[]'::jsonb
    )
  )
  from public.products p
  join public.businesses b
    on b.id = p.business_id
  left join public.categories c
    on c.id = p.category_id

  where p.is_available = true
    and coalesce(p.stock_quantity, 0) > 0

    and (
      coalesce(p_featured, false) = false
      or p.is_featured = true
    )

    and (
      p_category_id is null
      or p.category_id = p_category_id
    )

    and (
      p_business_id is null
      or p.business_id = p_business_id
    )

    and (
      p_search is null
      or trim(p_search) = ''
      or p.name ilike '%' || trim(p_search) || '%'
      or coalesce(p.description, '') ilike '%' || trim(p_search) || '%'
      or b.name ilike '%' || trim(p_search) || '%'
    )

  order by
    p.is_featured desc,
    p.created_at desc

  limit greatest(
    1,
    least(
      coalesce(p_limit, 1000),
      1000
    )
  );
$$;


-- ============================================================
-- 5. PUBLISH BUSINESS PRODUCT
-- ============================================================

create or replace function public.publish_business_product(
  p_product_id uuid
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.products p
  set
    is_available = true,
    updated_at = now()
  from public.businesses b
  where p.id = p_product_id
    and b.id = p.business_id
    and b.owner_id = auth.uid()
  returning p.* into v_product;

  if v_product.id is null then
    raise exception 'Product not found or you do not own this product';
  end if;

  return v_product;
end;
$$;


-- ============================================================
-- 6. UNPUBLISH BUSINESS PRODUCT
-- ============================================================

create or replace function public.unpublish_business_product(
  p_product_id uuid
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.products p
  set
    is_available = false,
    updated_at = now()
  from public.businesses b
  where p.id = p_product_id
    and b.id = p.business_id
    and b.owner_id = auth.uid()
  returning p.* into v_product;

  if v_product.id is null then
    raise exception 'Product not found or you do not own this product';
  end if;

  return v_product;
end;
$$;


-- ============================================================
-- 7. PRODUCT OWNERSHIP / BUSINESS EXISTENCE TRIGGER
-- ============================================================

create or replace function public.enforce_product_business_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.businesses b
    where b.id = new.business_id
  ) then
    raise exception 'Business does not exist';
  end if;

  return new;
end;
$$;


drop trigger if exists trg_enforce_product_business_owner
on public.products;


create trigger trg_enforce_product_business_owner
before insert or update of business_id
on public.products
for each row
execute function public.enforce_product_business_owner();


-- ============================================================
-- 8. FUNCTION PERMISSIONS
-- ============================================================

revoke all on function public.create_business(
  text,
  text,
  text,
  text,
  text,
  text
) from public;

revoke all on function public.create_business_product(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  integer,
  boolean,
  boolean,
  integer,
  jsonb
) from public;

revoke all on function public.add_product_image(
  uuid,
  text,
  text,
  integer,
  boolean
) from public;

revoke all on function public.get_marketplace_products(
  boolean,
  uuid,
  uuid,
  text,
  integer
) from public;

revoke all on function public.publish_business_product(
  uuid
) from public;

revoke all on function public.unpublish_business_product(
  uuid
) from public;


-- ============================================================
-- 9. GRANT EXECUTE
-- ============================================================

grant execute on function public.create_business(
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;

grant execute on function public.create_business_product(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  integer,
  boolean,
  boolean,
  integer,
  jsonb
) to authenticated;

grant execute on function public.add_product_image(
  uuid,
  text,
  text,
  integer,
  boolean
) to authenticated;

grant execute on function public.get_marketplace_products(
  boolean,
  uuid,
  uuid,
  text,
  integer
) to anon, authenticated;

grant execute on function public.publish_business_product(
  uuid
) to authenticated;

grant execute on function public.unpublish_business_product(
  uuid
) to authenticated;


commit;
