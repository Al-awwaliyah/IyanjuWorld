import { useCallback, useEffect, useState } from "react";
import {
  getMarketplaceBusiness,
  getMarketplaceProduct,
  listMarketplaceBusinesses,
  listMarketplaceCategories,
  listMarketplaceProducts,
  type MarketplaceBusiness,
  type MarketplaceCategory,
  type MarketplaceProduct,
} from "@/services/marketplace";

export function useMarketplaceProducts(options: Parameters<typeof listMarketplaceProducts>[0] = {}) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setProducts(await listMarketplaceProducts(options)); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load products."); } finally { setLoading(false); } }, [JSON.stringify(options)]);
  useEffect(() => { void load(); }, [load]);
  return { products, loading, error, reload: load };
}

export function useMarketplaceProduct(id?: string) {
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; if (!id) { setProduct(null); setLoading(false); return; } setLoading(true); getMarketplaceProduct(id).then((value) => { if (active) setProduct(value); }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load product."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id]);
  return { product, loading, error };
}

export function useMarketplaceBusinesses() {
  const [businesses, setBusinesses] = useState<MarketplaceBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { listMarketplaceBusinesses().then(setBusinesses).catch((e) => setError(e instanceof Error ? e.message : "Unable to load businesses.")).finally(() => setLoading(false)); }, []);
  return { businesses, loading, error };
}

export function useMarketplaceBusiness(slug?: string) {
  const [business, setBusiness] = useState<MarketplaceBusiness | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; if (!slug) { setLoading(false); return; } setLoading(true); getMarketplaceBusiness(slug).then((value) => { if (active) setBusiness(value); }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load store."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [slug]);
  return { business, loading, error };
}

export function useMarketplaceCategories() {
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { listMarketplaceCategories().then(setCategories).catch((e) => setError(e instanceof Error ? e.message : "Unable to load categories.")).finally(() => setLoading(false)); }, []);
  return { categories, loading, error };
}
