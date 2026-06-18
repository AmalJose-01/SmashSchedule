# Building a New Module: Medical Masters

> **Based on:** CRUD v4 reference implementation (`src/features/react-crud-v4/`)
> **Template doc:** See `implementation-v4.md` for the line-by-line walkthrough of the reference.
> **Date:** 2026-02-16

This guide walks you through creating a **Medical Masters** CRUD module step-by-step, using the v4 architecture. Each step shows exactly what to create, with example code tailored to the Medical Masters domain.

---

## Overview

**Medical Masters** is a simple lookup table for medical condition types (e.g., Asthma, Diabetes, Allergy). It has:
- A **list** page with search, filter, sort, pagination
- A **create** dialog
- An **edit** dialog
- A **delete** confirmation

### Target folder structure

```
src/features/medical-masters/
├── Services/
│   ├── medicalMasters.dtos.ts        Step 1
│   ├── medicalMasters.services.ts    Step 2
│   ├── medicalMasters.queries.ts     Step 3
│   └── medicalMasters.types.ts       Step 4
├── helpers/
│   ├── mapMedicalMasterDtoToRow.ts   Step 5
│   └── buildEditContext.ts           Step 6
├── columns/
│   └── medicalMasterColumns.tsx      Step 7
├── hooks/
│   └── useMedicalMastersPage.ts      Step 8
├── components/
│   ├── MedicalMasterTable.tsx        Step 9
│   ├── MedicalMasterModal.tsx        Step 10
│   ├── MedicalMasterForm.tsx         Step 11
│   ├── DeleteConfirmModal.tsx        Step 12
│   └── StatusPlaceholder.tsx         Step 13
└── MedicalMasters.page.tsx           Step 14
```

---

## Step 1: Define DTOs — `Services/medicalMasters.dtos.ts`

> **What:** Zod schemas that mirror the backend API contracts. Types are inferred via `z.infer` — single source of truth.
> **Rule:** PascalCase field names to match C# backend. Schemas for responses (untrusted), plain types for requests (our code).

```typescript
// ============================================================================
// Medical Masters — DTOs (Data Transfer Objects)
// Zod schemas validate API responses at runtime. Types are inferred from
// schemas so there is a single source of truth — no type/schema drift.
// Keep these 1:1 with the backend — never mix UI concerns here.
// ============================================================================

import { z } from "zod";

// ── READ (list) ─────────────────────────────────────────────────────────────

export const MedicalMasterDtoSchema = z.object({
  MedicalConditionId: z.number(),
  ConditionName: z.string(),
  ConditionCode: z.string(),
  Category: z.string(),           // e.g. "Chronic", "Allergy", "Disability"
  Description: z.string().nullable(),
  IsActive: z.boolean(),
  SortOrder: z.number(),
  CreatedDate: z.string(),        // ISO date string from backend
  ModifiedDate: z.string().nullable(),
});

export const GetMedicalMastersResponseSchema = z.object({
  MedicalConditions: z.array(MedicalMasterDtoSchema),
});

export type GetMedicalMastersResponse = z.infer<typeof GetMedicalMastersResponseSchema>;
export type MedicalMasterDto = z.infer<typeof MedicalMasterDtoSchema>;

// ── READ (categories for dropdown) ──────────────────────────────────────────

export const CategoryDtoSchema = z.object({
  CategoryId: z.number(),
  CategoryName: z.string(),
});

export const GetCategoriesResponseSchema = z.object({
  Categories: z.array(CategoryDtoSchema),
});

export type GetCategoriesResponse = z.infer<typeof GetCategoriesResponseSchema>;
export type CategoryDto = z.infer<typeof CategoryDtoSchema>;

// ── CREATE ──────────────────────────────────────────────────────────────────
// Request types are plain — outgoing payloads don't need runtime validation.

export type CreateMedicalMasterRequest = {
  conditionName: string;
  conditionCode: string;
  categoryId: number;
  description: string;
  isActive: boolean;
  sortOrder: number;
};

export type CreateMedicalMasterResponse = {
  MedicalConditionId: number;
};

// ── UPDATE ──────────────────────────────────────────────────────────────────

export type UpdateMedicalMasterRequest = {
  medicalConditionId: number;
  conditionName: string;
  conditionCode: string;
  categoryId: number;
  description: string;
  isActive: boolean;
  sortOrder: number;
};

export type UpdateMedicalMasterResponse = {
  Success: boolean;
};

// ── DELETE ───────────────────────────────────────────────────────────────────

export type DeleteMedicalMasterRequest = {
  medicalConditionId: number;
};
```

