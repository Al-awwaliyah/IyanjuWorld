import type {
  ComponentType,
  MouseEvent,
  ReactNode,
} from "react";

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
  accessor?: keyof T;
  render?: (
    value: T[keyof T] | undefined,
    row: T,
    index: number,
  ) => ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface AdminTableAction<T> {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (
    row: T,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void;
  disabled?: boolean | ((row: T) => boolean);
  danger?: boolean;
}

/*
 * Backward-compatible name used by the existing admin pages.
 */
export type AdminTableRowAction<T = unknown> =
  AdminTableAction<T>;

export interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];

  /*
   * Current API.
   */
  getRowId?: (
    row: T,
    index: number,
  ) => string;

  /*
   * Existing admin-page API.
   */
  rowKey?: (
    row: T,
    index: number,
  ) => string;

  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ComponentType<{
    className?: string;
  }>;

  /*
   * Static actions.
   */
  actions?: AdminTableAction<T>[];

  /*
   * Existing admin-page API.
   * Actions can be generated per row.
   */
  getRowActions?: (
    row: T,
  ) => AdminTableRowAction<T>[];

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

  /*
   * Pagination support.
   */
  pagination?: boolean;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (
    page: number,
  ) => void;

  stickyHeader?: boolean;
  striped?: boolean;
  compact?: boolean;

  className?: string;
}

function getAlignmentClass(
  align: AdminTableColumn<unknown>["align"],
): string {
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
  align: AdminTableColumn<unknown>["align"],
): string {
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

export default function AdminTable<T>({
  columns,
  data,
  getRowId,
  rowKey,
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are no records to display.",
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
  pagination = false,
  page = 1,
  pageSize = 20,
  totalItems,
  onPageChange,
  stickyHeader = true,
  striped = false,
  compact = false,
  className = "",
}: AdminTableProps<T>) {
  const resolveRowId = (
    row: T,
    index: number,
  ): string => {
    if (getRowId) {
      return getRowId(row, index);
    }

    if (rowKey) {
      return rowKey(row, index);
    }

    /*
     * Every production table should provide either getRowId
     * or rowKey. This fallback only prevents a runtime crash
     * while keeping the component resilient.
     */
    return String(index);
  };

  const resolveRowActions = (
    row: T,
  ): AdminTableRowAction<T>[] => {
    if (getRowActions) {
      return getRowActions(row);
    }

    return actions;
  };

  const hasActions =
    data.some(
      (row) =>
        resolveRowActions(row).length > 0,
    ) || actions.length > 0;

  const allSelected =
    selectable &&
    data.length > 0 &&
    data.every((row, index) =>
      selectedIds.includes(
        resolveRowId(row, index),
      ),
    );

  const effectiveTotalItems =
    totalItems ??
    (pagination ? data.length : undefined);

  const totalPages =
    effectiveTotalItems != null
      ? Math.max(
          1,
          Math.ceil(
            effectiveTotalItems /
              pageSize,
          ),
        )
      : 1;

  const toggleAll = () => {
    if (!onSelectionChange) {
      return;
    }

    const currentIds = data.map(
      (row, index) =>
        resolveRowId(row, index),
    );

    if (allSelected) {
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
        ...currentIds,
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

    const id = resolveRowId(
      row,
      index,
    );

    if (selectedIds.includes(id)) {
      onSelectionChange(
        selectedIds.filter(
          (selectedId) =>
            selectedId !== id,
        ),
      );

      return;
    }

    onSelectionChange([
      ...selectedIds,
      id,
    ]);
  };

  const getActionItems = (
    row: T,
  ): DropdownItem[] =>
    resolveRowActions(row).map(
      (action) => ({
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
          );
        },
      }),
    );

  const renderCell = (
    row: T,
    column: AdminTableColumn<T>,
    index: number,
  ): ReactNode => {
    const value =
      column.accessor
        ? row[column.accessor]
        : undefined;

    if (column.render) {
      return column.render(
        value,
        row,
        index,
      );
    }

    if (value != null) {
      return String(value);
    }

    return "—";
  };

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
                    title={emptyTitle}
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
                    resolveRowId(
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
                            {renderCell(
                              row,
                              column,
                              index,
                            )}
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
                          {resolveRowActions(
                            row,
                          ).length > 0 && (
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
                          )}
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

      {effectiveTotalItems !=
        null &&
        effectiveTotalItems > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {Math.min(
                  (page - 1) *
                    pageSize +
                    1,
                  effectiveTotalItems,
                )}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-700">
                {Math.min(
                  page * pageSize,
                  effectiveTotalItems,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-700">
                {effectiveTotalItems}
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
