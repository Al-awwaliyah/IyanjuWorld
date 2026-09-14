import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Package,
  Save,
} from "lucide-react";
import { supabase } from "../../libs/supabase";
import { uploadFile } from "../../libs/storage";
import {
  getCurrentProfile,
  type Profile,
} from "../../libs/auth";
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

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  category_id: string;
  active: boolean;
};

type CreatedProduct = {
  id: string;
};

const initialForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  stock_quantity: "0",
  category_id: "",
  active: true,
};

export default function ProductCreate() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(true);

  useEffect(() => {
    void loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setCategoryLoading(true);
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
      ] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, owner_id")
          .eq("owner_id", currentProfile.id)
          .maybeSingle(),

        supabase
          .from("categories")
          .select("id, name")
          .eq("is_active", true)
          .order("name", { ascending: true }),
      ]);

      if (businessError) {
        throw businessError;
      }

      if (categoryError) {
        throw categoryError;
      }

      if (!businessData) {
        throw new Error(
          "Your business profile could not be found. Please complete business setup first.",
        );
      }

      setBusiness(businessData as Business);
      setCategories((categoryData ?? []) as Category[]);

      if (!categoryData || categoryData.length === 0) {
        setError(
          "No active product categories are available. Please contact the administrator.",
        );
      }
    } catch (err) {
      logAppError("business-product-create-load", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
      setCategoryLoading(false);
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

  function generateSlug(name: string) {
    const normalized = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return normalized || `product-${Date.now()}`;
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

    const selectedCategory = categories.some(
      (category) => category.id === form.category_id,
    );

    if (!selectedCategory) {
      return "Please select a valid product category.";
    }

    if (!form.price.trim()) {
      return "Please enter a product price.";
    }

    if (!Number.isFinite(price) || price < 0) {
      return "Please enter a valid product price.";
    }

    if (!form.stock_quantity.trim()) {
      return "Please enter a stock quantity.";
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return "Please enter a valid stock quantity.";
    }

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return "Product image must be 5 MB or smaller.";
    }

    if (imageFile) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      if (!allowedTypes.includes(imageFile.type)) {
        return "Please upload a JPG, PNG, WEBP, or GIF image.";
      }
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!profile || !business) {
      setError(
        "Your business information is unavailable. Please refresh the page and try again.",
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
      const slug = generateSlug(name);

      /*
       * Product creation is performed through the SECURITY DEFINER RPC.
       *
       * The RPC:
       * - Gets the authenticated user with auth.uid()
       * - Verifies business ownership
       * - Verifies the category
       * - Generates a unique product slug
       * - Creates the product
       * - Sets the correct product status/availability
       *
       * Do NOT replace this with a direct products.insert().
       */
      const { data: createdProduct, error: createError } =
        await supabase.rpc("create_business_product", {
          p_business_id: business.id,
          p_category_id: form.category_id,
          p_name: name,
          p_slug: slug,
          p_description: description || null,
          p_price: price,
          p_stock_quantity: stockQuantity,
          p_image_url: null,
          p_active: form.active,
        });

      if (createError) {
        throw createError;
      }

      /*
       * Normalize the RPC response.
       *
       * Depending on the Supabase generated client typing,
       * the RPC response may be represented as an object or array.
       */
      const product = (
        Array.isArray(createdProduct)
          ? createdProduct[0]
          : createdProduct
      ) as CreatedProduct | null;

      if (!product?.id) {
        throw new Error("The product could not be created.");
      }

      /*
       * Upload product image after the product has been created.
       *
       * Storage upload remains a direct Storage operation.
       * Database metadata is handled by the secure add_product_image RPC.
       */
      if (imageFile) {
        const extension =
          imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

        const storagePath = `${business.id}/${product.id}/${crypto.randomUUID()}.${extension}`;

        /*
         * Upload the physical file to the product-images bucket.
         */
        await uploadFile(
          "product-images",
          storagePath,
          imageFile,
        );

        /*
         * IMPORTANT:
         *
         * Do NOT directly insert into product_images.
         * Do NOT directly update products.image_url.
         *
         * Both operations are handled securely inside
         * add_product_image(), which verifies that the
         * authenticated user owns the product's business.
         */
        const { error: imageRecordError } = await supabase.rpc(
          "add_product_image",
          {
            p_product_id: product.id,
            p_storage_path: storagePath,
            p_alt_text: name,
          },
        );

        if (imageRecordError) {
          /*
           * The database metadata failed after the Storage upload.
           *
           * The product itself still exists. The error is surfaced
           * clearly so it can be diagnosed instead of silently
           * pretending the image was saved.
           */
          throw imageRecordError;
        }
      }

      /*
       * Product creation completed successfully.
       */
      navigate(`/business/products/${product.id}/edit`, {
        replace: true,
        state: {
          created: true,
        },
      });
    } catch (err) {
      logAppError("business-product-create", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading product form...</span>
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
                Add Product
              </h1>

              <p className="text-sm text-gray-500">
                Add a product to your business storefront.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!business ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <Package className="mx-auto mb-3 h-8 w-8 text-gray-400" />

          <h2 className="text-lg font-semibold text-gray-900">
            Business profile unavailable
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            We could not find a business associated with your account.
          </p>

          <Link
            to="/business/settings"
            className="mt-5 inline-flex rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-900 dark-surface"
          >
            Open Business Settings
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Product Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Provide the basic information customers will see.
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
                  placeholder="e.g. Premium Leather Shoes"
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
                  placeholder="Describe the product for customers..."
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
                    disabled={
                      categoryLoading || categories.length === 0
                    }
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    <option value="">
                      {categoryLoading
                        ? "Loading categories..."
                        : categories.length === 0
                          ? "No categories available"
                          : "Select category"}
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {!categoryLoading &&
                    categories.length > 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        Select the category that best matches this
                        product.
                      </p>
                    )}
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
                    placeholder="0.00"
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
                      updateField(
                        "stock_quantity",
                        event.target.value,
                      )
                    }
                    placeholder="0"
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="product-image"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Product image
                  </label>

                  <input
                    id="product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(event) =>
                      setImageFile(
                        event.target.files?.[0] ?? null,
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                  />

                  {imageFile && (
                    <p className="mt-2 text-xs text-gray-500">
                      Selected: {imageFile.name}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-gray-500">
                    Upload a JPG, PNG, WEBP, or GIF image. Maximum 5
                    MB.
                  </p>
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
                  Choose whether customers can see and purchase this
                  product.
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
                ? "This product will be active and eligible for marketplace discovery when it has stock available."
                : "This product will be saved as inactive and will not be available for customers to purchase."}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/business/products"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                saving ||
                categoryLoading ||
                categories.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-60 dark-surface"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating product...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Product
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