### What to check
- [ ] Every field matches the C# model exactly (PascalCase for responses)
- [ ] Nullable fields use `z.string().nullable()` (not `z.string().optional()`)
- [ ] Response types use `z.infer<typeof Schema>` — never hand-write a type that has a schema
- [ ] Request types are plain `type` — no Zod needed for outgoing payloads
- [ ] No UI types mixed in (no `ItemRow`, no `FormValues`)

---

## Step 2: Define Services — `Services/medicalMasters.services.ts`

> **What:** One function per API endpoint. READ functions validate responses with Zod `.parse()`.
> **Rule:** No React, no state, no business logic. Just `apiClient.get/post` + `.parse()`.

```typescript
// ============================================================================
// Medical Masters — API Service Layer
// Each function maps to exactly one API endpoint.
// READ responses are validated with Zod .parse() at the boundary.
// No business logic here — just HTTP calls via the shared apiClient.
// ============================================================================

import apiClient from "@/features/common/API/apiClient";
import {
  GetMedicalMastersResponseSchema,
  GetCategoriesResponseSchema,
} from "./medicalMasters.dtos";
import type {
  GetMedicalMastersResponse,
  GetCategoriesResponse,
  CreateMedicalMasterRequest,
  CreateMedicalMasterResponse,
  UpdateMedicalMasterRequest,
  UpdateMedicalMasterResponse,
  DeleteMedicalMasterRequest,
} from "./medicalMasters.dtos";

// ── Server filter params ─────────────────────────────────────────────────────

export type GetMedicalMastersParams = {
  category?: string;
  isActive?: boolean;
};

// ── READ (validated with Zod) ───────────────────────────────────────────────

export const getMedicalMasters = async (
  params?: GetMedicalMastersParams,
): Promise<GetMedicalMastersResponse> => {
  const response = await apiClient.get("/api/Medical/GetMedicalConditions", { params });
  return GetMedicalMastersResponseSchema.parse(response.data);
};

export const getCategories = async (): Promise<GetCategoriesResponse> => {
  const response = await apiClient.get("/api/Medical/GetMedicalCategories");
  return GetCategoriesResponseSchema.parse(response.data);
};

// ── CREATE ──────────────────────────────────────────────────────────────────

export const createMedicalMaster = async (
  payload: CreateMedicalMasterRequest,
): Promise<CreateMedicalMasterResponse> => {
  const response = await apiClient.post<CreateMedicalMasterResponse>(
    "/api/Medical/CreateMedicalCondition",
    payload,
  );
  return response.data;
};

// ── UPDATE ──────────────────────────────────────────────────────────────────

export const updateMedicalMaster = async (
  payload: UpdateMedicalMasterRequest,
): Promise<UpdateMedicalMasterResponse> => {
  const response = await apiClient.post<UpdateMedicalMasterResponse>(
    "/api/Medical/UpdateMedicalCondition",
    payload,
  );
  return response.data;
};

// ── DELETE ───────────────────────────────────────────────────────────────────

export const deleteMedicalMaster = async (
  payload: DeleteMedicalMasterRequest,
): Promise<void> => {
  await apiClient.post("/api/Medical/DeleteMedicalCondition", payload);
};
```

### What to check
- [ ] Endpoints match your backend controller routes
- [ ] READ functions use `Schema.parse(response.data)` — not `response.data` directly
- [ ] Schema imports are **value imports** (not `type`) because `.parse()` runs at runtime
- [ ] Mutation functions still use `apiClient.post<T>()` — no Zod needed for outgoing payloads
- [ ] `GetMedicalMastersParams` matches the query string params your API accepts

---

## Step 3: Define Query Hooks — `Services/medicalMasters.queries.ts`

> **What:** React Query hooks — one per API operation.
> **Rule:** Mutations invalidate the list query on success. Show toasts for user feedback.

