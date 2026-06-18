// ============================================================================
// CRUD Standard — Column Definitions
// All table column definitions and default visibility live here.
// To add/remove/reorder columns, edit this file only.
// ============================================================================

import { ColumnDef, VisibilityState } from "@tanstack/react-table";

import { Checkbox } from "@/components/ui/v1/checkbox";
import { ContrastBadge } from "@/components/ui/v1/contrast-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/v1/tooltip";
import { TableHeaderButton } from "@/components/layouts/v1/Table.layout";
import type { FilterableColumn } from "@/components/layouts/v1/TableFilterBuilder";
import { renderActionsCell } from "@/components/layouts/v1/TableActions";
import type { ActionsConfig } from "@/components/layouts/v1/TableActions";

import type { ItemRow } from "../helpers/mapItemDtoToRow";

export type { ActionItem, ActionsConfig } from "@/components/layouts/v1/TableActions";

const MAX_NAME_CHARS = 40;

// ── Row Actions (declarative config) ─────────────────────────────────────────
// Pages pass a simple config object — no JSX needed.
//
// Examples:
//   Quick actions only:   { quick: [{ icon: EditIcon, label: "Edit", onClick: ... }] }
//   Context menu only:    { menu: [{ icon: EditIcon, label: "Edit", onClick: ... }, "separator", ...] }
//   Both:                 { quick: [...], menu: [...] }
//   No actions column:    omit `actions` entirely

// ── Filterable columns (for TableFilterBuilder) ─────────────────────────────
// Define which columns users can filter on and their type.
// String columns auto-derive dropdown options from loaded data.

export const FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: "name",                label: "Name",              type: "string", valueType: "text" },
  { id: "year",                label: "Year",              type: "string", valueType: "dropdown" },
  { id: "currentTermStatus",   label: "Current Status",    type: "string", valueType: "dropdown" },
  { id: "previousTermStatus",  label: "Previous Status",   type: "string", valueType: "dropdown" },
  { id: "daysAbsentYtd",       label: "Days Absent (YTD)", type: "number" },
  { id: "lastActivityDate",    label: "Last Activity Date", type: "date" },
];

// ── Default column visibility ────────────────────────────────────────────────
// Columns set to `false` are hidden on initial load.
// To show a hidden column by default, set it to `true` or remove it from here.

export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  homeClass: false,
  coreClass: false,
  house: false,
  homeRoom: false,
  homeTeacher: false,
  dean: false,
  deputy: false,
};

// ── Column definitions ───────────────────────────────────────────────────────

type ColumnConfig = {
  actions?: ActionsConfig<ItemRow>;
};

