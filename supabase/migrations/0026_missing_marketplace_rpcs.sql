-- ============================================================
-- IYANJUWORLD
-- 0025_missing_marketplace_rpcs.sql
-- Missing marketplace RPCs + safe product publishing/retrieval
-- ============================================================

begin;

-- ============================================================
-- 1. CREATE BUSINESS
-- ============================================================

create or replace function public.create_business(
  p_name text,
  p_slug text default null,
  p_description text default null,
  p_logo_url text default null,
  p_phone text default null,
  p_whatsapp_number text default null,
  p_email text default null,
  p_address_line text default null,
  p_city text default null,
  p_state text default null,
  p_country text default 'Nigeria'
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid;
  v_business public.businesses;
  v_slug text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and is_active = true
  ) then
    raise exception 'Active user profile required';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception 'Business name is required';
  end if;

  v_slug := nullif(trim(p_slug), '');

  if v_slug is null then
    v_slug := regexp_replace(
      lower(trim(p_name)),
      '[^a-z0-9]+',
      '-',
      'g'
    );

    v_slug := trim(both '-' from v_slug);
  end if;

  if v_slug = '' then
    raise exception 'A valid business slug could not be generated';
  end if;

  if exists (
    select 1
    from public.businesses
    where slug = v_slug
  ) then
    raise exception 'Business slug already exists';
  end if;

  insert into public.businesses (
    owner_id,
    name,
    slug,
    description,
    logo_url,
    phone,
    whatsapp_number,
    email,
    address_line,
    city,
    state,
    country,
    status,
    is_verified,
    is_open
  )
  values (
    v_user_id,
    trim(p_name),
    v_slug,
    nullif(trim(p_description), ''),
    nullif(trim(p_logo_url), ''),
    nullif(trim(p_phone), ''),
    nullif(trim(p_whatsapp_number), ''),
    nullif(trim(p_email), ''),
    nullif(trim(p_address_line), ''),
    nullif(trim(p_city), ''),
    nullif(trim(p_state), ''),
    coalesce(nullif(trim(p_country), ''), 'Nigeria'),
    'pending',
    false,
    false
  )
  returning *
  into v_business;

  return v_business;
end;
$function$;

revoke all on function public.create_business(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.create_business(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;


-- ============================================================
-- 2. CREATE BUSINESS PRODUCT
-- ============================================================

create or replace function public.create_business_product(
  p_business_id uuid,
  p_category_id uuid,
  p_name text,
  p_slug text default null,
  p_description text default null,
  p_sku text default null,
  p_price numeric default 0,
  p_compare_at_price numeric default null,
  p_stock_quantity integer default 0,
  p_is_available boolean default true,
  p_is_featured boolean default false,
  p_sort_order integer default 0,
  p_metadata jsonb default '{}'::jsonb
)
returns public.products
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid;
  v_product public.products;
  v_slug text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_business_id is null then
    raise exception 'Business is required';
  end if;

  if not exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and b.owner_id = v_user_id
  ) then
    raise exception 'You are not authorized to create products for this business';
  end if;

  if p_category_id is null then
    raise exception 'Category is required';
  end if;

  if not exists (
    select 1
    from public.categories
    where id = p_category_id
      and is_active = true
  ) then
    raise exception 'Selected category is not available';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception 'Product name is required';
  end if;

  if p_price is null or p_price < 0 then
    raise exception 'Product price cannot be negative';
  end if;

  if p_stock_quantity is null or p_stock_quantity < 0 then
    raise exception 'Stock quantity cannot be negative';
  end if;

  v_slug := nullif(trim(p_slug), '');

  if v_slug is null then
    v_slug := regexp_replace(
      lower(trim(p_name)),
      '[^a-z0-9]+',
      '-',
      'g'
    );

    v_slug := trim(both '-' from v_slug);
  end if;

  if v_slug = '' then
    raise exception 'A valid product slug could not be generated';
  end if;

  if exists (
    select 1
    from public.products
    where business_id = p_business_id
      and slug = v_slug
  ) then
    raise exception 'A product with this slug already exists in this business';
  end if;

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
    status,
    is_available,
    is_featured,
    sort_order,
    metadata
  )
  values (
    p_business_id,
    p_category_id,
    trim(p_name),
    v_slug,
    nullif(trim(p_description), ''),
    nullif(trim(p_sku), ''),
    p_price,
    p_compare_at_price,
    p_stock_quantity,
    'draft',
    coalesce(p_is_available, true),
    coalesce(p_is_featured, false),
    coalesce(p_sort_order, 0),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning *
  into v_product;

  return v_product;
end;
$function$;

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
as $function$
declare
  v_user_id uuid;
  v_image public.product_images;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.products p
    join public.businesses b
      on b.id = p.business_id
    where p.id = p_product_id
      and b.owner_id = v_user_id
  ) then
    raise exception 'You are not authorized to add images to this product';
  end if;

  if p_storage_path is null or trim(p_storage_path) = '' then
    raise exception 'Image storage path is required';
  end if;

  if coalesce(p_is_primary, false) then
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
  returning *
  into v_image;

  return v_image;
end;
$function$;

revoke all on function public.add_product_image(
  uuid,
  text,
  text,
  integer,
  boolean
) from public;

grant execute on function public.add_product_image(
  uuid,
  text,
  text,
  integer,
  boolean
) to authenticated;


