import {
  Check,
  ChevronDown,
  Package,
  Save,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Select, {
  type SelectOption,
} from "../ui/Select";
import Switch from "../ui/Switch";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

export type ProductFormMode =
  | "create"
  | "edit";

export type ProductFormStatus =
  | "draft"
  | "active"
  | "out_of_stock"
  | "archived"
  | "suspended";

export interface ProductFormCategory {
  id: string;
  name: string;
  parentId?: string | null;
  active?: boolean;
}

export interface ProductFormValues {
  name: string;
  description: string;
  price: number | null;
  compareAtPrice: number | null;
  sku: string;
  categoryId: string;
  stock: number | null;
  status: ProductFormStatus;
  available: boolean;
  featured: boolean;
}

export interface ProductFormProps {
  mode?: ProductFormMode;
  initialValues?: Partial<ProductFormValues>;
  categories?: ProductFormCategory[];
  loading?: boolean;
  submitting?: boolean;
  error?: string | null;
  onSubmit?: (
    values: ProductFormValues,
  ) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
}

const defaultValues: ProductFormValues = {
  name: "",
  description: "",
  price: null,
  compareAtPrice: null,
  sku: "",
  categoryId: "",
  stock: null,
  status: "draft",
  available: true,
  featured: false,
};

const statusOptions: SelectOption[] = [
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "out_of_stock",
    label: "Out of stock",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

function toNumberOrNull(
  value: string,
): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function normalizeInitialValues(
  values?: Partial<ProductFormValues>,
): ProductFormValues {
  return {
    ...defaultValues,
    ...values,
    name: values?.name ?? "",
    description:
      values?.description ?? "",
    price:
      values?.price ??
      defaultValues.price,
    compareAtPrice:
      values?.compareAtPrice ??
      defaultValues.compareAtPrice,
    sku: values?.sku ?? "",
    categoryId:
      values?.categoryId ?? "",
    stock:
      values?.stock ??
      defaultValues.stock,
    status:
      values?.status ??
      defaultValues.status,
    available:
      values?.available ??
      defaultValues.available,
    featured:
      values?.featured ??
      defaultValues.featured,
  };
}

export default function ProductForm({
  mode = "create",
  initialValues,
  categories = [],
  loading = false,
  submitting = false,
  error = null,
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel = "Cancel",
  className = "",
}: ProductFormProps) {
  const [values, setValues] =
    useState<ProductFormValues>(
      () =>
        normalizeInitialValues(
          initialValues,
        ),
    );

  const [errors, setErrors] =
    useState<
      Partial<
        Record<
          keyof ProductFormValues,
          string
        >
      >
    >({});

  useEffect(() => {
    setValues(
      normalizeInitialValues(
        initialValues,
      ),
    );

    setErrors({});
  }, [initialValues]);

  const categoryOptions =
    useMemo<SelectOption[]>(() => {
      return [
        {
          value: "",
          label: "Select a category",
        },
        ...categories
          .filter(
            (category) =>
              category.active !== false,
          )
          .map((category) => ({
            value: category.id,
            label: category.name,
          })),
      ];
    }, [categories]);

  const isEditing = mode === "edit";

  const resolvedSubmitLabel =
    submitLabel ||
    (isEditing
      ? "Save changes"
      : "Create product");

  const updateField = <
    K extends keyof ProductFormValues,
  >(
    field: K,
    value: ProductFormValues[K],
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((current) => {
        const next = {
          ...current,
        };

        delete next[field];

        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors: Partial<
      Record<
        keyof ProductFormValues,
        string
      >
    > = {};

    const name =
      values.name.trim();

    if (!name) {
      nextErrors.name =
        "Enter a product name.";
    } else if (name.length < 2) {
      nextErrors.name =
        "Product name is too short.";
    } else if (name.length > 150) {
      nextErrors.name =
        "Product name is too long.";
    }

    if (
      values.description.trim()
        .length > 5000
    ) {
      nextErrors.description =
        "Description is too long.";
    }

    if (
      values.price === null ||
      !Number.isFinite(values.price)
    ) {
      nextErrors.price =
        "Enter a valid product price.";
    } else if (values.price < 0) {
      nextErrors.price =
        "Price cannot be negative.";
    }

    if (
      values.compareAtPrice !==
        null &&
      values.compareAtPrice < 0
    ) {
      nextErrors.compareAtPrice =
        "Compare-at price cannot be negative.";
    }

    if (
      values.compareAtPrice !==
        null &&
      values.price !== null &&
      values.compareAtPrice <
        values.price
    ) {
      nextErrors.compareAtPrice =
        "Compare-at price should be equal to or higher than the selling price.";
    }

    if (!values.categoryId) {
      nextErrors.categoryId =
        "Select a category.";
    }

    if (
      values.stock !== null &&
      (!Number.isFinite(
        values.stock,
      ) ||
        values.stock < 0)
    ) {
      nextErrors.stock =
        "Stock must be zero or greater.";
    }

    if (
      values.stock !== null &&
      !Number.isInteger(
        values.stock,
      )
    ) {
      nextErrors.stock =
        "Stock must be a whole number.";
    }

    if (
      values.status === "active" &&
      values.stock !== null &&
      values.stock <= 0
    ) {
      nextErrors.stock =
        "An active product needs available stock or an appropriate stock setting.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (submitting || loading) {
      return;
    }

    if (!validate()) {
      return;
    }

    if (!onSubmit) {
      return;
    }

    await onSubmit({
      ...values,
      name: values.name.trim(),
      description:
        values.description.trim(),
      sku: values.sku.trim(),
    });
  };

  const handleReset = () => {
    setValues(
      normalizeInitialValues(
        initialValues,
      ),
    );

    setErrors({});
  };

  const isBusy =
    loading || submitting;

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        "space-y-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      noValidate
    >
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Package
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Product information
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Add the basic information customers
                will see when they discover your
                product.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <Input
            label="Product name"
            placeholder="e.g. Premium Leather Handbag"
            value={values.name}
            onChange={(event) =>
              updateField(
                "name",
                event.target.value,
              )
            }
            error={errors.name}
            disabled={isBusy}
            maxLength={150}
            autoComplete="off"
          />

          <Textarea
            label="Description"
            placeholder="Describe your product, its features and what makes it useful to customers."
            value={values.description}
            onChange={(event) =>
              updateField(
                "description",
                event.target.value,
              )
            }
            error={errors.description}
            disabled={isBusy}
            rows={6}
            maxLength={5000}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Select
              label="Category"
              value={values.categoryId}
              onChange={(event) =>
                updateField(
                  "categoryId",
                  event.target.value,
                )
              }
              options={categoryOptions}
              error={errors.categoryId}
              disabled={
                isBusy ||
                categories.length === 0
              }
            />

            <Input
              label="SKU"
              placeholder="Optional product SKU"
              value={values.sku}
              onChange={(event) =>
                updateField(
                  "sku",
                  event.target.value,
                )
              }
              error={errors.sku}
              disabled={isBusy}
              maxLength={100}
              autoComplete="off"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Pricing & inventory
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Set your selling price and keep your
            available inventory up to date.
          </p>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <Input
              label="Selling price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={
                values.price === null
                  ? ""
                  : String(values.price)
              }
              onChange={(event) =>
                updateField(
                  "price",
                  toNumberOrNull(
                    event.target.value,
                  ),
                )
              }
              error={errors.price}
              disabled={isBusy}
              leftIcon={
                <span className="text-xs font-semibold">
                  ₦
                </span>
              }
              inputMode="decimal"
            />

            <Input
              label="Compare-at price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Optional"
              value={
                values.compareAtPrice ===
                null
                  ? ""
                  : String(
                      values.compareAtPrice,
                    )
              }
              onChange={(event) =>
                updateField(
                  "compareAtPrice",
                  toNumberOrNull(
                    event.target.value,
                  ),
                )
              }
              error={
                errors.compareAtPrice
              }
              helperText="Use this to show a previous/higher price."
              disabled={isBusy}
              leftIcon={
                <span className="text-xs font-semibold">
                  ₦
                </span>
              }
              inputMode="decimal"
            />

            <Input
              label="Stock quantity"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 25"
              value={
                values.stock === null
                  ? ""
                  : String(values.stock)
              }
              onChange={(event) =>
                updateField(
                  "stock",
                  toNumberOrNull(
                    event.target.value,
                  ),
                )
              }
              error={errors.stock}
              helperText="Leave empty if stock is not tracked."
              disabled={isBusy}
              inputMode="numeric"
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Inventory status
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Products with zero stock should
                  not be presented as available for
                  purchase.
                </p>
              </div>

              {values.stock !== null && (
                <Badge
                  variant={
                    values.stock > 0
                      ? "success"
                      : "warning"
                  }
                  size="sm"
                >
                  {values.stock > 0
                    ? `${values.stock} in stock`
                    : "Out of stock"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Publishing settings
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Control whether customers can see and
            discover this product.
          </p>
        </div>

        <div className="space-y-1 p-5 sm:p-6">
          <Select
            label="Product status"
            value={values.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target
                  .value as ProductFormStatus,
              )
            }
            options={statusOptions}
            disabled={isBusy}
          />

          <div className="pt-4">
            <Switch
              label="Available for purchase"
              description="Allow customers to purchase this product when it is otherwise eligible for sale."
              checked={values.available}
              onChange={(event) =>
                updateField(
                  "available",
                  event.target.checked,
                )
              }
              disabled={isBusy}
            />
          </div>

          <div className="pt-4">
            <Switch
              label="Featured product"
              description="Allow this product to appear in featured product sections across the marketplace."
              checked={values.featured}
              onChange={(event) =>
                updateField(
                  "featured",
                  event.target.checked,
                )
              }
              disabled={isBusy}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {isEditing && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isBusy}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset changes
            </button>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isBusy}
            >
              {cancelLabel}
            </Button>
          )}

          <Button
            type="submit"
            disabled={isBusy}
            loading={submitting}
          >
            {submitting ? (
              "Saving..."
            ) : (
              <>
                <Save
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                {resolvedSubmitLabel}
              </>
            )}
          </Button>
        </div>
      </div>

      {mode === "edit" &&
        values.status === "active" &&
        values.available && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />

            <span>
              This product is configured to be
              available on the marketplace, subject
              to your business status, category,
              inventory and platform rules.
            </span>
          </div>
        )}
    </form>
  );
}
