import type {
  ReactNode,
  MouseEvent,
} from "react";
import type { LucideIcon } from "lucide-react";

import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from "lucide-react";

import EmptyState from "../ui/EmptyState";
import Spinner from "../ui/Spinner";
import Dropdown, {
  type DropdownItem,
} from "../ui/Dropdown";

export interface AdminTableColumn<T> {
  id: string;
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  render?: (value: any, row: T, index: number) => ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface AdminTableAction<T> {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: (
    row: T,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  disabled?: (
    row: T,
  ) => boolean;
  danger?: boolean;
}

export interface AdminTableRowAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];

  getRowId?: (
    row: T,
    index: number,
  ) => string;
  rowKey?: (
    row: T,
    index: number,
  ) => string;

  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: string;
  emptyIcon?: LucideIcon | ReactNode;

  actions?: AdminTableAction<T>[];
  getRowActions?: (row: T) =>
    | AdminTableAction<T>[]
    | AdminTableRowAction[];

  onRowClick?: (
    row: T,
    index: number,
  ) => void;

  sortBy?: string | null;
  sortDirection?: "asc" | "desc";

  onSort?: (
    column: AdminTableColumn<T>,
  ) => void;

  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (
    ids: string[],
  ) => void;

  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (
    page: number,
  ) => void;

  stickyHeader?: boolean;
  striped?: boolean;
  compact?: boolean;
  pagination?: boolean;
  ariaLabel?: string;

  className?: string;
}

function getAlignmentClass(
  align: AdminTableColumn<any>["align"],
) {
  switch (align) {
    case "center":
      return "text-center";

    case "right":
      return "text-right";

    case "left":
    default:
      return "text-left";
  }
}

function getJustifyClass(
  align: AdminTableColumn<any>["align"],
) {
  switch (align) {
    case "center":
      return "justify-center";

    case "right":
      return "justify-end";

    case "left":
    default:
      return "justify-start";
  }
}

function getValue<T>(
  row: T,
  column: AdminTableColumn<T>,
  index: number,
) {
  let value: unknown;

  if (typeof column.accessor === "function") {
    value = column.accessor(row);
  } else if (column.accessor) {
    value = row[column.accessor];
  }

  if (column.render) {
    return column.render(value, row, index);
  }

  if (value != null) {
    return typeof value === "string" ? value : String(value);
  }

  return "—";
}

export default function AdminTable<
  T,