```typescript
// ============================================================================
// Medical Masters — React Query Hooks
// One hook per API operation. Mutations invalidate the list query on success.
// ============================================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

import {
  getMedicalMasters,
  getCategories,
  createMedicalMaster,
  updateMedicalMaster,
  deleteMedicalMaster,
  type GetMedicalMastersParams,
} from "./medicalMasters.services";
import type {
  GetMedicalMastersResponse,
  GetCategoriesResponse,
  CreateMedicalMasterRequest,
  CreateMedicalMasterResponse,
  UpdateMedicalMasterRequest,
  UpdateMedicalMasterResponse,
  DeleteMedicalMasterRequest,
} from "./medicalMasters.dtos";

// ── Query Keys (single source of truth) ─────────────────────────────────────

const QUERY_KEYS = {
  items: ["getMedicalConditions"] as const,
  categories: ["getMedicalCategories"] as const,
};

// ── READ ────────────────────────────────────────────────────────────────────

export const useGetMedicalMasters = (params?: GetMedicalMastersParams) =>
  useQuery<GetMedicalMastersResponse, AxiosError>({
    queryKey: [...QUERY_KEYS.items, params],
    queryFn: () => getMedicalMasters(params),
    enabled: !!params,  // won't fire until user clicks Search
  });

export const useGetCategories = () =>
  useQuery<GetCategoriesResponse, AxiosError>({
    queryKey: [...QUERY_KEYS.categories],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000, // categories rarely change
  });

// ── CREATE ──────────────────────────────────────────────────────────────────

export const useCreateMedicalMaster = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CreateMedicalMasterResponse,
    AxiosError,
    CreateMedicalMasterRequest
  >({
    mutationFn: createMedicalMaster,
    onSuccess: async () => {
      toast.success("Medical condition created.");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
    },
    onError: () => {
      toast.error("Unable to create medical condition. Please try again.");
    },
  });
};

// ── UPDATE ──────────────────────────────────────────────────────────────────

export const useUpdateMedicalMaster = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateMedicalMasterResponse,
    AxiosError,
    UpdateMedicalMasterRequest
  >({
    mutationFn: updateMedicalMaster,
    onSuccess: async () => {
      toast.success("Medical condition updated.");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
    },
    onError: () => {
      toast.error("Unable to update medical condition. Please try again.");
    },
  });
};

// ── DELETE ───────────────────────────────────────────────────────────────────

export const useDeleteMedicalMaster = (options?: {
  onDeleted?: () => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, DeleteMedicalMasterRequest>({
    mutationFn: deleteMedicalMaster,
    onSuccess: async () => {
      toast.success("Medical condition deleted.");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
      options?.onDeleted?.();
    },
    onError: () => {
      toast.error("Unable to delete medical condition. Please try again.");
    },
  });
};
```

### Key patterns
- `enabled: !!params` — "Search button" pattern. Query doesn't fire until user clicks Search.
- `QUERY_KEYS` — single source of truth. Never hardcode query key strings elsewhere.
- All mutations invalidate `QUERY_KEYS.items` — table auto-refreshes after any CUD operation.
- `useDeleteMedicalMaster` accepts `onDeleted` callback — lets the delete modal close itself after success.

### Reusing shared queries
If your module needs a **Year dropdown** (server filter), reuse `useGetYears()` from the v4 reference (`crud.queries.ts`). It calls `POST /api/masters/GetYearsRetrieve` and returns `YearList: YearData[]`. Don't duplicate this — import it directly or move it to a shared `common/queries` folder.

---

## Step 4: Define UI Types — `Services/medicalMasters.types.ts`

> **What:** UI-facing domain types. `EditContext` is a plain type. `FormValues` is inferred from a Zod schema.
> **Rule:** Validation rules live in the schema — not scattered across form fields.

```typescript
// ============================================================================
// Medical Masters — Domain Types
// Zod schema validates form values before submission. The type is inferred
// from the schema so there is a single source of truth.
// ============================================================================

import { z } from "zod";

/** Shape used to pre-populate the modal for create or edit. */
export type MedicalMasterEditContext = {
  mode: "create" | "update";
  medicalConditionId?: number;
  conditionName: string;
  conditionCode: string;
  categoryId: number;
  description: string;
  isActive: boolean;
  sortOrder: number;
};

/** Zod schema for form validation — single source of truth for rules. */
export const MedicalMasterFormSchema = z.object({
  conditionName: z
    .string({ required_error: "Condition name is required" })
    .min(1, "Condition name is required"),
  conditionCode: z
    .string({ required_error: "Code is required" })
    .min(1, "Code is required")
    .max(10, "Code must be 10 characters or less"),
  categoryId: z
    .string({ required_error: "Category is required" })
    .min(1, "Category is required"),
  description: z.string().default(""),
  isActive: z.boolean().default(true),
  sortOrder: z.number().min(0, "Must be 0 or greater").default(0),
});

/** Form values managed by react-hook-form inside the modal. */
export type MedicalMasterFormValues = z.infer<typeof MedicalMasterFormSchema>;
```

### Why separate from DTOs?
- `categoryId` is `number` in the DTO but `string` in form values — because Radix `<Select>` works with strings. Zod's `.min(1)` catches empty selection.
- `mode: "create" | "update"` discriminant exists only in the UI — the API doesn't know about it.
- **Validation rules live in the schema.** `conditionCode` has `.max(10)` — this is declared once, not in JSX.
- If the API changes field names, only the DTOs and mapper change — form schema stays the same.

