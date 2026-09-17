-- ============================================================
-- IyanjuWorld
-- Migration 0025: Restore required marketplace RPCs
--
-- The frontend calls these RPCs, but the migration set did not
-- define them. This migration adds the secure implementations.
-- ============================================================

begin;

-- ============================================================
-- 1. BUSINESS CREATION
-- ============================================================

create or replace function public.create_business(
  p_name text,
  p_slug text,
  p_description text default null,
  p_phone text default null,
  p_whatsapp_number text default null,
  p_email text default null,
  p_address_line text default null,
  p_city text default null,
  p_state text default null,
  p_country text default 'Nigeria',
  p_latitude numeric default null,
  p_longitude numeric default null
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_business public.businesses;
  v_name text := nullif(trim(p_name), '');
  v_slug text := lower(trim(p_slug));
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTHENTICATION_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and role = 'business_owner'
      and is_active = true
  ) then
    raise exception using errcode = 'P0001', message = 'BUSINESS_OWNER_ACCOUNT_REQUIRED';
  end if;

  if v_name is null or length(v_name) < 2 then
    raise exception using errcode = 'P0001', message = 'BUSINESS_NAME_INVALID';
  end if;

  if v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception using errcode = 'P0001', message = 'BUSINESS_SLUG_INVALID';
  end if;

  if exists (select 1 from public.businesses where slug = v_slug) then
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
  end if;

  insert into public.businesses (
    name,
    slug,
    description,
    phone,
    whatsapp_number,
    email,
    address_line,
    city,
    state,
    country,
    latitude,
    longitude,
    status,
    is_verified,
    is_open,
    created_by
  )
  values (
    v_name,
    v_slug,
    nullif(trim(p_description), ''),
    nullif(trim(p_phone), ''),
    nullif(trim(p_whatsapp_number), ''),
    nullif(trim(p_email), ''),
    nullif(trim(p_address_line), ''),
    nullif(trim(p_city), ''),
    nullif(trim(p_state), ''),
    coalesce(nullif(trim(p_country), ''), 'Nigeria'),
    p_latitude,
    p_longitude,
    'pending',
    false,
    true,
    v_user_id
  )
  returning * into v_business;

  return v_business;
exception
  when unique_violation then
    raise exception using errcode = 'P0001', message = 'BUSINESS_ALREADY_EXISTS';
end;
$$;

-- ============================================================
-- 2. BUSINESS PRODUCT CREATION
-- ============================================================

create or replace function public.create_business_product(
  p_business_id uuid,
  p_category_id uuid,
  p_name text,
  p_slug text,
  p_description text default null,
  p_price numeric default 0,
  p_stock_quantity integer default 0,
  p_image_url text default null,
  p_active boolean default true
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_product public.products;
  v_name text := nullif(trim(p_name), '');
  v_slug text := lower(trim(p_slug));
  v_status public.product_status;
  v_available boolean;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTHENTICATION_REQUIRED';
  end if;

  if not public.is_business_owner(p_business_id) then
    raise exception using errcode = 'P0001', message = 'BUSINESS_OWNER_REQUIRED';
  end if;

  if v_name is null or length(v_name) < 2 then
    raise exception using errcode = 'P0001', message = 'PRODUCT_NAME_INVALID';
  end if;

  if p_price < 0 then
    raise exception using errcode = 'P0001', message = 'PRODUCT_PRICE_INVALID';
  end if;

  if p_stock_quantity < 0 then
    raise exception using errcode = 'P0001', message = 'PRODUCT_STOCK_INVALID';
  end if;

  if not exists (
    select 1
    from public.categories
    where id = p_category_id
      and is_active = true
  ) then
    raise exception using errcode = 'P0001', message = 'CATEGORY_NOT_AVAILABLE';
  end if;

  if v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception using errcode = 'P0001', message = 'PRODUCT_SLUG_INVALID';
  end if;

  if exists (
    select 1
    from public.products
    where business_id = p_business_id
      and slug = v_slug
  ) then
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
  end if;

  v_available := p_active and p_stock_quantity > 0;
  v_status := case
    when not p_active then 'draft'::public.product_status
    when p_stock_quantity <= 0 then 'out_of_stock'::public.product_status
    else 'active'::public.product_status
  end;

  insert into public.products (
    business_id,
    category_id,
    name,
    slug,
    description,
    price,
    stock_quantity,
    status,
    is_available,
    is_featured,
    image_url,
    created_by
  )
  values (
    p_business_id,
    p_category_id,
    v_name,
    v_slug,
    nullif(trim(p_description), ''),
    p_price,
    p_stock_quantity,
    v_status,
    v_available,
    false,
    nullif(trim(p_image_url), ''),
    v_user_id
  )
  returning * into v_product;

  return v_product;
exception
  when unique_violation then
    raise exception using errcode = 'P0001', message = 'PRODUCT_ALREADY_EXISTS';
end;
$$;

-- ============================================================
-- 3. PRODUCT IMAGE METADATA
-- ============================================================

create or replace function public.add_product_image(
  p_product_id uuid,
  p_storage_path text,
  p_alt_text text default null
)
returns public.product_images
language plpgsql
security definer
set search_path = public
as $$
declare
  v_image public.product_images;
  v_path text := nullif(trim(p_storage_path), '');
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTHENTICATION_REQUIRED';
  end if;

  if not public.is_business_owner((select business_id from public.products where id = p_product_id)) then
    raise exception using errcode = 'P0001', message = 'BUSINESS_OWNER_REQUIRED';
  end if;

  if v_path is null then
    raise exception using errcode = 'P0001', message = 'IMAGE_PATH_INVALID';
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
    v_path,
    nullif(trim(p_alt_text), ''),
    coalesce((select max(sort_order) + 1 from public.product_images where product_id = p_product_id), 0),
    not exists (select 1 from public.product_images where product_id = p_product_id)
  )
  returning * into v_image;

  update public.products
  set image_url = case
    when image_url is null or trim(image_url) = '' then v_path
    else image_url
  end
  where id = p_product_id;

  return v_image;
