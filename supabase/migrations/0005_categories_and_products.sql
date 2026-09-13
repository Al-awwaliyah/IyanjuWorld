-- ============================================================
-- IyanjuWorld
-- Migration 0005: Categories and Products
-- ============================================================

-- ============================================================
-- PRODUCT STATUS
-- ============================================================

do $$
begin
  create type public.product_status as enum (
    'draft',
    'active',
    'out_of_stock',
    'archived',
    'suspended'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- CATEGORIES
-- ============================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  slug text not null,

  description text,

  image_url text,

  parent_id uuid
    references public.categories(id)
    on delete restrict,

  sort_order integer not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default timezone('utc', now()),

  updated_at timestamptz not null default timezone('utc', now()),

  constraint categories_name_check
    check (length(trim(name)) >= 2),

  constraint categories_slug_unique
    unique (slug),

  constraint categories_slug_check
    check (
      slug = lower(slug)
      and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),

  constraint categories_sort_order_check
    check (sort_order >= 0),

  constraint categories_no_self_parent
    check (
      parent_id is null
      or parent_id <> id
    )
);

-- ============================================================
-- CATEGORY INDEXES
-- ============================================================

create index if not exists categories_parent_id_idx
  on public.categories(parent_id);

create index if not exists categories_active_idx
  on public.categories(is_active);

create index if not exists categories_sort_order_idx
  on public.categories(sort_order);

-- ============================================================
-- CATEGORY UPDATED_AT
-- ============================================================

drop trigger if exists categories_set_updated_at
on public.categories;

create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

-- ============================================================
-- PRODUCTS
-- ============================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete restrict,

  category_id uuid not null
    references public.categories(id)
    on delete restrict,

  name text not null,

  slug text not null,

  description text,

  sku text,

  price numeric(18,2) not null,

  compare_at_price numeric(18,2),

  stock_quantity integer not null default 0,

  status public.product_status not null default 'draft',

  is_available boolean not null default true,

  is_featured boolean not null default false,

  sort_order integer not null default 0,

  metadata jsonb not null default '{}'::jsonb,

  created_by uuid not null
    references public.profiles(id)
    on delete restrict,

  created_at timestamptz not null default timezone('utc', now()),

  updated_at timestamptz not null default timezone('utc', now()),

  constraint products_name_check
    check (length(trim(name)) >= 2),

  constraint products_price_check
    check (price >= 0),

  constraint products_compare_at_price_check
    check (
      compare_at_price is null
      or compare_at_price >= price
    ),

  constraint products_stock_quantity_check
    check (stock_quantity >= 0),

  constraint products_sort_order_check
    check (sort_order >= 0),

  constraint products_slug_check
    check (
      slug = lower(slug)
      and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    )
);

-- ============================================================
-- PRODUCT SLUG INDEX
-- ============================================================
--
-- A product slug only needs to be unique within its business.
-- This allows different businesses to use the same product
-- slug without collision.
--
-- ============================================================

create unique index if not exists products_business_slug_unique_idx
on public.products (
  business_id,
  slug
);

-- ============================================================
-- SKU INDEX
-- ============================================================
--
-- SKU is optional, but when provided it should be unique
-- within the business.
--
-- ============================================================

create unique index if not exists products_business_sku_unique_idx
on public.products (
  business_id,
  sku
)
where sku is not null;

-- ============================================================
-- PRODUCT INDEXES
-- ============================================================

create index if not exists products_business_id_idx
  on public.products(business_id);

create index if not exists products_category_id_idx
  on public.products(category_id);

create index if not exists products_status_idx
  on public.products(status);

create index if not exists products_available_idx
  on public.products(is_available);

create index if not exists products_featured_idx
  on public.products(is_featured);

create index if not exists products_created_at_idx
  on public.products(created_at desc);

create index if not exists products_price_idx
  on public.products(price);

-- ============================================================
-- PRODUCT UPDATED_AT
-- ============================================================

drop trigger if exists products_set_updated_at
on public.products;

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

-- ============================================================
-- PRODUCT OWNERSHIP HELPER
-- ============================================================

create or replace function public.can_manage_product(
  p_product_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.products p
    where p.id = p_product_id
      and public.can_manage_business(p.business_id)
  );
$$;

-- ============================================================
-- PRODUCT PUBLIC VISIBILITY HELPER
-- ============================================================

