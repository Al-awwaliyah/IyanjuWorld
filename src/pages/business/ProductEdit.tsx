
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Package,
  Save,
  Trash2,
} from "lucide-react";
import { supabase } from "../../libs/supabase";
import { getCurrentProfile, type Profile } from "../../libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";

type Category = {
  id: string;
  name: string;
};

type Business = {
  id: string;
  name: string;
  owner_id: string;
};

type Product = {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category_id: string | null;
  image_url: string | null;
  active: boolean;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  category_id: string;
  image_url: string;
  active: boolean;
};

export default function ProductEdit() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState<ProductForm>({
    name: "",
    description: "",
    price: "",
    stock_quantity: "0",
    category_id: "",
    image_url: "",
    active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) {
      setError("The requested product could not be identified.");
      setLoading(false);
      return;
    }

    void loadProduct(productId);
  }, [productId]);

  async function loadProduct(id: string) {
    setLoading(true);
    setError("");

    try {
      const currentProfile = await getCurrentProfile();

      if (!currentProfile) {
        throw new Error("Unable to load your account.");
      }

      setProfile(currentProfile);

      const [
        { data: businessData, error: businessError },
        { data: categoryData, error: categoryError },
        { data: productData, error: productError },
      ] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, owner_id")
          .eq("owner_id", currentProfile.id)
          .maybeSingle(),

        supabase
          .from("categories")
          .select("id, name")
          .order("name", { ascending: true }),

        supabase
          .from("products")
          .select(
            "id, business_id, name, slug, description, price, stock_quantity, category_id, image_url, active",
          )
          .eq("id", id)
          .maybeSingle(),
      ]);

      if (businessError) {
        throw businessError;
      }

      if (categoryError) {
        throw categoryError;
      }

      if (productError) {
        throw productError;
      }

      if (!businessData) {
        throw new Error(
          "Your business profile could not be found.",
        );
      }

      if (!productData) {
        throw new Error("This product could not be found.");
      }

      if (productData.business_id !== businessData.id) {
        throw new Error(
          "You do not have permission to edit this product.",
        );
      }

      const loadedProduct = productData as Product;

      setBusiness(businessData as Business);
      setCategories((categoryData ?? []) as Category[]);
      setProduct(loadedProduct);

      setForm({
        name: loadedProduct.name ?? "",
        description: loadedProduct.description ?? "",
        price: String(loadedProduct.price ?? ""),
        stock_quantity: String(loadedProduct.stock_quantity ?? 0),
        category_id: loadedProduct.category_id ?? "",
        image_url: loadedProduct.image_url ?? "",
        active: loadedProduct.active ?? true,
      });
    } catch (err) {
      logAppError("business-product-edit-load", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm() {
    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock_quantity);

    if (!name) {
      return "Please enter a product name.";
    }

    if (name.length < 2) {
      return "Product name is too short.";
    }

    if (!form.category_id) {
      return "Please select a product category.";
    }

    if (!form.price.trim()) {
      return "Please enter a product price.";
    }

    if (!Number.isFinite(price) || price < 0) {
      return "Please enter a valid product price.";
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return "Please enter a valid stock quantity.";
    }

    if (form.image_url.trim()) {
      try {
        new URL(form.image_url.trim());
      } catch {
        return "Please enter a valid product image URL.";
      }
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!product || !business || !profile) {
      setError(
        "The product information is unavailable. Please refresh the page and try again.",
      );
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const name = form.name.trim();
      const description = form.description.trim();
      const price = Number(form.price);
      const stockQuantity = Number(form.stock_quantity);
      const imageUrl = form.image_url.trim() || null;

      const { data: updatedProduct, error: updateError } = await supabase
        .from("products")
        .update({
          name,
          description: description || null,
          price,
          stock_quantity: stockQuantity,
          category_id: form.category_id || null,
          image_url: imageUrl,
          active: form.active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id)
        .eq("business_id", business.id)
        .select(
          "id, business_id, name, slug, description, price, stock_quantity, category_id, image_url, active",
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      if (!updatedProduct) {
        throw new Error("The product could not be updated.");
      }

      setProduct(updatedProduct as Product);

      setForm({
        name: updatedProduct.name ?? "",
        description: updatedProduct.description ?? "",
        price: String(updatedProduct.price ?? ""),
        stock_quantity: String(updatedProduct.stock_quantity ?? 0),
        category_id: updatedProduct.category_id ?? "",
        image_url: updatedProduct.image_url ?? "",
        active: updatedProduct.active ?? true,
      });
    } catch (err) {
      logAppError("business-product-edit", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!product || !business) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setDeleting(true);

    try {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id)
        .eq("business_id", business.id);

      if (deleteError) {
        throw deleteError;
      }

      navigate("/business/products", {
        replace: true,
        state: {
          deleted: true,
        },
      });
    } catch (err) {
      logAppError("business-product-delete", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading product...</span>
        </div>
      </div>
    );
  }

  if (!product || !business) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Package className="mx-auto mb-4 h-10 w-10 text-gray-400" />

          <h1 className="text-xl font-semibold text-gray-900">
            Product unavailable
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "The product could not be loaded or you do not have permission to edit it."}
          </p>

          <Link
            to="/business/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-900 dark-surface"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/business/products"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to products
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
              <Package className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Product
              </h1>

              <p className="text-sm text-gray-500">
                Update the product listed by {business.name}.
              </p>
            </div>
          </div>
        </div>

        <Link
          to={`/products/${product.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          View Product
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Product Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update the information customers see on the marketplace.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="product-name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Product name
              </label>

              <input
                id="product-name"
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                maxLength={150}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div>
              <label
                htmlFor="product-description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="product-description"
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                rows={5}
                maxLength={5000}
                className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="product-category"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Category
                </label>

                <select
                  id="product-category"
                  value={form.category_id}
                  onChange={(event) =>
                    updateField("category_id", event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                >
                  <option value="">Select category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="product-price"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Price (₦)
                </label>

                <input
                  id="product-price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    updateField("price", event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />
              </div>

              <div>
                <label
                  htmlFor="product-stock"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Stock quantity
                </label>

                <input
                  id="product-stock"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={form.stock_quantity}
                  onChange={(event) =>
                    updateField("stock_quantity", event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />
              </div>

              <div>
                <label
                  htmlFor="product-image"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Product image URL
                </label>

                <div className="relative">
                  <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="product-image"
                    type="url"
                    value={form.image_url}
                    onChange={(event) =>
                      updateField("image_url", event.target.value)
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Product Visibility
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Control whether this product is available on the marketplace.
              </p>
            </div>

            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  updateField("active", event.target.checked)
                }
                className="peer sr-only"
              />

              <span className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-ink-900 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-900/20 dark-surface" />

              <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
            </label>
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {form.active
              ? "This product is active and can appear in marketplace discovery."
              : "This product is inactive and will not be available for customers to purchase."}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Product
              </>
            )}
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/business/products"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-60 dark-surface"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