### How it wires into the modal
```typescript
// In MedicalMasterModal.tsx:
import { zodResolver } from "@hookform/resolvers/zod";
import { MedicalMasterFormSchema } from "../Services/medicalMasters.types";

const methods = useForm<MedicalMasterFormValues>({
  resolver: zodResolver(MedicalMasterFormSchema),  // ← one line
  defaultValues: buildDefaults(editCtx),
});
// No `rules` prop needed on any Controller field — Zod handles everything.
```

---

## Step 5: Define Row Mapper — `helpers/mapMedicalMasterDtoToRow.ts`

> **What:** Pure function that transforms API DTO → table row. Co-locates the row type with its mapper.
> **Rule:** No React, no hooks, no side effects. Easy to unit test.

```typescript
// ============================================================================
// Pure mapper: API DTO → UI row
// No side effects. Easy to unit test.
// ============================================================================

import dayjs from "dayjs";
import type { MedicalMasterDto } from "../Services/medicalMasters.dtos";

/** A single row displayed in the table. */
export type MedicalMasterRow = {
  id: number;              // MedicalConditionId
  conditionName: string;
  conditionCode: string;
  category: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdDate: string;
  modifiedDate: string | null;
};

export const mapMedicalMasterDtoToRow = (
  dto: MedicalMasterDto,
): MedicalMasterRow => ({
  id: dto.MedicalConditionId,
  conditionName: dto.ConditionName,
  conditionCode: dto.ConditionCode,
  category: dto.Category,
  description: dto.Description ?? "",
  isActive: dto.IsActive,
  sortOrder: dto.SortOrder,
  createdDate: dayjs(dto.CreatedDate).format("DD/MM/YYYY"),
  modifiedDate: dto.ModifiedDate
    ? dayjs(dto.ModifiedDate).format("DD/MM/YYYY")
    : null,
});
```

### What to check
- [ ] Every field the table needs is in `MedicalMasterRow`
- [ ] PascalCase (DTO) → camelCase (Row) for every field
- [ ] Dates formatted here, not in column defs
- [ ] Nullable fields handled with `?? ""` or null guards

---

## Step 6: Define Edit Context Builder — `helpers/buildEditContext.ts`

> **What:** Pure function that builds the edit modal's default values from a DTO.
> **Rule:** No React. Testable with `expect(buildEditContext(mockDto)).toEqual(...)`.

```typescript
// ============================================================================
// Pure helper: builds a MedicalMasterEditContext from a DTO for the edit modal.
// No React, no side effects. Easy to unit test.
// ============================================================================

import type { MedicalMasterDto } from "../Services/medicalMasters.dtos";
import type { MedicalMasterEditContext } from "../Services/medicalMasters.types";

export const buildEditContext = (
  dto: MedicalMasterDto,
): MedicalMasterEditContext => ({
  mode: "update",
  medicalConditionId: dto.MedicalConditionId,
  conditionName: dto.ConditionName,
  conditionCode: dto.ConditionCode,
  categoryId: 0,             // list API may not return categoryId — fetch from detail endpoint
  description: dto.Description ?? "",
  isActive: dto.IsActive,
  sortOrder: dto.SortOrder,
});
```

### Note
If your list API returns `CategoryId`, map it directly instead of defaulting to `0`. The v4 reference has the same pattern — the list endpoint doesn't always return every field needed for edit.

---

## Step 7: Define Columns — `columns/medicalMasterColumns.tsx`

> **What:** All column definitions, default visibility, filterable columns, and row actions.
> **Rule:** To add/remove/reorder columns, edit this file only.