>({
  columns,
  data,
  getRowId,
  rowKey,
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are no records to display.",
  emptyMessage,
  emptyIcon,
  actions = [],
  getRowActions,
  onRowClick,
  sortBy = null,
  sortDirection = "asc",
  onSort,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  page = 1,
  pageSize = 20,
  totalItems,
  onPageChange,
  stickyHeader = true,
  striped = false,
  compact = false,
  pagination = false,
  ariaLabel,
  className = "",
}: AdminTableProps<T>) {
  const resolvedGetRowId =
    getRowId ??
    rowKey ??
    ((row: T, index: number) => {
      const candidate = (row as T & { id?: unknown }).id;
      return candidate != null
        ? String(candidate)
        : String(index);
    });

  const resolvedActions =
    getRowActions
      ? (row: T): AdminTableAction<T>[] =>
          getRowActions(row).map((action) => ({
            ...action,
            disabled:
              typeof action.disabled === "function"
                ? action.disabled
                : () => Boolean(action.disabled),
            onClick: (currentRow: T, event: MouseEvent<HTMLButtonElement>) => {
              if (action.onClick.length === 0) {
                (action.onClick as () => void)();
              } else {
                (action.onClick as (row: T, event: MouseEvent<HTMLButtonElement>) => void)(currentRow, event);
              }
            },
          }))
      : () => actions;

  const hasActions =
    actions.length > 0 ||
    Boolean(getRowActions);

  const resolvedEmptyTitle =
    emptyMessage ?? emptyTitle;

  const allSelected =
    selectable &&
    data.length > 0 &&
    data.every((row, index) =>
      selectedIds.includes(
        resolvedGetRowId(row, index),
      ),
    );

  const totalPages =
    totalItems != null
      ? Math.max(
          1,
          Math.ceil(
            totalItems / pageSize,
          ),
        )
      : 1;

  const toggleAll = () => {
    if (!onSelectionChange) {
      return;
    }

    if (allSelected) {
      const currentIds = data.map(
        (row, index) =>
          resolvedGetRowId(row, index),
      );

      onSelectionChange(
        selectedIds.filter(
          (id) =>
            !currentIds.includes(id),
        ),
      );

      return;
    }

    const mergedIds = Array.from(
      new Set([
        ...selectedIds,
        ...data.map(
          (row, index) =>
            resolvedGetRowId(row, index),
        ),
      ]),
    );

    onSelectionChange(mergedIds);
  };

  const toggleRow = (
    row: T,
    index: number,
  ) => {
    if (!onSelectionChange) {
      return;
    }

    const id = resolvedGetRowId(row, index);

    if (selectedIds.includes(id)) {
      onSelectionChange(
        selectedIds.filter(
          (selectedId) =>
            selectedId !== id,
        ),
      );
    } else {
      onSelectionChange([
        ...selectedIds,
        id,
      ]);
    }
  };

  const getActionItems = (
    row: T,
  ): DropdownItem[] =>
    resolvedActions(row).map((action) => ({
      id: action.id,
      label: action.label,
      icon: action.icon,
      danger: action.danger,
      disabled:
        typeof action.disabled ===
        "function"
          ? action.disabled(row)
          : Boolean(
              action.disabled,
            ),
      onClick: () => {
        action.onClick(
          row,
          {} as MouseEvent<HTMLButtonElement>,
        );
      },
    }));

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead
            className={[
              "bg-slate-50",
              stickyHeader
                ? "sticky top-0 z-10"
                : "",
            ].join(" ")}
          >
            <tr className="border-b border-slate-200">
              {selectable && (
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      allSelected
                    }
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  />
                </th>
              )}

              {columns.map(
                (column) => (
                  <th
                    key={column.id}
                    scope="col"
                    style={{
                      width:
                        column.width,
                    }}
                    className={[
                      "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
                      getAlignmentClass(
                        column.align,
                      ),
                      column.headerClassName ||
                        "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {column.sortable &&
                    onSort ? (
                      <button
                        type="button"
                        className={[
                          "inline-flex w-full items-center gap-1.5",
                          getJustifyClass(
                            column.align,
                          ),
                          "transition-colors hover:text-slate-900",
                        ].join(" ")}
                        onClick={() =>
                          onSort(column)
                        }
                      >
                        <span>
                          {
                            column.header
                          }
                        </span>

                        {sortBy ===
                        column.id ? (
                          sortDirection ===
                          "asc" ? (
                            <ChevronUp
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          ) : (
                            <ChevronDown
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          )
                        ) : (
                          <ChevronDown
                            className="h-3.5 w-3.5 opacity-30"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ),
              )}

              {hasActions && (
                <th
                  scope="col"
                  className="w-14 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  <span className="sr-only">
                    Actions
                  </span>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (selectable
                      ? 1
                      : 0) +
                    (hasActions
                      ? 1
                      : 0)
                  }
                  className="px-6 py-16 text-center"
                >
                  <div className="flex justify-center">
                    <Spinner
                      size="md"
                      label="Loading records..."
                    />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (selectable
                      ? 1
                      : 0) +
                    (hasActions
                      ? 1
                      : 0)
                  }
                  className="p-6"
                >
                  <EmptyState
                    icon={emptyIcon}
                    title={resolvedEmptyTitle}
                    description={
                      emptyDescription
                    }
                  />
                </td>
              </tr>
            ) : (
              data.map(
                (row, index) => {
                  const rowId =
                    resolvedGetRowId(
                      row,
                      index,
                    );

                  const selected =
                    selectedIds.includes(
                      rowId,
                    );

                  const rowClickable =
                    Boolean(
                      onRowClick,
                    );

                  return (
                    <tr
                      key={rowId}
                      className={[
                        striped &&
                        index % 2 === 1
                          ? "bg-slate-50/50"
                          : "bg-white",
                        selected
                          ? "bg-slate-50"
                          : "",
                        rowClickable
                          ? "cursor-pointer transition-colors hover:bg-slate-50"
                          : "",
                      ].join(" ")}
                      onClick={() =>
                        onRowClick?.(
                          row,
                          index,
                        )
                      }
                    >
                      {selectable && (
                        <td
                          className="w-12 px-4 py-3"
                          onClick={(
                            event,
                          ) =>
                            event.stopPropagation()
                          }
                        >
                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            onChange={() =>
                              toggleRow(
                                row,
                                index,
                              )
                            }
                            aria-label={`Select row ${index + 1}`}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                          />
                        </td>
                      )}

                      {columns.map(
                        (
                          column,
                        ) => (
                          <td
                            key={
                              column.id
                            }
                            className={[
                              compact
                                ? "px-4 py-2.5"
                                : "px-4 py-3.5",
                              "text-sm text-slate-700",
                              getAlignmentClass(
                                column.align,
                              ),
                              column.className ||
                                "",
                            ]
                              .filter(
                                Boolean,
                              )
                              .join(
                                " ",
                              )}
                          >
                            {column.render
                              ? column.render(
                                  typeof column.accessor === "function"
                                    ? column.accessor(row)
                                    : column.accessor
                                      ? row[column.accessor]
                                      : undefined,
                                  row,
                                  index,
                                )
                              : typeof column.accessor === "function"
                                ? column.accessor(row)
                                : column.accessor &&
                                    row[column.accessor] != null
                                  ? String(row[column.accessor])
                                  : "—"}
                          </td>
                        ),
                      )}

                      {hasActions && (
                        <td
                          className="w-14 px-4 py-3 text-right"
                          onClick={(
                            event,
                          ) =>
                            event.stopPropagation()
                          }
                        >
                          <Dropdown
                            trigger={
                              <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                aria-label="Row actions"
                              >
                                <MoreHorizontal
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </button>
                            }
                            items={getActionItems(
                              row,
                            )}
                            align="right"
                          />
                        </td>
                      )}
                    </tr>
                  );
                },
              )
            )}
          </tbody>
        </table>
      </div>

      {totalItems != null &&
        totalItems > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {Math.min(
                  (page - 1) *
                    pageSize +
                    1,
                  totalItems,
                )}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-700">
                {Math.min(
                  page * pageSize,
                  totalItems,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-700">
                {totalItems}
              </span>
            </p>

            {onPageChange &&
              totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      onPageChange(
                        page - 1,
                      )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-2 text-xs text-slate-500">
                    Page {page} of{" "}
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      page >=
                      totalPages
                    }
                    onClick={() =>
                      onPageChange(
                        page + 1,
                      )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
          </div>
        )}
    </div>
  );
}

export { AdminTable };