exception
  when unique_violation then
    raise exception using errcode = 'P0001', message = 'PRODUCT_IMAGE_ALREADY_EXISTS';
end;
$$;

-- ============================================================
-- 4. PUBLIC MARKETPLACE PRODUCT RPC
-- ============================================================

create or replace function public.get_marketplace_products(
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
as $$
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
    'metadata', p.metadata,
    'created_at', p.created_at,
    'updated_at', p.updated_at,
    'business', jsonb_build_object(
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
    'category', jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'slug', c.slug,
      'description', c.description,
      'image_url', c.image_url,
      'parent_id', c.parent_id,
      'active', c.is_active,
      'is_active', c.is_active
    ),
    'product_images', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', pi.id,
            'storage_path', pi.storage_path,
            'alt_text', pi.alt_text,
            'sort_order', pi.sort_order,
            'is_primary', pi.is_primary
          )
          order by pi.sort_order, pi.created_at
        )
        from public.product_images pi
        where pi.product_id = p.id
      ),
      '[]'::jsonb
    )
  )
  from public.products p
  join public.businesses b on b.id = p.business_id
  join public.categories c on c.id = p.category_id
  where p.status = 'active'
    and p.is_available = true
    and p.stock_quantity > 0
    and b.status = 'active'
    and c.is_active = true
    and (not p_featured or p.is_featured = true)
    and (p_category_id is null or p.category_id = p_category_id)
    and (p_business_id is null or p.business_id = p_business_id)
    and (
      nullif(trim(p_search), '') is null
      or p.name ilike '%' || trim(p_search) || '%'
      or coalesce(p.description, '') ilike '%' || trim(p_search) || '%'
      or b.name ilike '%' || trim(p_search) || '%'
      or c.name ilike '%' || trim(p_search) || '%'
    )
  order by p.is_featured desc, p.created_at desc
  limit least(greatest(coalesce(p_limit, 1000), 1), 1000);
$$;

-- ============================================================
-- 5. RPC ACCESS
-- ============================================================

revoke all on function public.create_business(text,text,text,text,text,text,text,text,text,text,numeric,numeric) from public;
revoke all on function public.create_business_product(uuid,uuid,text,text,text,numeric,integer,text,boolean) from public;
revoke all on function public.add_product_image(uuid,text,text) from public;
revoke all on function public.get_marketplace_products(boolean,uuid,uuid,text,integer) from public;

grant execute on function public.create_business(text,text,text,text,text,text,text,text,text,text,numeric,numeric) to authenticated;
grant execute on function public.create_business_product(uuid,uuid,text,text,text,numeric,integer,text,boolean) to authenticated;
grant execute on function public.add_product_image(uuid,text,text) to authenticated;
grant execute on function public.get_marketplace_products(boolean,uuid,uuid,text,integer) to anon, authenticated;

commit;
