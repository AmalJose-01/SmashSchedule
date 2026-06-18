// ============================================================================
// CRUD Standard — Item Table
// Features: multi-select rows, column sorting, pagination, search.
// Uses TanStack Table + shared TableLayout components.
// ============================================================================

import { useMemo, useState } from "react";
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { EditIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/v1/button";
import { Skeleton } from "@/components/ui/v1/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/v1/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/v1/table";
import {
  TableContent,
  TableEmpty,
  TableLayout,
  TablePaginationMobileFriendly,
  TablePrimaryButtons,
  TablePrimaryFilters,
  TableSearch,
  TableServerFilters,
} from "@/components/layouts/v1/Table.layout";
import { TableFilterBuilder, filterBuilderFn } from "@/components/layouts/v1/TableFilterBuilder";

import type { ItemRow } from "../helpers/mapItemDtoToRow";
import type { GetItemsParams } from "../Services/crud.services";
import { buildItemColumns, DEFAULT_COLUMN_VISIBILITY, FILTERABLE_COLUMNS, type ActionsConfig } from "../columns/itemColumns";
import { StatusPlaceholder } from "./StatusPlaceholder";

// ── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ── Props ───────────────────────────────────────────────────────────────────

type ItemTableProps = {
  rows: ItemRow[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  hasSearched: boolean;
  yearOptions: string[];
  onServerSearch: (params: GetItemsParams) => void;
  onCreate: () => void;
  onEdit: (itemId: number) => void;
  onDeleteSelected: (selectedIds: number[]) => void;
};

// ── Component ───────────────────────────────────────────────────────────────

const SKELETON_COLS = 8;
const SKELETON_ROWS = PAGE_SIZE;

const SKELETON_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-1/3", "w-1/2", "w-2/5", "w-3/5", "w-1/4"];

function TableSkeletonRows() {
  return (
    <Table className="table-fixed" aria-label="Loading items">
      <TableHeader>
        <TableRow>
          {Array.from({ length: SKELETON_COLS }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-3 w-2/3 rounded-sm" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
          <TableRow key={rowIdx} className="h-10">
            {Array.from({ length: SKELETON_COLS }).map((_, colIdx) => (
              <TableCell key={colIdx}>
                <Skeleton className={`h-4 rounded-sm ${SKELETON_WIDTHS[colIdx % SKELETON_WIDTHS.length]}`} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const ItemTable = ({
  rows,
  isLoading,
  isFetching,
  isError,
  hasSearched,
  yearOptions,
  onServerSearch,
  onCreate,
  onEdit,
  onDeleteSelected,
}: ItemTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchValue, setSearchValue] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Server filter: year (local state until user clicks Search)
  const [selectedYear, setSelectedYear] = useState<string>("");

  // ── Column definitions (from columns/itemColumns.tsx) ─────────────────

  const actions = useMemo<ActionsConfig<ItemRow>>(
    () => ({
      quick: [
        { icon: EditIcon, label: "Edit", onClick: (row) => onEdit(row.id) },
      ],
      menu: [
        { icon: EditIcon, label: "Edit", onClick: (row) => onEdit(row.id) },
        "separator",
        { icon: Trash2Icon, label: "Delete", variant: "destructive", onClick: (row) => onDeleteSelected([row.id]) },
      ],
    }),
    [onEdit, onDeleteSelected],
  );

  const columns = useMemo(
    () => buildItemColumns({ actions }),
    [actions],
  );

  // ── Table instance ────────────────────────────────────────────────────

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    filterFns: {
      filterBuilder: (row, columnId, filterValue) =>
        filterBuilderFn(row, columnId, filterValue, FILTERABLE_COLUMNS),
    },
    defaultColumn: {
      // "as never" tells TypeScript to accept our custom filterFn name.
      // TanStack Table's type only allows built-in filter names, but we
      // registered "filterBuilder" above in filterFns — this cast bridges the gap.
      filterFn: "filterBuilder" as never,
    },
    state: { sorting, globalFilter: searchValue, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearchValue,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => String(row.id),
    initialState: {
      pagination: { pageSize: PAGE_SIZE },
      columnVisibility: DEFAULT_COLUMN_VISIBILITY,
    },
  });

  // ── Derived state ─────────────────────────────────────────────────────

  // `rowSelection` is included as a dependency to trigger recalculation when
  // the user checks/unchecks rows, even though it isn't referenced directly
  // inside the memo. This is a standard TanStack Table pattern because
  // `table.getSelectedRowModel()` reads from internal table state that updates
  // when `rowSelection` changes.
  const selectedIds = useMemo(
    () =>
      table
        .getSelectedRowModel()
        .rows.map((r) => r.original.id),
    [table, rowSelection], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const selectedCount = selectedIds.length;

  // ── Column width normalization ───────────────────────────────────────
  // TanStack `size` values are proportions, not percentages.
  // Normalize visible columns to sum to 100% for table-fixed layout.

  const totalSize = table.getVisibleFlatColumns().reduce((sum, col) => sum + col.getSize(), 0);
  const getColWidth = (size: number) => `${((size / totalSize) * 100).toFixed(2)}%`;

  // ── Pagination helpers ────────────────────────────────────────────────

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1; // 1-indexed


  const hasData = hasSearched && rows.length > 0;

  // ── Derived: show skeleton when loading or refetching ─────────────────
  const showSkeleton = isLoading || isFetching;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <TableLayout size="sm" stickyHeader>
      {/* Server-side filters (pre-fetch) */}
      <TableServerFilters>
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">Year</label>
          <Select value={selectedYear || "__all"} onValueChange={(val) => setSelectedYear(val === "__all" ? "" : val)}>
            <SelectTrigger className="bg-background w-44" aria-label="Select year">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All Years</SelectItem>
              {yearOptions.filter((yr) => yr !== "").map((yr) => (
                <SelectItem key={yr} value={yr}>
                  {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="self-end"
          onClick={() => onServerSearch({ year: selectedYear || undefined })}
        >
          <SearchIcon /> Search
        </Button>
      </TableServerFilters>

      {/* Client-side controls — slots must be direct children for getSlots to find them */}
      {(hasData || showSkeleton) && (
        <TableSearch
          placeholder="Filter results..."
          value={searchValue}
          onSearchChange={(e) => setSearchValue(e.target.value)}
          className="bg-background min-w-56"
        />
      )}

      {(hasData || showSkeleton) && (
        <TablePrimaryFilters>
          <TableFilterBuilder
            columns={FILTERABLE_COLUMNS}
            filters={columnFilters}
            onFiltersChange={setColumnFilters}
            rows={rows}
          />
        </TablePrimaryFilters>
      )}

      <TablePrimaryButtons>
        {selectedCount > 0 && (
          <Button variant="destructive" onClick={() => onDeleteSelected(selectedIds)}>
            <Trash2Icon /> Delete ({selectedCount})
          </Button>
        )}
        <Button onClick={onCreate}>
          <PlusIcon /> Create Item
        </Button>
      </TablePrimaryButtons>

      <TableContent>
        {isError ? (
          <StatusPlaceholder variant="error">Unable to load items. Please try again later.</StatusPlaceholder>
        ) : showSkeleton ? (
          <div className="overflow-hidden md:min-h-[calc(100vh-280px)]">
            <TableSkeletonRows />
          </div>
        ) : !hasSearched ? (
          <TableEmpty>Select filters above and click Search to load data.</TableEmpty>
        ) : table.getRowModel().rows.length === 0 ? (
          <TableEmpty>No items found.</TableEmpty>
        ) : (
          <div className="overflow-x-auto overflow-y-auto md:max-h-[calc(100vh-280px)]">
            <Table className="table-fixed" aria-label="Items list">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} style={{ width: getColWidth(header.getSize()) }}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} style={{ width: getColWidth(cell.column.getSize()) }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TableContent>

      {pageCount > 1 && (
        <TablePaginationMobileFriendly
          pageCount={pageCount}
          currentPage={currentPage}
          onPageChange={(page) => table.setPageIndex(page - 1)}
          totalItems={rows.length}
        />
      )}
    </TableLayout>
  );
};