export const buildItemColumns = ({ actions }: ColumnConfig = {}): ColumnDef<ItemRow>[] => [
  // NOTE: If `actions` is undefined, the actions column is omitted automatically.
  // See the spread at the end of this array.
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
        aria-label="Select all rows on this page"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableGlobalFilter: false,
    size: 1,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <TableHeaderButton label="Name" column={column} />,
    cell: ({ row }) => {
      const name = row.original.name ?? "";
      if (name.length <= MAX_NAME_CHARS) return name;
      return (
        <Tooltip>
          <TooltipTrigger>{name.slice(0, MAX_NAME_CHARS)}…</TooltipTrigger>
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      );
    },
    size: 14,
  },
  {
    accessorKey: "year",
    header: ({ column }) => <TableHeaderButton label="Year" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("year")}</span>,
    enableGlobalFilter: false,
    filterFn: (row, columnId, value) => String(row.getValue(columnId)).trim() === String(value).trim(),
    size: 4,
  },
  {
    accessorKey: "homeClass",
    header: ({ column }) => <TableHeaderButton label="Home Class" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("homeClass")}</span>,
    enableGlobalFilter: false,
    size: 6,
  },
  {
    accessorKey: "coreClass",
    header: ({ column }) => <TableHeaderButton label="Core Class" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("coreClass")}</span>,
    enableGlobalFilter: false,
    size: 6,
  },
  {
    accessorKey: "house",
    header: ({ column }) => <TableHeaderButton label="House" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("house")}</span>,
    enableGlobalFilter: false,
    size: 5,
  },
  {
    accessorKey: "homeRoom",
    header: ({ column }) => <TableHeaderButton label="Home Room" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("homeRoom")}</span>,
    enableGlobalFilter: false,
    size: 6,
  },
  {
    accessorKey: "homeTeacher",
    header: ({ column }) => <TableHeaderButton label="Home Teacher" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("homeTeacher")}</span>,
    enableGlobalFilter: false,
    size: 8,
  },
  {
    accessorKey: "dean",
    header: ({ column }) => <TableHeaderButton label="Dean" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("dean")}</span>,
    enableGlobalFilter: false,
    size: 8,
  },
  {
    accessorKey: "deputy",
    header: ({ column }) => <TableHeaderButton label="Deputy" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("deputy")}</span>,
    enableGlobalFilter: false,
    size: 8,
  },
  {
    accessorKey: "id",
    header: ({ column }) => <TableHeaderButton label="ID" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.id}</span>,
    size: 5,
  },
  {
    accessorKey: "nsn",
    header: ({ column }) => <TableHeaderButton label="NSN" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.nsn}</span>,
    size: 6,
  },
  {
    accessorKey: "previousTermStatusId",
    header: ({ column }) => <TableHeaderButton label="Previous Term" column={column} />,
    cell: ({ row }) => (
      <ContrastBadge label={row.original.previousTermStatus} colorHex={row.original.previousTermStatusColor} />
    ),
    enableGlobalFilter: false,
    size: 8,
  },
  {
    accessorKey: "currentTermStatusId",
    header: ({ column }) => <TableHeaderButton label="Current Term" column={column} />,
    cell: ({ row }) => (
      <ContrastBadge label={row.original.currentTermStatus} colorHex={row.original.currentTermStatusColor} />
    ),
    enableGlobalFilter: false,
    size: 8,
  },
  {
    accessorKey: "currentSummary",
    header: ({ column }) => <TableHeaderButton label="Current Summary" column={column} />,
    enableGlobalFilter: false,
    enableSorting: false,
    size: 8,
  },
  {
    accessorKey: "thresholdCrossed",
    header: ({ column }) => <TableHeaderButton label="Threshold Crossed" column={column} />,
    cell: ({ row }) => row.original.thresholdCrossed ?? "",
    enableGlobalFilter: false,
    size: 8,
  },
  {
    accessorKey: "daysAbsentT1",
    header: ({ column }) => <TableHeaderButton label="T1" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("daysAbsentT1")}</span>,
    enableGlobalFilter: false,
    enableSorting: false,
    size: 2,
  },
  {
    accessorKey: "daysAbsentT2",
    header: ({ column }) => <TableHeaderButton label="T2" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("daysAbsentT2")}</span>,
    enableGlobalFilter: false,
    enableSorting: false,
    size: 2,
  },
  {
    accessorKey: "daysAbsentT3",
    header: ({ column }) => <TableHeaderButton label="T3" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("daysAbsentT3")}</span>,
    enableGlobalFilter: false,
    enableSorting: false,
    size: 2,
  },
  {
    accessorKey: "daysAbsentT4",
    header: ({ column }) => <TableHeaderButton label="T4" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("daysAbsentT4")}</span>,
    enableGlobalFilter: false,
    enableSorting: false,
    size: 2,
  },
  {
    accessorKey: "daysAbsentYtd",
    header: ({ column }) => <TableHeaderButton label="YTD" column={column} />,
    cell: ({ row }) => row.getValue("daysAbsentYtd"),
    enableGlobalFilter: false,
    enableSorting: false,
    size: 2,
  },
  {
    accessorKey: "lastActivityDate",
    header: ({ column }) => <TableHeaderButton label="Last Activity" column={column} />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("lastActivityDate") ?? ""}</span>
    ),
    enableGlobalFilter: false,
    size: 7,
  },
  {
    accessorKey: "lastActivity",
    header: ({ column }) => <TableHeaderButton label="Last Response" column={column} />,
    cell: ({ row }) => row.getValue("lastActivity"),
    enableSorting: false,
    size: 14,
  },
  // ── Actions column (conditionally included) ──────────────────────────
  ...(actions
    ? [
        {
          id: "actions",
          header: () => null,
          cell: ({ row }: { row: { original: ItemRow } }) => renderActionsCell(row.original, actions),
          enableSorting: false,
          enableGlobalFilter: false,
          size: actions.quick && actions.quick.length > 0 ? 1 + actions.quick.length : 1,
        // "satisfies" checks that this object matches ColumnDef<ItemRow> at compile
        // time without widening the type. Unlike "as", it catches typos and missing
        // fields while still allowing the spread into the columns array.
        } satisfies ColumnDef<ItemRow>,
      ]
    : []),
];
