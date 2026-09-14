import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Edit3,
  Eye,
  ImageIcon,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { getAuthState } from "../../libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import {
  formatNaira,
  formatNumber,
} from "../../libs/format";
import { supabase } from "../../libs/supabase";

interface Product {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  stock_quantity: number;
  active: boolean;
  category_id: string | null;
  category_name: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string | null;
}

interface Category {
  id: string;
  name: string;
}

type ProductFilter = "all" | "active" | "inactive" | "out_of_stock";

function getProductStatus(product: Product) {
  if (!product.active) {
    return {
      label: "Inactive",
      className: "bg-slate-100 text-slate-600",
    };
  }

  if (product.stock_quantity <= 0) {
    return {
      label: "Out of stock",
      className: "bg-red-50 text-red-700",
    };
  }

  return {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700",
  };
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadProducts = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const authState = await getAuthState();

      if (!authState.user) {
        setError("Please sign in to manage your products.");
        return;
      }

      const { data: business, error: businessError } =
        await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", authState.user.id)
          .maybeSingle();

      if (businessError) {
        throw businessError;
      }

      if (!business) {
        setError(
          "Your business profile could not be found."
        );
        return;
      }

      const [productsResult, categoriesResult] =
        await Promise.all([
          supabase
            .from("products")
            .select(
              "id, name, slug, description, price, stock_quantity, active, category_id, image_url, created_at, updated_at"
            )
            .eq("business_id", business.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("categories")
            .select("id, name")
            .order("name", { ascending: true }),
        ]);

      if (productsResult.error) {
        throw productsResult.error;
      }

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      const categoryRows = (categoriesResult.data ??
        []) as Category[];

      const categoryMap = new Map(
        categoryRows.map((category) => [
          category.id,
          category.name,
        ])
      );

      const productRows = (productsResult.data ?? []).map(
        (product) => ({
          id: product.id,
          name: product.name || "Unnamed product",
          slug: product.slug ?? null,
          description: product.description ?? null,
          price: Number(product.price) || 0,
          stock_quantity:
            Number(product.stock_quantity) || 0,
          active: product.active !== false,
          category_id: product.category_id ?? null,
          category_name: product.category_id
            ? categoryMap.get(product.category_id) ?? null
            : null,
          image_url: product.image_url ?? null,
          created_at: product.created_at,
          updated_at: product.updated_at ?? null,
        })
      );

      setCategories(categoryRows);
      setProducts(productRows);
    } catch (err) {
      logAppError(err, {
        action: "business.products.load",
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.name,
          product.description ?? "",
          product.category_name ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "active"
            ? product.active
            : filter === "inactive"
              ? !product.active
              : product.stock_quantity <= 0;

      return matchesSearch && matchesFilter;
    });
  }, [filter, products, search]);

  const activeCount = useMemo(
    () => products.filter((product) => product.active).length,
    [products]
  );

  const inactiveCount = useMemo(
    () =>
      products.filter((product) => !product.active).length,
    [products]
  );

  const outOfStockCount = useMemo(
    () =>
      products.filter(
        (product) => product.stock_quantity <= 0
      ).length,
    [products]
  );

  const updateProductStatus = async (
    product: Product
  ) => {
    try {
      setProcessingId(product.id);
      setError("");
      setActionMessage("");

      const nextActive = !product.active;

      const { error: updateError } = await supabase
        .from("products")
        .update({
          active: nextActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);

      if (updateError) {
        throw updateError;
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                active: nextActive,
              }
            : item
        )
      );

      setActionMessage(
        nextActive
          ? "Product has been activated."
          : "Product has been deactivated."
      );
    } catch (err) {
      logAppError(err, {
        action: "business.products.toggle_status",
        metadata: {
          productId: product.id,
        },
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setProcessingId("");
    }
  };

  const deleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product.id);
      setError("");
      setActionMessage("");

      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (deleteError) {
        throw deleteError;
      }

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );

      setActionMessage("Product has been deleted.");
    } catch (err) {
      logAppError(err, {
        action: "business.products.delete",
        metadata: {
          productId: product.id,
        },
      });

      setError(getSafeErrorMessage(err));
    } finally {
      setDeletingId("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Loading your products...</p>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>

          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Products unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={() => void loadProducts(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Business catalogue
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Products
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage the products customers can discover and order.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadProducts(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>

          <Button asChild>
            <Link to="/business/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {actionMessage && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-2xl border p-4 text-left shadow-sm transition-colors ${
            filter === "all"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p
            className={`text-xs ${
              filter === "all"
                ? "text-slate-300"
                : "text-slate-500"
            }`}
          >
            All products
          </p>
          <p className="mt-1 text-xl font-bold">
            {products.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`rounded-2xl border p-4 text-left shadow-sm transition-colors ${
            filter === "active"
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p
            className={`text-xs ${
              filter === "active"
                ? "text-emerald-100"
                : "text-slate-500"
            }`}
          >
            Active
          </p>
          <p className="mt-1 text-xl font-bold">
            {activeCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("inactive")}
          className={`rounded-2xl border p-4 text-left shadow-sm transition-colors ${
            filter === "inactive"
              ? "border-slate-700 bg-slate-700 text-white"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p
            className={`text-xs ${
              filter === "inactive"
                ? "text-slate-300"
                : "text-slate-500"
            }`}
          >
            Inactive
          </p>
          <p className="mt-1 text-xl font-bold">
            {inactiveCount}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilter("out_of_stock")}
          className={`rounded-2xl border p-4 text-left shadow-sm transition-colors ${
            filter === "out_of_stock"
              ? "border-red-600 bg-red-600 text-white"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p
            className={`text-xs ${
              filter === "out_of_stock"
                ? "text-red-100"
                : "text-slate-500"
            }`}
          >
            Out of stock
          </p>
          <p className="mt-1 text-xl font-bold">
            {outOfStockCount}
          </p>
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search products or categories..."
              className="pl-9"
              aria-label="Search products"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Package className="h-7 w-7 text-slate-400" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {products.length === 0
                ? "No products yet"
                : "No matching products"}
            </h2>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              {products.length === 0
                ? "Add your first product so customers can discover and order from your business."
                : "Try another search term or change the product filter."}
            </p>

            {products.length === 0 && (
              <Button asChild className="mt-5">
                <Link to="/business/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first product
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProducts.map((product) => {
              const status = getProductStatus(product);

              return (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center"
                >
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-7 w-7 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-semibold text-slate-900">
                          {product.name}
                        </h2>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatNaira(product.price)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>
                          Stock:{" "}
                          <strong className="font-medium text-slate-700">
                            {formatNumber(
                              product.stock_quantity
                            )}
                          </strong>
                        </span>

                        {product.category_name && (
                          <span>
                            Category:{" "}
                            <strong className="font-medium text-slate-700">
                              {product.category_name}
                            </strong>
                          </span>
                        )}
                      </div>

                      {product.description && (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {product.slug && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link
                          to={`/products/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    )}

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                    >
                      <Link
                        to={`/business/products/${product.id}/edit`}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void updateProductStatus(product)
                      }
                      disabled={processingId === product.id}
                    >
                      {processingId === product.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : product.active ? (
                        <ToggleRight className="mr-2 h-4 w-4" />
                      ) : (
                        <ToggleLeft className="mr-2 h-4 w-4" />
                      )}
                      {product.active ? "Deactivate" : "Activate"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void deleteProduct(product)}
                      disabled={deletingId === product.id}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {deletingId === product.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {categories.length > 0 && (
        <p className="text-xs text-slate-400">
          {categories.length} marketplace categories are available
          for product classification.
        </p>
      )}
    </div>
  );
}
