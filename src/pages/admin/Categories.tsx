import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  FolderTree,
  Plus,
  Search,
  XCircle,
} from "lucide-react";

import PageContainer from "../../components/layout/PageContainer";
import AdminFilters from "../../components/admin/AdminFilters";
import AdminTable, {
  type AdminTableColumn,
  type AdminTableRowAction,
} from "../../components/admin/AdminTable";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  parentName: string | null;
  sortOrder: number;
  productCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const initialCategories: Category[] = [
  {
    id: "category-001",
    name: "Fashion",
    slug: "fashion",
    description: "Clothing, footwear, bags and fashion accessories.",
    parentId: null,
    parentName: null,
    sortOrder: 1,
    productCount: 48,
    active: true,
    createdAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-10T11:00:00.000Z",
  },
  {
    id: "category-002",
    name: "Electronics",
    slug: "electronics",
    description: "Phones, computers, accessories and electronic devices.",
    parentId: null,
    parentName: null,
    sortOrder: 2,
    productCount: 35,
    active: true,
    createdAt: "2026-09-01T09:30:00.000Z",
    updatedAt: "2026-09-09T12:00:00.000Z",
  },
  {
    id: "category-003",
    name: "Mobile Phones",
    slug: "mobile-phones",
    description: "Smartphones and mobile phones.",
    parentId: "category-002",
    parentName: "Electronics",
    sortOrder: 1,
    productCount: 22,
    active: true,
    createdAt: "2026-09-02T10:00:00.000Z",
    updatedAt: "2026-09-09T12:30:00.000Z",
  },
  {
    id: "category-004",
    name: "Home & Living",
    slug: "home-living",
    description: "Furniture, home accessories and household products.",
    parentId: null,
    parentName: null,
    sortOrder: 3,
    productCount: 27,
    active: true,
    createdAt: "2026-09-02T11:00:00.000Z",
    updatedAt: "2026-09-08T14:00:00.000Z",
  },
  {
    id: "category-005",
    name: "Beauty",
    slug: "beauty",
    description: "Beauty, skincare, haircare and personal care products.",
    parentId: null,
    parentName: null,
    sortOrder: 4,
    productCount: 19,
    active: true,
    createdAt: "2026-09-03T08:30:00.000Z",
    updatedAt: "2026-09-08T15:00:00.000Z",
  },
  {
    id: "category-006",
    name: "Food & Groceries",
    slug: "food-groceries",
    description: "Food, groceries, beverages and household consumables.",
    parentId: null,
    parentName: null,
    sortOrder: 5,
    productCount: 31,
    active: true,
    createdAt: "2026-09-03T09:00:00.000Z",
    updatedAt: "2026-09-08T16:00:00.000Z",
  },
  {
    id: "category-007",
    name: "Accessories",
    slug: "accessories",
    description: "Mobile, computer and electronic accessories.",
    parentId: "category-002",
    parentName: "Electronics",
    sortOrder: 2,
    productCount: 13,
    active: false,
    createdAt: "2026-09-04T10:00:00.000Z",
    updatedAt: "2026-09-07T13:00:00.000Z",
  },
];

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function Categories() {
  const [categories, setCategories] =
    useState<Category[]>(initialCategories);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState("1");

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories
      .filter((category) => {
        const matchesSearch =
          !query ||
          category.name.toLowerCase().includes(query) ||
          category.slug.toLowerCase().includes(query) ||
          category.description
            .toLowerCase()
            .includes(query) ||
          category.parentName
            ?.toLowerCase()
            .includes(query);

        const matchesStatus =
          !status ||
          (status === "active"
            ? category.active
            : !category.active);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (a.parentId === b.parentId) {
          return a.sortOrder - b.sortOrder;
        }

        if (!a.parentId) {
          return -1;
        }

        if (!b.parentId) {
          return 1;
        }

        return (a.parentName || "").localeCompare(
          b.parentName || "",
        );
      });
  }, [categories, search, status]);

  const parentCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          !category.parentId &&
          category.id !== editingCategory?.id,
      ),
    [categories, editingCategory],
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setParentId("");
    setSortOrder("1");
    setEditingCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description);
    setParentId(category.parentId || "");
    setSortOrder(String(category.sortOrder));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const saveCategory = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    const selectedParent =
      categories.find(
        (category) => category.id === parentId,
      ) || null;

    if (editingCategory) {
      setCategories((current) =>
        current.map((category) =>
          category.id === editingCategory.id
            ? {
                ...category,
                name: trimmedName,
                slug: slugify(trimmedName),
                description: description.trim(),
                parentId: selectedParent?.id || null,
                parentName: selectedParent?.name || null,
                sortOrder:
                  Number.parseInt(sortOrder, 10) || 1,
                updatedAt: new Date().toISOString(),
              }
            : category,
        ),
      );
    } else {
      const newCategory: Category = {
        id: `category-${Date.now()}`,
        name: trimmedName,
        slug: slugify(trimmedName),
        description: description.trim(),
        parentId: selectedParent?.id || null,
        parentName: selectedParent?.name || null,
        sortOrder:
          Number.parseInt(sortOrder, 10) || 1,
        productCount: 0,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCategories((current) => [
        ...current,
        newCategory,
      ]);
    }

    closeModal();
  };

  const toggleCategory = (categoryId: string) => {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              active: !category.active,
              updatedAt: new Date().toISOString(),
            }
          : category,
      ),
    );
  };

  const moveCategory = (
    categoryId: string,
    direction: "up" | "down",
  ) => {
    setCategories((current) => {
      const category = current.find(
        (item) => item.id === categoryId,
      );

      if (!category) {
        return current;
      }

      const siblings = current
        .filter(
          (item) =>
            item.parentId === category.parentId,
        )
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const index = siblings.findIndex(
        (item) => item.id === categoryId,
      );

      const targetIndex =
        direction === "up" ? index - 1 : index + 1;

      if (
        index < 0 ||
        targetIndex < 0 ||
        targetIndex >= siblings.length
      ) {
        return current;
      }

      const target = siblings[targetIndex];

      return current.map((item) => {
        if (item.id === category.id) {
          return {
            ...item,
            sortOrder: target.sortOrder,
            updatedAt: new Date().toISOString(),
          };
        }

        if (item.id === target.id) {
          return {
            ...item,
            sortOrder: category.sortOrder,
            updatedAt: new Date().toISOString(),
          };
        }

        return item;
      });
    });
  };

  const columns: AdminTableColumn<Category>[] = [
    {
      id: "category",
      header: "Category",
      accessor: "name",
      sortable: true,
      render: (_, category) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <FolderTree className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">
              {category.name}
            </div>

            <div className="truncate text-xs text-slate-500">
              /{category.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "parent",
      header: "Parent category",
      accessor: "parentName",
      sortable: true,
      render: (value) =>
        value ? (
          <span className="text-sm text-slate-700">
            {value}
          </span>
        ) : (
          <span className="text-sm text-slate-400">
            Main category
          </span>
        ),
    },
    {
      id: "products",
      header: "Products",
      accessor: "productCount",
      sortable: true,
      align: "center",
      render: (value) => (
        <span className="text-sm font-medium text-slate-700">
          {value}
        </span>
      ),
    },
    {
      id: "order",
      header: "Order",
      accessor: "sortOrder",
      sortable: true,
      align: "center",
      render: (value) => (
        <span className="text-sm text-slate-700">
          {value}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: "active",
      sortable: true,
      render: (value) => (
        <Badge variant={value ? "success" : "default"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "updated",
      header: "Updated",
      accessor: "updatedAt",
      sortable: true,
      render: (value) => (
        <span className="whitespace-nowrap text-sm text-slate-600">
          {formatDate(value)}
        </span>
      ),
    },
  ];

  const getRowActions = (
    category: Category,
  ): AdminTableRowAction[] => [
    {
      id: "edit",
      label: "Edit category",
      icon: Edit3,
      onClick: () => openEditModal(category),
    },
    {
      id: "up",
      label: "Move up",
      icon: ChevronUp,
      disabled:
        categories
          .filter(
            (item) =>
              item.parentId === category.parentId,
          )
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .findIndex(
            (item) => item.id === category.id,
          ) <= 0,
      onClick: () =>
        moveCategory(category.id, "up"),
    },
    {
      id: "down",
      label: "Move down",
      icon: ChevronDown,
      disabled:
        categories
          .filter(
            (item) =>
              item.parentId === category.parentId,
          )
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .findIndex(
            (item) => item.id === category.id,
          ) >=
        categories.filter(
          (item) =>
            item.parentId === category.parentId,
        ).length -
          1,
      onClick: () =>
        moveCategory(category.id, "down"),
    },
    {
      id: category.active ? "deactivate" : "activate",
      label: category.active
        ? "Deactivate category"
        : "Activate category",
      icon: category.active
        ? XCircle
        : CheckCircle2,
      danger: category.active,
      onClick: () => toggleCategory(category.id),
    },
  ];

  const activeCount = categories.filter(
    (category) => category.active,
  ).length;

  const inactiveCount =
    categories.length - activeCount;

  const totalProducts = categories.reduce(
    (sum, category) =>
      sum + category.productCount,
    0,
  );

  return (
    <PageContainer
      title="Categories"
      description="Manage the marketplace category structure and product discovery hierarchy."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Category Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Organize marketplace products into clear,
              searchable categories.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={openCreateModal}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add category
          </Button>
        </div>

        <AdminFilters>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search categories..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter categories by status"
          >
            {statusOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("");
            }}
          >
            Clear filters
          </Button>
        </AdminFilters>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Total categories
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {categories.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Active categories
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">
              Products assigned
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {totalProducts}
            </p>

            {inactiveCount > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                {inactiveCount} inactive categor
                {inactiveCount === 1
                  ? "y"
                  : "ies"}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <FolderTree className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

            <div>
              <p className="font-medium text-slate-800">
                Marketplace category hierarchy
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Main categories can contain child categories.
                Category ordering controls how products are
                presented across the public marketplace.
              </p>
            </div>
          </div>
        </div>

        <AdminTable
          columns={columns}
          data={filteredCategories}
          rowKey={(category) => category.id}
          getRowActions={getRowActions}
          emptyTitle="No categories found"
          emptyDescription="No categories match the current search or filters."
          selectable
          pagination
          pageSize={10}
          stickyHeader
          striped
        />

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-500">
            Showing {filteredCategories.length} of{" "}
            {categories.length} categories
          </p>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={
          editingCategory
            ? "Edit category"
            : "Create category"
        }
      >
        <div className="space-y-5">
          <Input
            label="Category name"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="e.g. Fashion"
          />

          <div>
            <label
              htmlFor="category-description"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Description
            </label>

            <textarea
              id="category-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe the products that belong in this category."
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="category-parent"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Parent category
            </label>

            <select
              id="category-parent"
              value={parentId}
              onChange={(event) =>
                setParentId(event.target.value)
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option value="">
                Main category
              </option>

              {parentCategories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Display order"
            type="number"
            min={1}
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value)
            }
            placeholder="1"
          />

          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">
              URL slug
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              /{slugify(name) || "category-name"}
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={closeModal}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              disabled={!name.trim()}
              onClick={saveCategory}
            >
              {editingCategory
                ? "Save changes"
                : "Create category"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
