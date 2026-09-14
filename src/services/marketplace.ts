import { useEffect, useState } from "react";
import { supabase } from "@/libs/supabase";

export type MarketplaceProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string;
  images: string[];
  businessId: string;
  businessName: string;
  businessSlug: string;
  categoryId: string;
  category: string;
  categorySlug: string;
  city: string;
  state: string;
  stock: number;
  available: boolean;
  featured: boolean;
  verifiedBusiness: boolean;
  categoryName?: string;
  createdAt: string;
};

export type MarketplaceBusiness = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  coverImage: string;
  description: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  verified: boolean;
  open: boolean;
  productCount: number;
  products: MarketplaceProduct[];
};

export type MarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string | null;
  productCount: number;
  value?: string;
  label?: string;
};

type RawProduct = Record<string, any>;
type RawBusiness = Record<string, any>;
type RawCategory = Record<string, any>;

const PUBLIC_PRODUCT_SELECT = `
  id,name,slug,description,price,compare_at_price,stock_quantity,
  status,is_available,is_featured,created_at,image_url,business_id,category_id,
  businesses:businesses!products_business_id_fkey(
    id,name,slug,logo,cover,description,city,state,country,phone,whatsapp,email,address,
    verified,open,status,is_verified,is_open
  ),
  categories:categories!products_category_id_fkey(
    id,name,slug,description,image_url,parent_id,is_active
  ),
  product_images:product_images!product_images_product_id_fkey(
    id,storage_path,sort_order,is_primary,alt_text
  )
`;

function publicImage(storagePath?: string | null) {
  if (!storagePath) return "";
  return supabase.storage.from("product-images").getPublicUrl(storagePath).data.publicUrl;
}

function mapProduct(row: RawProduct): MarketplaceProduct {
  const business = row.businesses ?? {};
  const category = row.categories ?? {};
  const imageRows = Array.isArray(row.product_images) ? row.product_images : [];
  const imageUrls = imageRows
    .sort((a: any, b: any) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((image: any) => publicImage(image.storage_path))
    .filter(Boolean);

  const primary = imageRows.find((image: any) => image.is_primary);
  const primaryUrl = publicImage(primary?.storage_path) || row.image_url || imageUrls[0] || "";

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    price: Number(row.price ?? 0),
    compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
    imageUrl: primaryUrl,
    images: imageUrls.length ? imageUrls : primaryUrl ? [primaryUrl] : [],
    businessId: row.business_id,
    businessName: business.name ?? "Business",
    businessSlug: business.slug ?? "",
    categoryId: row.category_id,
    category: category.name ?? "Uncategorized",
    categoryName: category.name ?? "Uncategorized",
    categorySlug: category.slug ?? "",
    city: business.city ?? "",
    state: business.state ?? "",
    stock: Number(row.stock_quantity ?? 0),
    available: row.status === "active" && row.is_available === true && Number(row.stock_quantity ?? 0) > 0,
    featured: row.is_featured === true,
    verifiedBusiness: business.is_verified === true || business.verified === true,
    createdAt: row.created_at ?? "",
  };
}

function mapBusiness(row: RawBusiness, products: MarketplaceProduct[] = []): MarketplaceBusiness {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo_url ?? row.logo ?? "",
    logoUrl: row.logo_url ?? row.logo ?? "",
    coverImage: row.cover_image_url ?? row.cover ?? "",
    coverUrl: row.cover_image_url ?? row.cover ?? "",
    description: row.description ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    country: row.country ?? "Nigeria",
    phone: row.phone ?? "",
    whatsapp: row.whatsapp_number ?? row.whatsapp ?? "",
    email: row.email ?? "",
    address: row.address_line ?? row.address ?? "",
    verified: row.is_verified === true || row.verified === true,
    open: row.is_open !== false && row.open !== false,
    category: products[0]?.category ?? "Marketplace",
    categorySlug: products[0]?.categorySlug ?? "",
    productCount: products.length,
    products,
  };
}