create or replace function public.is_product_publicly_visible(
  p_product_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.products p
    inner join public.businesses b
      on b.id = p.business_id
    inner join public.categories c
      on c.id = p.category_id
    where p.id = p_product_id
      and p.status = 'active'
      and p.is_available = true
      and p.stock_quantity > 0
      and b.status = 'active'
      and c.is_active = true
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.categories enable row level security;

alter table public.products enable row level security;

-- ============================================================
-- CATEGORY PUBLIC READ
-- ============================================================

drop policy if exists "Public can view active categories"
on public.categories;

create policy "Public can view active categories"
on public.categories
for select
to anon, authenticated
using (
  is_active = true
);

-- ============================================================
-- CATEGORY ADMIN READ
-- ============================================================

drop policy if exists "Admins can view all categories"
on public.categories;

create policy "Admins can view all categories"
on public.categories
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- CATEGORY ADMIN INSERT
-- ============================================================

drop policy if exists "Admins can create categories"
on public.categories;

create policy "Admins can create categories"
on public.categories
for insert
to authenticated
with check (
  public.is_admin()
);

-- ============================================================
-- CATEGORY ADMIN UPDATE
-- ============================================================

drop policy if exists "Admins can update categories"
on public.categories;

create policy "Admins can update categories"
on public.categories
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- ============================================================
-- CATEGORY ADMIN DELETE
-- ============================================================
--
-- Categories should normally be deactivated rather than deleted,
-- especially after products have been assigned to them.
--
-- Therefore physical deletion is intentionally restricted.
--
-- ============================================================

-- No DELETE policy is granted to normal authenticated users.

-- ============================================================
-- PRODUCT PUBLIC READ
-- ============================================================

drop policy if exists "Public can view active products"
on public.products;

create policy "Public can view active products"
on public.products
for select
to anon, authenticated
using (
  status = 'active'
  and is_available = true
  and stock_quantity > 0
  and exists (
    select 1
    from public.businesses b
    where b.id = products.business_id
      and b.status = 'active'
  )
  and exists (
    select 1
    from public.categories c
    where c.id = products.category_id
      and c.is_active = true
  )
);

-- ============================================================
-- BUSINESS MEMBER PRODUCT READ
-- ============================================================

drop policy if exists "Business members can view their products"
on public.products;

create policy "Business members can view their products"
on public.products
for select
to authenticated
using (
  public.is_business_member(business_id)
);

-- ============================================================
-- BUSINESS MEMBER PRODUCT CREATE
-- ============================================================

drop policy if exists "Business managers can create products"
on public.products;

create policy "Business managers can create products"
on public.products
for insert
to authenticated
with check (
  public.can_manage_business(business_id)
  and created_by = auth.uid()
);

-- ============================================================
-- BUSINESS MEMBER PRODUCT UPDATE
-- ============================================================

drop policy if exists "Business managers can update products"
on public.products;

create policy "Business managers can update products"
on public.products
for update
to authenticated
using (
  public.can_manage_product(id)
)
with check (
  public.can_manage_product(id)
);

-- ============================================================
-- PRODUCT DELETE
-- ============================================================
--
-- Products are archived instead of physically deleted.
-- This preserves order history and financial references.
--
-- ============================================================

-- No DELETE policy is granted to business users.

-- ============================================================
-- ADMIN PRODUCT READ
-- ============================================================

drop policy if exists "Admins can view all products"
on public.products;

create policy "Admins can view all products"
on public.products
for select
to authenticated
using (
  public.is_admin()
);

-- ============================================================
-- ADMIN PRODUCT UPDATE
-- ============================================================

drop policy if exists "Admins can update products"
on public.products;

create policy "Admins can update products"
on public.products
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- ============================================================
-- GRANTS
-- ============================================================

grant select
on public.categories
to anon, authenticated;

grant select
on public.products
to anon, authenticated;

grant insert, update
on public.categories
to authenticated;

grant insert, update
on public.products
to authenticated;

-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.categories is
  'IyanjuWorld product categories and optional subcategories.';

comment on table public.products is
  'Products listed by IyanjuWorld businesses for public marketplace discovery.';

comment on column public.products.price is
  'Current customer-facing selling price in NGN.';

comment on column public.products.compare_at_price is
  'Optional previous/reference price used to display discounts.';

comment on column public.products.stock_quantity is
  'Current available inventory quantity.';

comment on column public.products.status is
  'Product lifecycle status. Archived products remain in the database for historical integrity.';

comment on column public.products.is_available is
  'Whether the business currently allows customers to purchase the product.';

comment on column public.products.metadata is
  'Extensible product attributes reserved for future variants and marketplace features.';
