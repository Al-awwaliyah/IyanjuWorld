import {
  Archive,
  Edit3,
  MoreVertical,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Dropdown from "../ui/Dropdown";
import ProductImage from "../marketplace/ProductImage";
import ProductPrice from "../marketplace/ProductPrice";
import EmptyState from "../ui/EmptyState";
import Spinner from "../ui/Spinner";

export type ManagedProductStatus =
  | "draft"
  | "active"
  | "out_of_stock"
  | "archived"
  | "suspended";

export interface ManagedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  categoryName?: string | null;
  stock?: number | null;
  status: ManagedProductStatus;
  available?: boolean;
  featured?: boolean;
}

export interface ProductManagerProps {
  products: ManagedProduct[];
  loading?: boolean;
  deletingId?: string | null;
  updatingId?: string | null;
  onCreate?: () => void;
  onEdit?: (product: ManagedProduct) => void;
  onDelete?: (product: ManagedProduct) => void;
  onArchive?: (product: ManagedProduct) => void;
  onRestore?: (product: ManagedProduct) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

const statusLabels: Record<
  ManagedProductStatus,
  string
> = {
  draft: "Draft",
  active: "Active",
  out_of_stock: "Out of stock",
  archived: "Archived",
  suspended: "Suspended",
};

const statusVariants = {
  draft: "neutral",
  active: "success",
  out_of_stock: "warning",
  archived: "neutral",
  suspended: "danger",
} as const;

function getStockLabel(
  product: ManagedProduct,
) {
  if (
    product.status ===
    "out_of_stock"
  ) {
    return "Out of stock";
  }

  if (
    product.stock === null ||
    product.stock === undefined
  ) {
    return "Stock not set";
  }

  return `${product.stock} in stock`;
}

export default function ProductManager({
  products,
  loading = false,
  deletingId = null,
  updatingId = null,
  onCreate,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  emptyTitle = "No products yet",
  emptyDescription = "Add your first product to start selling on IyanjuWorld.",
  className = "",
}: ProductManagerProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Products
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your products, pricing and
            inventory.
          </p>
        </div>

        {onCreate && (
          <Button
            type="button"
            size="sm"
            onClick={onCreate}
          >
            <Plus
              className="h-4 w-4"
              aria-hidden="true"
            />
            Add product
          </Button>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex min-h-56 items-center justify-center">
            <Spinner
              size="lg"
              label="Loading products"
            />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={
              onCreate
                ? "Add your first product"
                : undefined
            }
            onAction={onCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Product
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Category
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Price
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Inventory
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </th>

                  <th className="w-12 px-3 py-3">
                    <span className="sr-only">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map(
                  (product) => {
                    const updating =
                      updatingId ===
                      product.id;

                    const deleting =
                      deletingId ===
                      product.id;

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-3 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <ProductImage
                              src={
                                product.imageUrl
                              }
                              alt={
                                product.name
                              }
                              aspectRatio="square"
                              className="h-12 w-12 shrink-0"
                              imageClassName="rounded-xl"
                            />

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {product.name}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                {product.featured && (
                                  <Badge
                                    variant="info"
                                    size="sm"
                                  >
                                    Featured
                                  </Badge>
                                )}

                                {!product.available &&
                                  product.status ===
                                    "active" && (
                                    <span className="text-xs text-slate-400">
                                      Hidden
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <span className="text-sm text-slate-600">
                            {product.categoryName ||
                              "Uncategorized"}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <ProductPrice
                            price={
                              product.price
                            }
                            compareAtPrice={
                              product.compareAtPrice
                            }
                            size="sm"
                            showDiscount={
                              false
                            }
                          />
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={[
                              "text-sm",
                              product.stock !==
                                null &&
                              product.stock !==
                                undefined &&
                              product.stock <=
                                5 &&
                              product.stock >
                                0
                                ? "font-semibold text-amber-600"
                                : product.status ===
                                    "out_of_stock"
                                  ? "font-semibold text-red-600"
                                  : "text-slate-600",
                            ].join(" ")}
                          >
                            {getStockLabel(
                              product,
                            )}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <Badge
                            variant={
                              statusVariants[
                                product.status
                              ]
                            }
                            size="sm"
                          >
                            {
                              statusLabels[
                                product.status
                              ]
                            }
                          </Badge>
                        </td>

                        <td className="px-3 py-4">
                          <Dropdown
                            align="right"
                            trigger={
                              <button
                                type="button"
                                disabled={
                                  updating ||
                                  deleting
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Actions for ${product.name}`}
                              >
                                <MoreVertical
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </button>
                            }
                            items={[
                              {
                                id: "edit",
                                label:
                                  "Edit product",
                                icon: Edit3,
                                onClick:
                                  () =>
                                    onEdit?.(
                                      product,
                                    ),
                                disabled:
                                  !onEdit ||
                                  updating ||
                                  deleting,
                              },
                              ...(product.status ===
                              "archived"
                                ? [
                                    {
                                      id: "restore",
                                      label:
                                        "Restore product",
                                      icon: Archive,
                                      onClick:
                                        () =>
                                          onRestore?.(
                                            product,
                                          ),
                                      disabled:
                                        !onRestore ||
                                        updating ||
                                        deleting,
                                    },
                                  ]
                                : [
                                    {
                                      id: "archive",
                                      label:
                                        "Archive product",
                                      icon: Archive,
                                      onClick:
                                        () =>
                                          onArchive?.(
                                            product,
                                          ),
                                      disabled:
                                        !onArchive ||
                                        updating ||
                                        deleting,
                                    },
                                  ]),
                              {
                                id: "delete",
                                label:
                                  deleting
                                    ? "Deleting..."
                                    : "Delete product",
                                icon: Trash2,
                                danger: true,
                                onClick:
                                  () =>
                                    onDelete?.(
                                      product,
                                    ),
                                disabled:
                                  !onDelete ||
                                  updating ||
                                  deleting,
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
