import { useEffect, useState } from "react";
import { supabase } from "@/libs/supabase";

/* =========================================================
   TYPES
========================================================= */

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

/* =========================================================
   IMAGE HELPERS
========================================================= */

function publicProductImage(
  storagePath?: string | null,
): string {
  if (!storagePath) {
    return "";
  }

  const path = String(storagePath).trim();

  if (!path) {
    return "";
  }

  /*
   * If the database already contains a complete URL,
   * don't modify it.
   */
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(path);

  return data?.publicUrl ?? "";
}

function publicBusinessImage(
  storagePath?: string | null,
): string {
  if (!storagePath) {
    return "";
  }

  const path = String(storagePath).trim();

  if (!path) {
    return "";
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  /*
   * Business images may already contain a public URL.
   *
   * If they are stored in your business-images bucket,
   * this bucket can be used.
   */
  const { data } = supabase.storage
    .from("business-images")
    .getPublicUrl(path);

  return data?.publicUrl ?? path;
}

/* =========================================================
   NORMALIZATION HELPERS
========================================================= */

function parseJsonObject(
  value: unknown,
): Record<string, any> {
  if (!value) {
    return {};
  }

  if (typeof value === "object") {
    return value as Record<string, any>;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object"
      ) {
        return parsed;
      }
    } catch {
      return {};
    }
  }

  return {};
}

