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
  logoUrl: string;
  coverImage: string;
  coverUrl: string;
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
  category: string;
  categorySlug: string;
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
  value: string;
  label: string;
};

type RawProduct = Record<string, any>;
type RawBusiness = Record<string, any>;
type RawCategory = Record<string, any>;

const PUBLIC_PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  price,
  compare_at_price,
  stock_quantity,
  status,
  is_available,
  is_featured,
  created_at,
  image_url,
  business_id,
  category_id,

  businesses:businesses!products_business_id_fkey(
    id,
    name,
    slug,
    logo,
    logo_url,
    cover,
    cover_image_url,
    description,
    city,
    state,
    country,
    phone,
    whatsapp,
    whatsapp_number,
    email,
    address,
    address_line,
    verified,
    is_verified,
    open,
    is_open,
    status
  ),

  categories:categories!products_category_id_fkey(
    id,
    name,
    slug,
    description,
    image_url,
    parent_id,
    is_active
  ),

  product_images:product_images!product_images_product_id_fkey(
    id,
    storage_path,
    sort_order,
    is_primary,
    alt_text
  )
`;

/**
 * Convert a Supabase Storage path into a public URL.
 *
 * Example:
 * business-id/product-id/image.jpg
 *
 * becomes:
 * https://xxxxx.supabase.co/storage/v1/object/public/product-images/...
 */
function publicImage(storagePath?: string | null): string {
  if (!storagePath) return "";

  const path = String(storagePath).trim();

  if (!path) return "";

  // Already a complete URL.
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  return supabase.storage
    .from("product-images")
    .getPublicUrl(path)
    .data.publicUrl;
}

function mapProduct(row: RawProduct): MarketplaceProduct {
  const business = row.businesses ?? {};
  const category = row.categories ?? {};

  const imageRows = Array.isArray(row.product_images)
    ? [...row.product_images]
    : [];

  imageRows.sort(
    (a: any, b: any) =>
      Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
  );

  const imageUrls = imageRows
    .map((image: any) => publicImage(image.storage_path))
    .filter(Boolean);

  const primaryImage = imageRows.find(
    (image: any) => image.is_primary === true,
  );

  /**
   * IMPORTANT:
   * products.image_url contains a Storage path, not necessarily a URL.
   * Always convert it using publicImage().
   */
  const productImageUrl = publicImage(row.image_url);

  const primaryImageUrl =
    publicImage(primaryImage?.storage_path) ||
    productImageUrl ||
    imageUrls[0] ||
    "";

  const stock = Number(row.stock_quantity ?? 0);

  const available =
    row.status === "active" &&
    row.is_available === true &&
    stock > 0;

  return {
    id: row.id,
    name: row.name ?? "",
    slug: row.slug ?? "",
    description: row.description ?? "",

    price: Number(row.price ?? 0),

    compareAtPrice:
      row.compare_at_price == null
        ? null
        : Number(row.compare_at_price),

    imageUrl: primaryImageUrl,

    images:
      imageUrls.length > 0
        ? imageUrls
        : primaryImageUrl
          ? [primaryImageUrl]
          : [],

    businessId: row.business_id,

    businessName:
      business.name ??
      "Business",

    businessSlug:
      business.slug ??
      "",

    categoryId:
      row.category_id,

    category:
      category.name ??
      "Uncategorized",

    categoryName:
      category.name ??
      "Uncategorized",

    categorySlug:
      category.slug ??
      "",

    city:
      business.city ??
      "",

    state:
      business.state ??
      "",

    stock,

    available,

    featured:
      row.is_featured === true,

    verifiedBusiness:
      business.is_verified === true ||
      business.verified === true,

    createdAt:
      row.created_at ??
      "",
  };
}

function mapBusiness(
  row: RawBusiness,
  products: MarketplaceProduct[] = [],
): MarketplaceBusiness {
  const logoPath =
    row.logo_url ??
    row.logo ??
    "";

  const coverPath =
    row.cover_image_url ??
    row.cover ??
    "";

  return {
    id: row.id,
    name: row.name ?? "",
    slug: row.slug ?? "",

    logo: publicImage(logoPath),
    logoUrl: publicImage(logoPath),

    coverImage: publicImage(coverPath),
    coverUrl: publicImage(coverPath),

    description: row.description ?? "",

    city: row.city ?? "",
    state: row.state ?? "",
    country: row.country ?? "Nigeria",

    phone: row.phone ?? "",

    whatsapp:
      row.whatsapp_number ??
      row.whatsapp ??
      "",

    email: row.email ?? "",

    address:
      row.address_line ??
      row.address ??
      "",

    verified:
      row.is_verified === true ||
      row.verified === true,

    open:
      row.is_open !== false &&
      row.open !== false,

    category:
      products[0]?.category ??
      "Marketplace",

    categorySlug:
      products[0]?.categorySlug ??
      "",

    productCount:
      products.length,

    products,
  };
}

/**
 * Get all publicly visible marketplace products.
 *
 * RLS remains responsible for deciding which products are actually
 * visible to anonymous/authenticated users.
 */
export async function listMarketplaceProducts(
  options: {
    featured?: boolean;
    categoryId?: string;
    businessId?: string;
    search?: string;
    limit?: number;
  } = {},
) {
  let query = supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("status", "active")
    .eq("is_available", true)
    .gt("stock_quantity", 0)
    .order("created_at", {
      ascending: false,
    });

  if (options.featured === true) {
    query = query.eq("is_featured", true);
  }

  if (options.categoryId) {
    query = query.eq(
      "category_id",
      options.categoryId,
    );
  }

  if (options.businessId) {
    query = query.eq(
      "business_id",
      options.businessId,
    );
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "Marketplace products query failed:",
      error,
    );

    throw error;
  }

  let products = (data ?? []).map(mapProduct);

  /**
   * Search is intentionally performed client-side because
   * search covers related business/category fields.
   */
  if (options.search?.trim()) {
    const searchTerm =
      options.search
        .trim()
        .toLowerCase();

    products = products.filter((product) =>
      [
        product.name,
        product.description,
        product.businessName,
        product.category,
        product.city,
        product.state,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm),
    );
  }

  return products;
}

export async function getMarketplaceProduct(
  productIdOrSlug: string,
) {
  if (!productIdOrSlug?.trim()) {
    return null;
  }

  const value =
    productIdOrSlug.trim();

  /**
   * First try slug.
   */
  const bySlug = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("slug", value)
    .maybeSingle();

  if (bySlug.error) {
    throw bySlug.error;
  }

  if (bySlug.data) {
    return mapProduct(bySlug.data);
  }

  /**
   * Then try UUID.
   */
  const byId = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("id", value)
    .maybeSingle();

  if (byId.error) {
    throw byId.error;
  }

  return byId.data
    ? mapProduct(byId.data)
    : null;
}

export async function listMarketplaceCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select(
      "id,name,slug,description,image_url,parent_id,is_active",
    )
    .eq("is_active", true)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  /**
   * Load products separately so category counts reflect
   * the exact same public marketplace visibility rules.
   */
  const products =
    await listMarketplaceProducts({
      limit: 1000,
    });

  const counts =
    new Map<string, number>();

  products.forEach((product) => {
    counts.set(
      product.categoryId,
      (counts.get(product.categoryId) ?? 0) + 1,
    );
  });

  return (
    (data ?? []) as RawCategory[]
  ).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description:
      category.description ?? "",

    imageUrl:
      publicImage(category.image_url),

    parentId:
      category.parent_id ?? null,

    productCount:
      counts.get(category.id) ?? 0,

    value:
      category.slug,

    label:
      category.name,
  })) as MarketplaceCategory[];
}

export async function listMarketplaceBusinesses() {
  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      logo,
      cover_image_url,
      cover,
      phone,
      whatsapp_number,
      whatsapp,
      email,
      address_line,
      address,
      city,
      state,
      country,
      status,
      is_verified,
      verified,
      is_open,
      open,
      created_at
    `)
    .eq("status", "active")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  const products =
    await listMarketplaceProducts({
      limit: 1000,
    });

  return (
    (data ?? []) as RawBusiness[]
  ).map((business) =>
    mapBusiness(
      business,
      products.filter(
        (product) =>
          product.businessId ===
          business.id,
      ),
    ),
  );
}