```tsx
// ============================================================================
// Medical Masters — Column Definitions
// To add/remove/reorder columns, edit this file only.
// ============================================================================

import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { EditIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/v1/button";
import { Checkbox } from "@/components/ui/v1/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/v1/dropdown-menu";
import { TableHeaderButton } from "@/components/layouts/v1/Table.layout";
import type { FilterableColumn } from "@/components/layouts/v1/TableFilterBuilder";

import type { MedicalMasterRow } from "../helpers/mapMedicalMasterDtoToRow";

// ── Filterable columns for TableFilterBuilder ───────────────────────────────

export const FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: "conditionName", label: "Condition Name", type: "string" },
  { id: "conditionCode", label: "Code", type: "string" },
  { id: "category", label: "Category", type: "string" },
];

// ── Default column visibility ───────────────────────────────────────────────

export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  sortOrder: false,
  createdDate: false,
  modifiedDate: false,
};

// ── Row actions ─────────────────────────────────────────────────────────────

export type ActionItem<T> = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: T) => void;
  variant?: "destructive";
};

export type ActionsConfig<T> = {
  quick: ActionItem<T>[];
  menu: (ActionItem<T> | "separator")[];
};

// ── Column factory ──────────────────────────────────────────────────────────

type ColumnConfig = {
  actions?: ActionsConfig<MedicalMasterRow>;
};

export const buildMedicalMasterColumns = (
  config: ColumnConfig = {},
): ColumnDef<MedicalMasterRow>[] => {
  const { actions } = config;

  return [
    // ── Select checkbox ─────────────────────────────────────────────────
    {
      id: "select",
      size: 1,
      enableSorting: false,
      enableGlobalFilter: false,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label={`Select ${row.original.conditionName}`}
        />
      ),
    },

    // ── Condition Name ──────────────────────────────────────────────────
    {
      accessorKey: "conditionName",
      size: 20,
      header: ({ column }) => (
        <TableHeaderButton column={column}>Condition Name</TableHeaderButton>
      ),
    },

    // ── Code ────────────────────────────────────────────────────────────
    {
      accessorKey: "conditionCode",
      size: 10,
      header: ({ column }) => (
        <TableHeaderButton column={column}>Code</TableHeaderButton>
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue<string>()}</span>
      ),
    },

    // ── Category ────────────────────────────────────────────────────────
    {
      accessorKey: "category",
      size: 12,
      header: ({ column }) => (
        <TableHeaderButton column={column}>Category</TableHeaderButton>
      ),
    },

    // ── Description ─────────────────────────────────────────────────────
    {
      accessorKey: "description",
      size: 20,
      enableSorting: false,
      header: "Description",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground line-clamp-1">
          {getValue<string>()}
        </span>
      ),
    },

    // ── Active ──────────────────────────────────────────────────────────
    {
      accessorKey: "isActive",
      size: 6,
      header: "Active",
      cell: ({ getValue }) => (
        <span>{getValue<boolean>() ? "Yes" : "No"}</span>
      ),
    },

    // ── Sort Order ──────────────────────────────────────────────────────
    {
      accessorKey: "sortOrder",
      size: 6,
      header: "Sort Order",
    },

    // ── Created Date ────────────────────────────────────────────────────
    {
      accessorKey: "createdDate",
      size: 8,
      header: "Created",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue<string>()}</span>
      ),
    },

    // ── Modified Date ───────────────────────────────────────────────────
    {
      accessorKey: "modifiedDate",
      size: 8,
      header: "Modified",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">
          {getValue<string | null>() ?? "—"}
        </span>
      ),
    },

    // ── Actions (conditional) ───────────────────────────────────────────
    ...(actions
      ? [
          {
            id: "actions",
            size: 1 + actions.quick.length,
            enableSorting: false,
            enableGlobalFilter: false,
            header: "",
            cell: ({ row }: { row: { original: MedicalMasterRow } }) => (
              <div className="flex items-center justify-end gap-1">
                {actions.quick.map((action) => (
                  <Button
                    key={action.label}
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => action.onClick(row.original)}
                    aria-label={action.label}
                  >
                    {action.icon && <action.icon className="h-4 w-4" />}
                  </Button>
                ))}
                {actions.menu.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="More actions">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {actions.menu.map((item, i) =>
                        item === "separator" ? (
                          <DropdownMenuSeparator key={`sep-${i}`} />
                        ) : (
                          <DropdownMenuItem
                            key={item.label}
                            onClick={() => item.onClick(row.original)}
                            variant={item.variant}
                          >
                            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                            {item.label}
                          </DropdownMenuItem>
                        ),
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ),
          } satisfies ColumnDef<MedicalMasterRow>,
        ]
      : []),
  ];
};
```

### What to check
- [ ] `FILTERABLE_COLUMNS` ids match `accessorKey` values
- [ ] `DEFAULT_COLUMN_VISIBILITY` hides columns that are less important
- [ ] `size` values are proportions (not pixels) — they'll be normalized to percentages
- [ ] Every interactive element has `aria-label`

---

## Step 8: Define Page Hook — `hooks/useMedicalMastersPage.ts`

> **What:** All state, handlers, and derived data. The page component only calls this hook.
> **Rule:** No JSX. No styling. Just state management.