export async function listMarketplaceProducts(options: {
  featured?: boolean;
  categoryId?: string;
  businessId?: string;
  search?: string;
  limit?: number;
} = {}) {
  let query = supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("status", "active")
    .eq("is_available", true)
    .gt("stock_quantity", 0)
    .order("created_at", { ascending: false });

  if (options.featured) query = query.eq("is_featured", true);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.businessId) query = query.eq("business_id", options.businessId);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;

  let products = (data ?? []).map(mapProduct);
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    products = products.filter((p) =>
      [p.name, p.description, p.businessName, p.category, p.city, p.state]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }
  return products;
}

export async function getMarketplaceProduct(productIdOrSlug: string) {
  const bySlug = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("slug", productIdOrSlug)
    .maybeSingle();

  if (bySlug.error) throw bySlug.error;
  if (bySlug.data) return mapProduct(bySlug.data);

  const byId = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("id", productIdOrSlug)
    .maybeSingle();

  if (byId.error) throw byId.error;
  return byId.data ? mapProduct(byId.data) : null;
}

export async function listMarketplaceCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,image_url,parent_id,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  const products = await listMarketplaceProducts({ limit: 1000 });
  const counts = new Map<string, number>();
  products.forEach((p) => counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1));

  return ((data ?? []) as RawCategory[]).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    imageUrl: c.image_url ?? "",
    parentId: c.parent_id ?? null,
    productCount: counts.get(c.id) ?? 0,
    value: c.slug,
    label: c.name,
  })) as MarketplaceCategory[];
}

export async function listMarketplaceBusinesses() {
  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,name,slug,description,logo_url,cover_image_url,phone,whatsapp_number,
      email,address_line,city,state,country,status,is_verified,is_open
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const products = await listMarketplaceProducts({ limit: 1000 });
  return ((data ?? []) as RawBusiness[]).map((business) =>
    mapBusiness(
      business,
      products.filter((product) => product.businessId === business.id),
    ),
  );
}

export async function getMarketplaceBusiness(slug: string) {
  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,name,slug,description,logo_url,cover_image_url,phone,whatsapp_number,
      email,address_line,city,state,country,status,is_verified,is_open
    `)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const products = await listMarketplaceProducts({ businessId: data.id, limit: 1000 });
  return mapBusiness(data, products);
}

export function useMarketplaceProducts(options: {
  featured?: boolean;
  categoryId?: string;
  businessId?: string;
  search?: string;
  limit?: number;
} = {}) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const key = JSON.stringify(options);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    void listMarketplaceProducts(options)
      .then((items) => mounted && setProducts(items))
      .catch((err) => mounted && setError(err instanceof Error ? err : new Error("Unable to load products.")))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
    // options are represented by the stable serialized key.
  }, [key]);

  return { products, loading, error };
}

export function useMarketplaceCategories() {
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    void listMarketplaceCategories()
      .then((items) => mounted && setCategories(items))
      .catch((err) => mounted && setError(err instanceof Error ? err : new Error("Unable to load categories.")))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return { categories, loading, error };
}

export function useMarketplaceBusinesses() {
  const [businesses, setBusinesses] = useState<MarketplaceBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    void listMarketplaceBusinesses()
      .then((items) => mounted && setBusinesses(items))
      .catch((err) => mounted && setError(err instanceof Error ? err : new Error("Unable to load businesses.")))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return { businesses, loading, error };
}

export function useMarketplaceProduct(productId?: string) {
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(Boolean(productId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    void getMarketplaceProduct(productId)
      .then((item) => mounted && setProduct(item))
      .catch((err) => mounted && setError(err instanceof Error ? err : new Error("Unable to load product.")))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [productId]);

  return { product, loading, error };
}

export function useMarketplaceBusiness(slug?: string) {
  const [business, setBusiness] = useState<MarketplaceBusiness | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setBusiness(null);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    void getMarketplaceBusiness(slug)
      .then((item) => mounted && setBusiness(item))
      .catch((err) => mounted && setError(err instanceof Error ? err : new Error("Unable to load business.")))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [slug]);

  return { business, loading, error };
}
