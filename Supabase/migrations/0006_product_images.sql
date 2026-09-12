-- ============================================================
-- IyanjuWorld
-- Migration 0006: Product Images and Storage
-- ============================================================

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
--
-- Product images are intentionally public for marketplace
-- discovery. Upload, update, and delete operations remain
-- protected by Storage RLS policies.
--
-- File structure:
--
-- product-images/
--   <product-id>/
--     <image-file>
--
-- Example:
--
-- product-images/
--   7f8c.../
--     9a31....webp
--
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),

  product_id uuid not null
    references public.products(id)
    on delete cascade,

  storage_path text not null,

  alt_text text,

  sort_order integer not null default 0,

  is_primary boolean not null default false,

  created_at timestamptz not null default timezone('utc', now()),

  updated_at timestamptz not null default timezone('utc', now()),

  constraint product_images_storage_path_unique
    unique (storage_path),

  constraint product_images_sort_order_check
    check (sort_order >= 0),

  constraint product_images_storage_path_check
    check (
      length(trim(storage_path)) > 0
    )
);

-- ============================================================
-- PRODUCT IMAGE INDEXES
-- ============================================================

create index if not exists product_images_product_id_idx
  on public.product_images(product_id);

create index if not exists product_images_sort_order_idx
  on public.product_images(product_id, sort_order);

create index if not exists product_images_primary_idx
  on public.product_images(product_id, is_primary);

-- ============================================================
-- ONLY ONE PRIMARY IMAGE PER PRODUCT
-- ============================================================

create unique index if not exists
product_images_one_primary_per_product_idx
on public.product_images(product_id)
where is_primary = true;

-- ============================================================
-- PRODUCT IMAGE UPDATED_AT
-- ============================================================

drop trigger if exists product_images_set_updated_at
on public.product_images;

create trigger product_images_set_updated_at
before update on public.product_images
for each row
execute function public.set_updated_at();

-- ============================================================
-- PRODUCT IMAGE OWNERSHIP HELPER
-- ============================================================

create or replace function public.can_manage_product_image(
  p_product_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_product(p_product_id);
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.product_images enable row level security;

-- ============================================================
-- PUBLIC IMAGE RECORD READ
-- ============================================================
--
-- Only images belonging to publicly visible products should be
-- exposed through the application database.
--
-- ============================================================

drop policy if exists "Public can view product images"
on public.product_images;

create policy "Public can view product images"
on public.product_images
for select
to anon, authenticated
using (
  public.is_product_publicly_visible(product_id)
);

-- ============================================================
-- BUSINESS MEMBER IMAGE READ
-- ============================================================

drop policy if exists "Business members can view product images"
on public.product_images;

create policy "Business members can view product images"
on public.product_images
for select
to authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_images.product_id
      and public.is_business_member(p.business_id)
  )
);

-- ============================================================
-- BUSINESS MANAGER IMAGE INSERT
-- ============================================================

drop policy if exists "Business managers can create product images"
on public.product_images;

create policy "Business managers can create product images"
on public.product_images
for insert
to authenticated
with check (
  public.can_manage_product_image(product_id)
);

-- ============================================================
-- BUSINESS MANAGER IMAGE UPDATE
-- ============================================================

drop policy if exists "Business managers can update product images"
on public.product_images;

create policy "Business managers can update product images"
on public.product_images
for update
to authenticated
using (
  public.can_manage_product_image(product_id)
)
with check (
  public.can_manage_product_image(product_id)
);

-- ============================================================
-- BUSINESS MANAGER IMAGE DELETE
-- ============================================================

drop policy if exists "Business managers can delete product images"
on public.product_images;

create policy "Business managers can delete product images"
on public.product_images
for delete
to authenticated
using (
  public.can_manage_product_image(product_id)
);

-- ============================================================
-- ADMIN IMAGE MANAGEMENT
-- ============================================================

drop policy if exists "Admins can view all product images"
on public.product_images;

create policy "Admins can view all product images"
on public.product_images
for select
to authenticated
using (
  public.is_admin()
);

drop policy if exists "Admins can manage product images"
on public.product_images;

create policy "Admins can manage product images"
on public.product_images
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- ============================================================
-- STORAGE RLS
-- ============================================================
--
-- The first folder in every product image path must be the
-- product UUID.
--
-- Example:
--
-- <product-id>/image.webp
--
-- This lets Storage verify ownership through the products
-- table before allowing uploads, updates, or deletion.
--
-- ============================================================

-- ============================================================
-- PUBLIC STORAGE READ
-- ============================================================

drop policy if exists "Public can view product image files"
on storage.objects;

create policy "Public can view product image files"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-images'
);

-- ============================================================
-- BUSINESS MANAGER STORAGE INSERT
-- ============================================================

drop policy if exists "Business managers can upload product images"
on storage.objects;

create policy "Business managers can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(name))[1]
      and public.can_manage_product(p.id)
  )
);

-- ============================================================
-- BUSINESS MANAGER STORAGE UPDATE
-- ============================================================

drop policy if exists "Business managers can update product image files"
on storage.objects;

create policy "Business managers can update product image files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(name))[1]
      and public.can_manage_product(p.id)
  )
)
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(name))[1]
      and public.can_manage_product(p.id)
  )
);

-- ============================================================
-- BUSINESS MANAGER STORAGE DELETE
-- ============================================================

drop policy if exists "Business managers can delete product image files"
on storage.objects;

create policy "Business managers can delete product image files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.products p
    where p.id::text = (storage.foldername(name))[1]
      and public.can_manage_product(p.id)
  )
);

-- ============================================================
-- ADMIN STORAGE MANAGEMENT
-- ============================================================

drop policy if exists "Admins can manage product image files"
on storage.objects;

create policy "Admins can manage product image files"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_admin()
)
with check (
  bucket_id = 'product-images'
  and public.is_admin()
);

-- ============================================================
-- GRANTS
-- ============================================================

grant select
on public.product_images
to anon, authenticated;

grant insert, update, delete
on public.product_images
to authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.product_images is
  'Images associated with IyanjuWorld marketplace products.';

comment on column public.product_images.storage_path is
  'Supabase Storage path inside the product-images bucket.';

comment on column public.product_images.sort_order is
  'Display order of the product image.';

comment on column public.product_images.is_primary is
  'Identifies the primary image displayed for the product.';

comment on column public.product_images.alt_text is
  'Accessibility and SEO description for the product image.';