```typescript
// ============================================================================
// Medical Masters — Page Hook
// All state, handlers, and derived data for the page live here.
// The page component only calls this hook and renders JSX.
// ============================================================================

import { useCallback, useMemo, useReducer, useState } from "react";

import {
  useGetMedicalMasters,
  useGetCategories,
} from "../Services/medicalMasters.queries";
import type { GetMedicalMastersParams } from "../Services/medicalMasters.services";
import { mapMedicalMasterDtoToRow } from "../helpers/mapMedicalMasterDtoToRow";
import { buildEditContext } from "../helpers/buildEditContext";
import type { MedicalMasterRow } from "../helpers/mapMedicalMasterDtoToRow";
import type { MedicalMasterEditContext } from "../Services/medicalMasters.types";
import type { MedicalMasterDto } from "../Services/medicalMasters.dtos";

// ── Reducer ─────────────────────────────────────────────────────────────────

type ModalState = {
  modalOpen: boolean;
  editCtx: MedicalMasterEditContext | null;
  deleteConfirmOpen: boolean;
};

type ModalAction =
  | { type: "OPEN_CREATE" }
  | { type: "OPEN_EDIT"; ctx: MedicalMasterEditContext }
  | { type: "CLOSE_MODAL" }
  | { type: "OPEN_DELETE_CONFIRM" }
  | { type: "CLOSE_DELETE_CONFIRM" };

const initialModalState: ModalState = {
  modalOpen: false,
  editCtx: null,
  deleteConfirmOpen: false,
};

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case "OPEN_CREATE":
      return {
        ...state,
        modalOpen: true,
        editCtx: {
          mode: "create",
          conditionName: "",
          conditionCode: "",
          categoryId: 0,
          description: "",
          isActive: true,       // default new conditions to active
          sortOrder: 0,
        },
      };

    case "OPEN_EDIT":
      return { ...state, modalOpen: true, editCtx: action.ctx };

    case "CLOSE_MODAL":
      return { ...state, modalOpen: false, editCtx: null };

    case "OPEN_DELETE_CONFIRM":
      return { ...state, deleteConfirmOpen: true };

    case "CLOSE_DELETE_CONFIRM":
      return { ...state, deleteConfirmOpen: false };

    default:
      return state;
  }
};

// ── Hook ────────────────────────────────────────────────────────────────────

export const useMedicalMastersPage = () => {
  const [modal, dispatch] = useReducer(modalReducer, initialModalState);

  // ── Server filter state ──────────────────────────────────────────────────
  const [serverParams, setServerParams] = useState<
    GetMedicalMastersParams | undefined
  >(undefined);

  // ── Data fetching ───────────────────────────────────────────────────────
  const {
    data: itemsResponse,
    isLoading,
    isFetching,
    isError,
  } = useGetMedicalMasters(serverParams);
  const { data: categoriesResponse } = useGetCategories();

  const items = useMemo<MedicalMasterDto[]>(
    () => itemsResponse?.MedicalConditions ?? [],
    [itemsResponse],
  );
  const rows = useMemo<MedicalMasterRow[]>(
    () => items.map(mapMedicalMasterDtoToRow),
    [items],
  );

  const categories = useMemo(
    () => categoriesResponse?.Categories ?? [],
    [categoriesResponse],
  );

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleServerSearch = useCallback(
    (params: GetMedicalMastersParams) => {
      setServerParams(params);
    },
    [],
  );

  const handleCreate = useCallback(() => {
    dispatch({ type: "OPEN_CREATE" });
  }, []);

  const handleEdit = useCallback(
    (itemId: number) => {
      const dto = items.find((i) => i.MedicalConditionId === itemId);
      if (!dto) return;
      dispatch({ type: "OPEN_EDIT", ctx: buildEditContext(dto) });
    },
    [items],
  );

  const handleCloseModal = useCallback(() => {
    dispatch({ type: "CLOSE_MODAL" });
  }, []);

  const handleOpenDeleteConfirm = useCallback(() => {
    dispatch({ type: "OPEN_DELETE_CONFIRM" });
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    dispatch({ type: "CLOSE_DELETE_CONFIRM" });
  }, []);

  // ── Return ──────────────────────────────────────────────────────────────

  return {
    // Data
    rows,
    categories,
    isLoading,
    isFetching,
    isError,
    serverParams,
    hasSearched: !!serverParams,

    // Modal state
    modalOpen: modal.modalOpen,
    editCtx: modal.editCtx,
    deleteConfirmOpen: modal.deleteConfirmOpen,

    // Handlers
    handleServerSearch,
    handleCreate,
    handleEdit,
    handleCloseModal,
    handleOpenDeleteConfirm,
    handleCloseDeleteConfirm,
  };
};
```