function parseJsonArray(
  value: unknown,
): any[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

/* =========================================================
   PRODUCT MAPPER
========================================================= */

function mapProduct(
  row: RawProduct,
): MarketplaceProduct {
  const business =
    parseJsonObject(
      row.businesses ?? row.business,
    );

  const category =
    parseJsonObject(
      row.categories ?? row.category,
    );

  const imageRows =
    parseJsonArray(
      row.product_images,
    );

  const sortedImages =
    [...imageRows].sort(
      (a: any, b: any) =>
        Number(a?.sort_order ?? 0) -
        Number(b?.sort_order ?? 0),
    );

  /*
   * Convert every Storage path into
   * a public URL.
   */
  const imageUrls =
    sortedImages
      .map((image: any) =>
        publicProductImage(
          image?.storage_path,
        ),
      )
      .filter(Boolean);

  /*
   * Primary image from product_images.
   */
  const primaryImage =
    sortedImages.find(
      (image: any) =>
        image?.is_primary === true,
    );

  const primaryImageUrl =
    publicProductImage(
      primaryImage?.storage_path,
    );

  /*
   * Fallback to products.image_url.
   */
  const productImageUrl =
    publicProductImage(
      row.image_url,
    );

  const finalImageUrl =
    primaryImageUrl ||
    productImageUrl ||
    imageUrls[0] ||
    "";

  const stock =
    Number(
      row.stock_quantity ?? 0,
    );

  const available =
    row.status === "active" &&
    row.is_available === true &&
    stock > 0;

  return {
    id: row.id,

    name:
      row.name ??
      "",

    slug:
      row.slug ??
      "",

    description:
      row.description ??
      "",

    price:
      Number(
        row.price ?? 0,
      ),

    compareAtPrice:
      row.compare_at_price == null
        ? null
        : Number(
            row.compare_at_price,
          ),

    imageUrl:
      finalImageUrl,

    images:
      imageUrls.length > 0
        ? imageUrls
        : finalImageUrl
          ? [finalImageUrl]
          : [],

    businessId:
      row.business_id,

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

/* =========================================================
   BUSINESS MAPPER
========================================================= */

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
    id:
      row.id,

    name:
      row.name ??
      "",

    slug:
      row.slug ??
      "",

    logo:
      publicBusinessImage(
        logoPath,
      ),

    logoUrl:
      publicBusinessImage(
        logoPath,
      ),

    coverImage:
      publicBusinessImage(
        coverPath,
      ),

    coverUrl:
      publicBusinessImage(
        coverPath,
      ),

    description:
      row.description ??
      "",

    city:
      row.city ??
      "",

    state:
      row.state ??
      "",

    country:
      row.country ??
      "Nigeria",

    phone:
      row.phone ??
      "",

    whatsapp:
      row.whatsapp_number ??
      row.whatsapp ??
      "",

    email:
      row.email ??
      "",

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

/* =========================================================
   LIST MARKETPLACE PRODUCTS
========================================================= */

export async function listMarketplaceProducts(
  options: {
    featured?: boolean;
    categoryId?: string;
    businessId?: string;
    search?: string;
    limit?: number;
  } = {},
): Promise<MarketplaceProduct[]> {
  const {
    featured = false,
    categoryId = null,
    businessId = null,
    search = null,
    limit = 1000,
  } = options;

  /*
   * Products are loaded through the secure public
   * marketplace RPC.
   *
   * This avoids depending on nested PostgREST RLS
   * relationships for the marketplace.
   */
  const { data, error } =
    await supabase.rpc(
      "get_marketplace_products",
      {
        p_featured: featured,
        p_category_id: categoryId,
        p_business_id: businessId,
        p_search:
          search?.trim() || null,
        p_limit:
          Math.min(
            Math.max(
              Number(limit) || 1000,
              1,
            ),
            1000,
          ),
      },
    );

  if (error) {
    console.error(
      "get_marketplace_products error:",
      error,
    );

    throw error;
  }

  if (!data) {
    return [];
  }

  return (data as RawProduct[]).map(
    (row) => {
      const business =
        parseJsonObject(
          row.business,
        );

      const category =
        parseJsonObject(
          row.category,
        );

      const productImages =
        parseJsonArray(
          row.product_images,
        );

      return mapProduct({
        ...row,

        businesses:
          business,

        categories:
          category,

        product_images:
          productImages,
      });
    },
  );
}

/* =========================================================
   GET SINGLE MARKETPLACE PRODUCT
========================================================= */

export async function getMarketplaceProduct(
  productIdOrSlug: string,
): Promise<MarketplaceProduct | null> {
  if (!productIdOrSlug?.trim()) {
    return null;
  }

  const value =
    productIdOrSlug.trim();

  /*
   * Use the RPC for the single product as well.
   * This guarantees that product detail pages use
   * the same public visibility rules as Explore.
   */

  const { data, error } =
    await supabase.rpc(
      "get_marketplace_products",
      {
        p_featured: false,
        p_category_id: null,
        p_business_id: null,
        p_search: null,
        p_limit: 1000,
      },
    );

  if (error) {
    throw error;
  }

  const rows =
    (data ?? []) as RawProduct[];

  const found =
    rows.find(
      (row) =>
        row.id === value ||
        row.slug === value,
    );

  if (!found) {
    return null;
  }

  return mapProduct({
    ...found,

    businesses:
      parseJsonObject(
        found.business,
      ),

    categories:
      parseJsonObject(
        found.category,
      ),

    product_images:
      parseJsonArray(
        found.product_images,
      ),
  });
}

/* =========================================================
   MARKETPLACE CATEGORIES
========================================================= */

export async function listMarketplaceCategories(): Promise<
  MarketplaceCategory[]
> {
  const { data, error } =
    await supabase
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

  const products =
    await listMarketplaceProducts({
      limit: 1000,
    });

  const counts =
    new Map<string, number>();

  for (const product of products) {
    counts.set(
      product.categoryId,
      (counts.get(
        product.categoryId,
      ) ?? 0) + 1,
    );
  }

  return (
    (data ?? []) as RawCategory[]
  ).map((category) => ({
    id:
      category.id,

    name:
      category.name,

    slug:
      category.slug,

    description:
      category.description ??
      "",

    imageUrl:
      publicProductImage(
        category.image_url,
      ),

    parentId:
      category.parent_id ??
      null,

    productCount:
      counts.get(
        category.id,
      ) ?? 0,

    value:
      category.slug,

    label:
      category.name,
  }));
}

/* =========================================================
   MARKETPLACE BUSINESSES
========================================================= */

export async function listMarketplaceBusinesses(): Promise<
  MarketplaceBusiness[]
> {
  const { data, error } =
    await supabase
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
      .eq(
        "status",
        "active",
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

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

/* =========================================================
   SINGLE MARKETPLACE BUSINESS
========================================================= */

export async function getMarketplaceBusiness(
  slug: string,
): Promise<MarketplaceBusiness | null> {
  if (!slug?.trim()) {
    return null;
  }

  const { data, error } =
    await supabase
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
      .eq(
        "slug",
        slug.trim(),
      )
      .eq(
        "status",
        "active",
      )
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

/* =========================================================
   PRODUCTS HOOK
========================================================= */

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
    useState<MarketplaceProduct[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<Error | null>(
      null,
    );

  const key =
    JSON.stringify(options);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    void listMarketplaceProducts(
      options,
    )
      .then((items) => {
        if (!mounted) return;

        setProducts(items);
      })
      .catch((err) => {
        if (!mounted) return;

        console.error(
          "useMarketplaceProducts:",
          err,
        );

        setError(
          err instanceof Error
            ? err
            : new Error(
                "Unable to load products.",
              ),
        );

        setProducts([]);
      })
      .finally(() => {
        if (!mounted) return;

        setLoading(false);
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

/* =========================================================
   CATEGORIES HOOK
========================================================= */

export function useMarketplaceCategories() {
  const [categories, setCategories] =
    useState<MarketplaceCategory[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<Error | null>(
      null,
    );

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    void listMarketplaceCategories()
      .then((items) => {
        if (!mounted) return;

        setCategories(items);
      })
      .catch((err) => {
        if (!mounted) return;

        console.error(
          "useMarketplaceCategories:",
          err,
        );

        setError(
          err instanceof Error
            ? err
            : new Error(
                "Unable to load categories.",
              ),
        );

        setCategories([]);
      })
      .finally(() => {
        if (!mounted) return;

        setLoading(false);
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

/* =========================================================
   BUSINESSES HOOK
========================================================= */

export function useMarketplaceBusinesses() {
  const [businesses, setBusinesses] =
    useState<MarketplaceBusiness[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<Error | null>(
      null,
    );

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    void listMarketplaceBusinesses()
      .then((items) => {
        if (!mounted) return;

        setBusinesses(items);
      })
      .catch((err) => {
        if (!mounted) return;

        console.error(
          "useMarketplaceBusinesses:",
          err,
        );

        setError(
          err instanceof Error
            ? err
            : new Error(
                "Unable to load businesses.",
              ),
        );

        setBusinesses([]);
      })
      .finally(() => {
        if (!mounted) return;

        setLoading(false);
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

/* =========================================================
   SINGLE PRODUCT HOOK
========================================================= */

export function useMarketplaceProduct(
  productId?: string,
) {
  const [product, setProduct] =
    useState<MarketplaceProduct | null>(
      null,
    );

  const [loading, setLoading] =
    useState(
      Boolean(productId),
    );

  const [error, setError] =
    useState<Error | null>(
      null,
    );

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

    void getMarketplaceProduct(
      productId,
    )
      .then((item) => {
        if (!mounted) return;

        setProduct(item);
      })
      .catch((err) => {
        if (!mounted) return;

        console.error(
          "useMarketplaceProduct:",
          err,
        );

        setError(
          err instanceof Error
            ? err
            : new Error(
                "Unable to load product.",
              ),
        );

        setProduct(null);
      })
      .finally(() => {
        if (!mounted) return;

        setLoading(false);
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

/* =========================================================
   SINGLE BUSINESS HOOK
========================================================= */

export function useMarketplaceBusiness(
  slug?: string,
) {
  const [business, setBusiness] =
    useState<MarketplaceBusiness | null>(
      null,
    );

  const [loading, setLoading] =
    useState(
      Boolean(slug),
    );

  const [error, setError] =
    useState<Error | null>(
      null,
    );

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

    void getMarketplaceBusiness(
      slug,
    )
      .then((item) => {
        if (!mounted) return;

        setBusiness(item);
      })
      .catch((err) => {
        if (!mounted) return;

        console.error(
          "useMarketplaceBusiness:",
          err,
        );

        setError(
          err instanceof Error
            ? err
            : new Error(
                "Unable to load business.",
              ),
        );

        setBusiness(null);
      })
      .finally(() => {
        if (!mounted) return;

        setLoading(false);
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