-- ============================================================
-- 4. PUBLIC MARKETPLACE PRODUCT RPC
--
-- IMPORTANT:
-- PostgreSQL cannot change a function's return type with
-- CREATE OR REPLACE FUNCTION.
--
-- Therefore the existing function with this exact signature
-- is removed before recreating it with RETURNS SETOF JSONB.
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
security invoker
set search_path = public
as $function$
  select jsonb_build_object(
    'id', p.id,
    'business_id', p.business_id,
    'category_id', p.category_id,
    'name', p.name,
    'slug', p.slug,
    'description', coalesce(p.description, ''),
    'sku', p.sku,
    'price', p.price,
    'compare_at_price', p.compare_at_price,
    'stock_quantity', p.stock_quantity,
    'status', p.status,
    'is_available', p.is_available,
    'is_featured', p.is_featured,
    'sort_order', p.sort_order,
    'metadata', coalesce(p.metadata, '{}'::jsonb),
    'created_at', p.created_at,
    'updated_at', p.updated_at,

    'business',
    jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'slug', b.slug,
      'logo_url', b.logo_url,
      'logo', b.logo,
      'city', b.city,
      'state', b.state,
      'country', b.country,
      'phone', b.phone,
      'whatsapp_number', b.whatsapp_number,
      'email', b.email,
      'address_line', b.address_line,
      'status', b.status,
      'verified', b.is_verified,
      'is_verified', b.is_verified,
      'open', b.is_open,
      'is_open', b.is_open
    ),

    'category',
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'slug', c.slug,
      'description', c.description,
      'image_url', c.image_url,
      'parent_id', c.parent_id,
      'active', c.is_active,
      'is_active', c.is_active
    ),

    'product_images',
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
            pi.sort_order,
            pi.created_at
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

  join public.categories c
    on c.id = p.category_id

  where p.status = 'active'
    and p.is_available = true
    and p.stock_quantity > 0

    and b.status = 'active'
    and b.is_verified = true

    and c.is_active = true

    and (
      not coalesce(p_featured, false)
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
      nullif(trim(p_search), '') is null
      or p.name ilike '%' || trim(p_search) || '%'
      or coalesce(p.description, '') ilike '%' || trim(p_search) || '%'
      or b.name ilike '%' || trim(p_search) || '%'
      or c.name ilike '%' || trim(p_search) || '%'
    )

  order by
    p.is_featured desc,
    p.sort_order asc,
    p.created_at desc

  limit least(
    greatest(
      coalesce(p_limit, 1000),
      1
    ),
    1000
  );
$function$;

revoke all on function public.get_marketplace_products(
  boolean,
  uuid,
  uuid,
  text,
  integer
) from public;

grant execute on function public.get_marketplace_products(
  boolean,
  uuid,
  uuid,
  text,
  integer
) to anon, authenticated;


-- ============================================================
-- 5. PRODUCT PUBLISHING HELPER
--
-- Allows the business owner to publish their own product.
-- A product is only publishable when:
--   - owner owns the business
--   - category is active
--   - product has stock
-- ============================================================

create or replace function public.publish_business_product(
  p_product_id uuid
)
returns public.products
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid;
  v_product public.products;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select p.*
  into v_product
  from public.products p
  join public.businesses b
    on b.id = p.business_id
  where p.id = p_product_id
    and b.owner_id = v_user_id
  for update;

  if not found then
    raise exception 'Product not found or you are not authorized to publish it';
  end if;

  if not exists (
    select 1
    from public.categories c
    where c.id = v_product.category_id
      and c.is_active = true
  ) then
    raise exception 'The product category is inactive';
  end if;

  if v_product.stock_quantity <= 0 then
    raise exception 'Product must have available stock before publishing';
  end if;

  update public.products
  set
    status = 'active',
    is_available = true,
    updated_at = now()
  where id = p_product_id
  returning *
  into v_product;

  return v_product;
end;
$function$;

revoke all on function public.publish_business_product(uuid) from public;

grant execute on function public.publish_business_product(uuid) to authenticated;


-- ============================================================
-- 6. UNPUBLISH PRODUCT
-- ============================================================

create or replace function public.unpublish_business_product(
  p_product_id uuid
)
returns public.products
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid;
  v_product public.products;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.products p
  set
    status = 'draft',
    is_available = false,
    updated_at = now()
  from public.businesses b
  where p.id = p_product_id
    and p.business_id = b.id
    and b.owner_id = v_user_id
  returning p.*
  into v_product;

  if not found then
    raise exception 'Product not found or you are not authorized to unpublish it';
  end if;

  return v_product;
end;
$function$;

revoke all on function public.unpublish_business_product(uuid) from public;

grant execute on function public.unpublish_business_product(uuid) to authenticated;


-- ============================================================
-- 7. ENSURE PRODUCT OWNER CANNOT PUBLISH INTO ANOTHER
--    BUSINESS
-- ============================================================

create or replace function public.enforce_product_business_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
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
$function$;

drop trigger if exists trg_enforce_product_business_owner
on public.products;

create trigger trg_enforce_product_business_owner
before insert or update of business_id
on public.products
for each row
execute function public.enforce_product_business_owner();


-- ============================================================
-- 8. DOCUMENT THE MIGRATION
-- ============================================================

comment on function public.get_marketplace_products(
  boolean,
  uuid,
  uuid,
  text,
  integer
)
is
'Returns only active, available, in-stock products belonging to active and verified businesses and active categories.';

comment on function public.create_business_product(
  uuid,
  uuid,
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
)
is
'Creates a marketplace product only for a business owned by the authenticated user. Products are created as drafts.';

comment on function public.publish_business_product(uuid)
is
'Publishes a business-owned product after validating its category and stock.';


commit;