### What changed from v4 reference
- `OPEN_CREATE` defaults: `conditionName: ""`, `isActive: true`, etc. — match your domain defaults
- `handleEdit` finds by `MedicalConditionId` instead of `StudentNumber`
- `items` extracts from `MedicalConditions` instead of `StudentSummary`
- Everything else is the same pattern

---

## Step 9-13: Components

> These follow the exact same patterns as the v4 reference. The key changes are:

### Step 9: `MedicalMasterTable.tsx`
- Copy `ItemTable.tsx` from v4
- Replace `ItemRow` → `MedicalMasterRow`
- Replace `buildItemColumns` → `buildMedicalMasterColumns`
- Replace `GetItemsParams` → `GetMedicalMastersParams`
- Update server filter dropdown: Category instead of Year
- Update `yearOptions` prop → `categoryOptions` prop
- Update skeleton column count to match your visible columns

### Step 10: `MedicalMasterModal.tsx`
- Copy `ItemModal.tsx` from v4
- Replace `ItemEditContext` → `MedicalMasterEditContext`
- Replace `ItemFormValues` → `MedicalMasterFormValues`
- Replace `ItemFormSchema` → `MedicalMasterFormSchema`
- Replace `useCreateItem` → `useCreateMedicalMaster`
- Replace `useUpdateItem` → `useUpdateMedicalMaster`
- **Keep `zodResolver(MedicalMasterFormSchema)`** — same one-line wiring
- Update `buildDefaults()`: map `categoryId` number → string for `<Select>`, return `""` (not `null`) for empty strings
- Update `buildPayload()`: map `categoryId` string → number for API. No null guards needed — Zod guarantees values.
- Update dialog title: "Create Medical Condition" / "Edit Medical Condition"

### Step 11: `MedicalMasterForm.tsx`
- Copy `ItemForm.tsx` from v4
- Replace fields with: Condition Name (Input), Code (Input), Category (Select), Description (Textarea), Active (Checkbox), Sort Order (Input type="number")
- Remove date picker and teacher search — not needed for this module
- **Remove all `rules={{ required: "..." }}` props** — Zod handles validation via `MedicalMasterFormSchema`
- Add `aria-invalid={!!errors.fieldName}` and `aria-describedby` on interactive fields for WCAG
- Add inline error `<p>` below each field: `{errors.fieldName && <p id="fieldName-error">{errors.fieldName.message}</p>}`

### Step 12: `DeleteConfirmModal.tsx`
- Copy directly from v4 — **almost no changes needed**
- Replace `useDeleteItem` → `useDeleteMedicalMaster`
- Update `DeleteItemRequest` → `DeleteMedicalMasterRequest`
- Update the ID field: `{ medicalConditionId: id }` instead of `{ studentActivityId: id }`
- Update labels: "Medical Condition" instead of "Item"
- **Keep `Promise.allSettled`** — handles partial failure in multi-delete (shows "X deleted, Y failed" toast)
- **Keep `className="bg-destructive text-destructive-foreground hover:bg-destructive/90"`** on the confirm button — red styling signals danger

### Step 13: `StatusPlaceholder.tsx`
- **Copy directly from v4 — no changes needed.** This component is fully generic.

---

## Step 14: Define Page Orchestrator — `MedicalMasters.page.tsx`

> **What:** The orchestrator. Calls the hook, renders child components.
> **Rule:** No business logic. No state management beyond the delete bridge.