export async function getMarketplaceBusiness(
  slug: string,
) {
  if (!slug?.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      logo,
      cover_image_url,
      cover,
      phone,
      whatsapp_number,
      whatsapp,
      email,
      address_line,
      address,
      city,
      state,
      country,
      status,
      is_verified,
      verified,
      is_open,
      open,
      created_at
    `)
    .eq("slug", slug.trim())
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const products =
    await listMarketplaceProducts({
      businessId: data.id,
      limit: 1000,
    });

  return mapBusiness(
    data,
    products,
  );
}

export function useMarketplaceProducts(
  options: {
    featured?: boolean;
    categoryId?: string;
    businessId?: string;
    search?: string;
    limit?: number;
  } = {},
) {
  const [products, setProducts] =
    useState<MarketplaceProduct[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<Error | null>(null);

  const key =
    JSON.stringify(options);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    void listMarketplaceProducts(options)
      .then((items) => {
        if (mounted) {
          setProducts(items);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err
              : new Error(
                  "Unable to load products.",
                ),
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [key]);

  return {
    products,
    loading,
    error,
  };
}

export function useMarketplaceCategories() {
  const [categories, setCategories] =
    useState<MarketplaceCategory[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    void listMarketplaceCategories()
      .then((items) => {
        if (mounted) {
          setCategories(items);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err
              : new Error(
                  "Unable to load categories.",
                ),
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    categories,
    loading,
    error,
  };
}

export function useMarketplaceBusinesses() {
  const [businesses, setBusinesses] =
    useState<MarketplaceBusiness[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    void listMarketplaceBusinesses()
      .then((items) => {
        if (mounted) {
          setBusinesses(items);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err
              : new Error(
                  "Unable to load businesses.",
                ),
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    businesses,
    loading,
    error,
  };
}

export function useMarketplaceProduct(
  productId?: string,
) {
  const [product, setProduct] =
    useState<MarketplaceProduct | null>(
      null,
    );

  const [loading, setLoading] =
    useState(Boolean(productId));

  const [error, setError] =
    useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;

    setLoading(true);
    setError(null);

    void getMarketplaceProduct(productId)
      .then((item) => {
        if (mounted) {
          setProduct(item);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err
              : new Error(
                  "Unable to load product.",
                ),
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [productId]);

  return {
    product,
    loading,
    error,
  };
}

export function useMarketplaceBusiness(
  slug?: string,
) {
  const [business, setBusiness] =
    useState<MarketplaceBusiness | null>(
      null,
    );

  const [loading, setLoading] =
    useState(Boolean(slug));

  const [error, setError] =
    useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setBusiness(null);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;

    setLoading(true);
    setError(null);

    void getMarketplaceBusiness(slug)
      .then((item) => {
        if (mounted) {
          setBusiness(item);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err
              : new Error(
                  "Unable to load business.",
                ),
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  return {
    business,
    loading,
    error,
  };
}