```tsx
// ============================================================================
// Medical Masters — Page Component
// This is the orchestrator. It calls the hook and renders child components.
// No business logic, no state management — just layout and wiring.
// ============================================================================

import { useCallback, useState } from "react";

import {
  PageContent,
  PageTitle,
  SingleColumnPage,
} from "@/components/layouts/v1/SingleColumnPage.layout";

import { useMedicalMastersPage } from "./hooks/useMedicalMastersPage";
import { StatusPlaceholder } from "./components/StatusPlaceholder";
import { MedicalMasterTable } from "./components/MedicalMasterTable";
import { MedicalMasterModal } from "./components/MedicalMasterModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";

const MedicalMastersPage = () => {
  const {
    rows,
    categories,
    isLoading,
    isFetching,
    isError,
    hasSearched,
    modalOpen,
    editCtx,
    deleteConfirmOpen,
    handleServerSearch,
    handleCreate,
    handleEdit,
    handleCloseModal,
    handleOpenDeleteConfirm,
    handleCloseDeleteConfirm,
  } = useMedicalMastersPage();

  // Track which IDs are pending deletion
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);

  const handleDeleteSelected = useCallback(
    (ids: number[]) => {
      setPendingDeleteIds(ids);
      handleOpenDeleteConfirm();
    },
    [handleOpenDeleteConfirm],
  );

  const handleDeleteCompleted = useCallback(() => {
    setPendingDeleteIds([]);
  }, []);

  return (
    <SingleColumnPage windowTitle="Medical Masters">
      <PageTitle>Medical Masters</PageTitle>

      <PageContent>
        {/* Error state */}
        {isError && (
          <StatusPlaceholder variant="error">
            Unable to load medical conditions. Please try again later.
          </StatusPlaceholder>
        )}

        {/* Table */}
        {!isError && (
          <MedicalMasterTable
            rows={rows}
            isLoading={isLoading}
            isFetching={isFetching}
            hasSearched={hasSearched}
            categoryOptions={categories.map((c) => c.CategoryName)}
            onServerSearch={handleServerSearch}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDeleteSelected={handleDeleteSelected}
          />
        )}

        {/* Create / Edit Modal */}
        {editCtx && (
          <MedicalMasterModal
            open={modalOpen}
            onClose={handleCloseModal}
            editCtx={editCtx}
            categories={categories}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          open={deleteConfirmOpen}
          onClose={handleCloseDeleteConfirm}
          selectedIds={pendingDeleteIds}
          onDeleted={handleDeleteCompleted}
        />
      </PageContent>
    </SingleColumnPage>
  );
};

export default MedicalMastersPage;
```

---

## Step 15: Register the Route

Add the page to your router configuration:

```tsx
// In your router config file
const MedicalMastersPage = lazy(
  () => import("@/features/medical-masters/MedicalMasters.page"),
);

// Add to routes array
{ path: "/medical-masters", element: <MedicalMastersPage /> }
```

---

## Checklist — Before You Ship

| # | Check | Status |
|---|---|---|
| 1 | DTOs use **Zod schemas** for responses; types inferred via `z.infer` | [ ] |
| 2 | Service READ functions use `Schema.parse(response.data)` | [ ] |
| 3 | Service endpoints match backend controller routes | [ ] |
| 4 | Query keys are unique (no collision with other features) | [ ] |
| 5 | `enabled: !!params` prevents auto-fetch on mount | [ ] |
| 6 | Mapper handles all nullable fields | [ ] |
| 7 | Form schema (`z.object`) defines all validation rules — no inline `rules` on `Controller` | [ ] |
| 8 | Modal uses `zodResolver(FormSchema)` in `useForm` | [ ] |
| 9 | `buildDefaults` returns non-nullable values (`""`, `0`) matching the Zod schema | [ ] |
| 10 | All form fields have `aria-invalid` + `aria-describedby` + inline error `<p>` | [ ] |
| 11 | Column `aria-label` on checkboxes and action buttons | [ ] |
| 12 | Form fields have `Label` with `htmlFor` | [ ] |
| 13 | Delete modal uses `AlertDialog` (not `Dialog`) with **destructive** button styling | [ ] |
| 14 | Delete uses `Promise.allSettled` with partial failure toast | [ ] |
| 15 | Toast messages are user-friendly | [ ] |
| 16 | No `dangerouslySetInnerHTML` anywhere | [ ] |
| 17 | No hardcoded dropdown options — fetch from server | [ ] |
| 18 | `ToastContainer` in `App.tsx` has `role="alert"` (global — already done) | [ ] |
| 19 | `as never` and `satisfies` casts have inline comments explaining why | [ ] |
| 20 | Route registered and lazy-loaded | [ ] |
| 21 | Page title set via `SingleColumnPage windowTitle` | [ ] |
| 22 | Build passes with no TypeScript errors | [ ] |

---

## Quick Reference — File Change Map

When something changes, you only need to touch specific files:

| Change | Files to edit |
|---|---|
| API contract changes | `medicalMasters.dtos.ts` only |
| New endpoint | `medicalMasters.services.ts` + `medicalMasters.queries.ts` |
| New table column | `medicalMasterColumns.tsx` + `mapMedicalMasterDtoToRow.ts` |
| New form field | `MedicalMasterForm.tsx` + `medicalMasters.types.ts` |
| New server filter | `medicalMasters.services.ts` (params) + `MedicalMasterTable.tsx` (dropdown) |
| Change page state | `useMedicalMastersPage.ts` only |
| Change button style | `components/ui/v1/button.tsx` (affects ALL buttons globally) |
| Change table layout | `components/layouts/v1/Table.layout.tsx` (affects ALL tables globally) |
