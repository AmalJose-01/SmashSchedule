# CRUD v4 — Detailed Line-by-Line Implementation Walkthrough

> **Scope:** Every file in `src/features/react-crud-v4/`.
> **Criteria:** Simplicity · Junior-friendliness · WCAG 2.1 · OWASP · Architecture/SoC.
> **Date:** 2026-02-16
> **Related:** See `AUDIT.md` for the change-by-change audit trail.

---

## 0. Getting Started — Where to Begin

### 0.1 Prerequisites

Before reading the code, make sure you understand:
- **React** (functional components, hooks: `useState`, `useEffect`, `useMemo`, `useCallback`, `useReducer`)
- **TypeScript** (interfaces, generics, discriminated unions, `as const`)
- **React Query** (TanStack Query v5 — `useQuery`, `useMutation`, query keys, cache invalidation)
- **react-hook-form** (`useForm`, `FormProvider`, `useFormContext`, `Controller`)
- **TanStack Table v8** (`useReactTable`, `ColumnDef`, row models, sorting/filtering/pagination)
- **Shadcn UI / Radix** (Dialog, AlertDialog, Select, Popover, Calendar — all keyboard-accessible primitives)
- **Zod** (schema declaration, `z.object`, `z.infer`, `.parse()`, `zodResolver` for RHF)
- **Tailwind CSS** (utility classes, `cn()` merge helper)

### 0.2 Recommended Reading Order

Read the files in this order — each builds on the previous:

```
Step 1: Understand the data shape
  → Services/crud.dtos.ts          "What does the API send/receive?"

Step 2: Understand the HTTP layer
  → Services/crud.services.ts      "How do we call the API?"

Step 3: Understand the caching layer
  → Services/crud.queries.ts       "How does React Query wrap those calls?"

Step 4: Understand the UI types
  → Services/crud.types.ts         "What types do the components use?"

Step 5: Understand the data transformation
  → helpers/mapItemDtoToRow.ts     "How does API data become table rows?"
  → helpers/buildEditContext.ts    "How does API data become edit form defaults?"

Step 6: Understand the table columns
  → columns/itemColumns.tsx        "What columns does the table show?"

Step 7: Understand the state management
  → hooks/useCrudPage.ts           "Where does all the state live?"

Step 8: Understand the components (inside-out)
  → components/StatusPlaceholder   "Simplest component — loading/error states"
  → components/ItemForm.tsx        "Form fields only — no submit logic"
  → components/ItemModal.tsx       "Dialog shell — wraps ItemForm, handles submit"
  → components/DeleteConfirmModal  "AlertDialog for destructive action"
  → components/ItemTable.tsx       "The main table — largest component"

Step 9: See how it all connects
  → Crud.page.tsx                  "The orchestrator — 101 lines"
```

### 0.3 The Mental Model

```
┌─────────────────────────────────────────────────────┐
│  Crud.page.tsx  (orchestrator — wires everything)   │
│                                                     │
│  ┌─ useCrudPage() ────────────────────────────────┐ │
│  │  state + handlers + data fetching              │ │
│  │  ┌─ useGetItems() ──┐  ┌─ useGetCategories() ┐│ │
│  │  │  React Query      │  │  React Query        ││ │
│  │  │  → getItems()     │  │  → getCategories()  ││ │
│  │  │    (HTTP)         │  │    (HTTP)           ││ │
│  │  └───────────────────┘  └─────────────────────┘│ │
│  │  mapItemDtoToRow() ← transforms API → UI rows  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ ItemTable ──────────────────────────────────┐   │
│  │  TanStack Table + TableLayout slots          │   │
│  │  Server filters → Client search → Filter     │   │
│  │  builder → Column sorting → Pagination       │   │
│  │  itemColumns.tsx ← column definitions        │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ ItemModal ──────┐  ┌─ DeleteConfirmModal ──┐   │
│  │  Dialog + RHF    │  │  AlertDialog          │   │
│  │  ┌─ ItemForm ──┐ │  │  useDeleteItem()      │   │
│  │  │  Fields     │ │  │  Promise.all          │   │
│  │  └─────────────┘ │  └──────────────────────┘   │
│  │  useCreateItem() │                              │
│  │  useUpdateItem() │                              │
│  └──────────────────┘                              │
└─────────────────────────────────────────────────────┘
```

### 0.4 Key Patterns to Recognize

| Pattern | Where | Why |
|---|---|---|
| **DTO → UI type mapper** | `mapItemDtoToRow.ts` | Decouples API shape from table shape. API changes don't ripple into components. |
| **Factory function for columns** | `buildItemColumns({ actions })` | Same column file works with or without row actions. |
| **`useReducer` for related state** | `useCrudPage.ts` | `modalOpen` + `editCtx` + `deleteConfirmOpen` always change together. Prevents impossible states. |
| **`enabled: !!params`** | `useGetItems()` | "Search button" pattern — query doesn't fire until user clicks Search. |
| **`FormProvider` + `useFormContext`** | `ItemModal` → `ItemForm` | Form instance lives in the modal, fields live in the form component. No prop drilling. |
| **`AlertDialog` for destructive actions** | `DeleteConfirmModal` | Correct WCAG semantic — traps focus, announces to screen readers. |
| **Slot-based layout** | `ItemTable` → `TableLayout` | Each slot (`TableServerFilters`, `TableSearch`, `TableContent`, etc.) is a named child. Layout handles positioning. |
| **Skeleton loading** | `TableSkeletonRows` | Replaces table content during fetch. Same row height as real data. No layout shift. |
| **`QUERY_KEYS` const object** | `crud.queries.ts` | Single source of truth for cache keys. Prevents typos, enables find-all-references. |
| **Pure helper functions** | `buildDefaults()`, `buildPayload()` | Defined outside components — testable without React, no hooks needed. |

### 0.5 How to Copy This for a New Feature

1. **Duplicate the folder** — copy `react-crud-v4/` to `src/features/your-feature/`
2. **Start with DTOs** — update `crud.dtos.ts` to match your backend API contracts
3. **Update services** — change endpoints in `crud.services.ts`
4. **Update queries** — rename query keys in `crud.queries.ts`
5. **Update types** — adjust `ItemEditContext` and `ItemFormValues` in `crud.types.ts`
6. **Update mapper** — change `ItemRow` type and `mapItemDtoToRow()` in `helpers/`
7. **Update columns** — edit `itemColumns.tsx` for your table columns
8. **Update form fields** — edit `ItemForm.tsx` for your form fields
9. **Update page** — rename and adjust `Crud.page.tsx`
10. **Register route** — add the page to your router config

> **Rule of thumb:** Steps 1-6 are data changes (no UI). Steps 7-9 are UI changes. Step 10 is wiring. Each step is independent and testable.

---

## 1. File Map

```
react-crud-v4/
├── Services/
│   ├── crud.dtos.ts          (116 lines)  API shapes — 1:1 with backend
│   ├── crud.services.ts       (58 lines)  HTTP calls only
│   ├── crud.queries.ts       (104 lines)  React Query hooks
│   └── crud.types.ts          (30 lines)  UI-facing domain types
├── helpers/
│   ├── mapItemDtoToRow.ts     (77 lines)  DTO → table row mapper
│   └── buildEditContext.ts    (24 lines)  DTO → edit modal context
├── columns/
│   └── itemColumns.tsx       (342 lines)  Column defs + actions + visibility
├── hooks/
│   └── useCrudPage.ts        (150 lines)  All page state + handlers
├── components/
│   ├── ItemTable.tsx         (309 lines)  Table rendering + skeleton
│   ├── ItemModal.tsx         (156 lines)  Create/Edit dialog
│   ├── ItemForm.tsx          (195 lines)  Form fields
│   ├── DeleteConfirmModal.tsx (91 lines)  Delete confirmation
│   └── StatusPlaceholder.tsx  (25 lines)  Empty/error/loading placeholder
└── Crud.page.tsx             (101 lines)  Page orchestrator
```

**Total: 1,778 lines across 12 files.**

---

## 2. Services Layer

### 2.1 `crud.dtos.ts` (128 lines)

**Purpose:** Zod schemas that mirror the backend API contracts. Types are inferred from schemas via `z.infer` — single source of truth, no type/schema drift.

| Lines | What it does | Notes |
|---|---|---|
| 1-11 | Header comment | States the rule: "Keep these 1:1 with the backend." Now also explains Zod: "Types are inferred from schemas so there is a single source of truth." |
| 13 | `import { z } from "zod"` | Single import — Zod is the only dependency. |
| 17-45 | `ItemDtoSchema` | `z.object()` with 28 fields matching the C# `StudentSummary` model. `z.union([z.literal(1), ...])` for `StatusId` fields constrains values at runtime. `z.string().nullable()` for nullable fields. |
| 47-49 | `GetItemsResponseSchema` | Wraps `StudentSummary: z.array(ItemDtoSchema)`. |
| 51-52 | `GetItemsResponse`, `ItemDto` | `z.infer<typeof ...>` — types derived from schemas, never hand-written. |
| 56-74 | Category schemas | `CategoryDtoSchema`, `CategoryGroupDtoSchema`, `GetCategoriesResponseSchema`. Same pattern. |
| 76-78 | Category types | Inferred from schemas. |
| 80+ | Request/Response types | `CreateItemRequest`, `UpdateItemRequest`, `DeleteItemRequest` remain plain types — outgoing payloads don't need runtime validation. |

**Key design decisions:**
- **Schemas for responses, plain types for requests.** API responses are untrusted (need runtime validation). Request payloads are built by our own code (TypeScript is sufficient).
- **`z.infer` eliminates duplication.** Change the schema → the type updates automatically.
- **Union literals** (`z.literal(1), z.literal(2)...`) enforce the exact same constraint as the old `1 | 2 | 3 | 4` union type, but at runtime.

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 9/10 | Zod adds one import and schema declarations mirror the old types closely. Slight learning curve for `z.infer`. |
| Junior-friendly | 9/10 | Schema reads like a type definition. `z.string()`, `z.number()`, `z.nullable()` are self-explanatory. |
| WCAG | N/A | No UI |
| OWASP | 10/10 | Runtime validation at API boundary catches contract breaks before they reach components. |
| Architecture | 10/10 | Single responsibility — API contract + validation. Types inferred, no duplication. |

---

### 2.2 `crud.services.ts` (61 lines)

**Purpose:** One function per API endpoint. READ functions validate responses with Zod `.parse()`. Mutations send typed payloads without response validation.

| Lines | What it does | Notes |
|---|---|---|
| 1-8 | Header comment | "Each function maps to exactly one API endpoint." |
| 10-14 | Schema imports | `GetItemsResponseSchema`, `GetCategoriesResponseSchema` — value imports (not `type`) because `.parse()` runs at runtime. |
| 15-23 | Type imports | DTO types for request/response typing. |
| 27-29 | `GetItemsParams` | Server filter type: `{ year?: string }`. Exported so the hook and page can reference it. |
| 33-36 | `getItems()` | `GET /api/NZAMP/GetStudentsAttendanceSummary`. Returns `GetItemsResponseSchema.parse(response.data)` — validates shape at runtime. If backend returns unexpected data, Zod throws a `ZodError` before it reaches components. |
| 38-41 | `getCategories()` | `GET /api/NZAMP/GetResponseActivities`. Same `.parse()` pattern. |
| 45-48 | `createItem()` | `POST /api/NZAMP/RecordStudentActivity`. No response validation — we trust our own payload. |
| 52-55 | `updateItem()` | `POST /api/NZAMP/UpdateStudentActivity`. Same pattern. |
| 59-61 | `deleteItem()` | `POST /api/NZAMP/DeleteStudentActivity`. Returns `void`. |

**Key design decisions:**
- **`.parse()` on READ responses only.** Responses are untrusted external data. Request payloads are built by our code.
- All endpoints use `POST` for mutations (not `PUT`/`DELETE`) — this matches the existing C# backend convention.
- `apiClient` handles auth headers, base URL, and interceptors centrally.
- If Zod validation fails, the error propagates to React Query's `onError` → toast shows "Unable to load items."

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 10/10 | 5 functions, each 3-4 lines. `.parse()` is one extra method call. |
| Junior-friendly | 10/10 | Copy-paste friendly. `.parse()` is self-explanatory: "parse this data against the schema." |
| WCAG | N/A | No UI |
| OWASP | 10/10 | Runtime validation at API boundary. Centralized auth via `apiClient`. No user input in URLs. |
| Architecture | 10/10 | Pure service layer — validation is at the boundary, not scattered across components. |

---

### 2.3 `crud.queries.ts` (104 lines)

**Purpose:** React Query hooks — one per API operation. Mutations invalidate the list query on success and show toasts.

| Lines | What it does | Notes |
|---|---|---|
| 1-6 | Header comment | "One hook per API operation." |
| 8-28 | Imports | React Query (`useMutation`, `useQuery`, `useQueryClient`), `AxiosError`, `toast`, all service functions, all DTO types. |
| 30-35 | `QUERY_KEYS` | Single source of truth for cache keys. `as const` makes them readonly tuples. Using descriptive endpoint names so React Query DevTools shows meaningful labels. |
| 37-44 | `useGetItems()` | `useQuery` with `enabled: !!params` — query won't fire until the user clicks Search. The `queryKey` includes `params` so changing the year creates a new cache entry. |
| 46-51 | `useGetCategories()` | Always enabled. `staleTime: 5 * 60 * 1000` (5 minutes) — categories rarely change. |
| 53-68 | `useCreateItem()` | `useMutation` with `onSuccess`: shows toast, invalidates items list. `onError`: shows error toast. |
| 70-85 | `useUpdateItem()` | Same pattern as create. Different toast message. |
| 87-103 | `useDeleteItem()` | Accepts optional `{ onDeleted }` callback. After success: toast, invalidate, call `onDeleted()`. |

**Key design decisions:**
- `QUERY_KEYS` as a const object prevents typos and enables find-all-references.
- `enabled: !!params` is the "Search button" pattern — data only loads when the user explicitly requests it.
- All mutations invalidate `QUERY_KEYS.items` — the table auto-refreshes after any CUD operation.
- Error handling is user-facing (toasts), not console-only.

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 10/10 | Each hook is 8-15 lines, identical structure |
| Junior-friendly | 10/10 | Pattern is copy-paste; adding a new mutation is obvious; `QUERY_KEYS` prevents cache key bugs |
| WCAG | 8/10 | Toast messages are text-only (screen reader friendly); however, `react-toastify` needs `role="alert"` configuration for full WCAG compliance |
| OWASP | 9/10 | No sensitive data in cache keys; errors don't leak server details; auth handled by `apiClient` |
| Architecture | 10/10 | Pure data layer — no UI, no component logic; hooks are composable |

---

### 2.4 `crud.types.ts` (44 lines)

**Purpose:** UI-facing domain types. `ItemEditContext` is a plain type. `ItemFormValues` is inferred from a Zod schema (`ItemFormSchema`) so validation rules and type are a single source of truth.

| Lines | What it does | Notes |
|---|---|---|
| 1-9 | Header comment | "Zod schema validates form values before submission. The type is inferred from the schema." |
| 11 | `import { z } from "zod"` | Zod for form schema. |
| 13-25 | `ItemEditContext` | Plain type — shape used to pre-populate the modal. `mode: "create" \| "update"` discriminant. Not validated by Zod (it's built by our own code). |
| 28-40 | `ItemFormSchema` | `z.object()` with 5 fields. `activityId: z.string().min(1)` — required + non-empty. `completedDate: z.date().refine(d => d <= new Date())` — required + no future dates. `completedBy: z.number().min(1)` — required + non-zero. `notes` and `restrictedNotes` have `.default()` values. |
| 43 | `ItemFormValues` | `z.infer<typeof ItemFormSchema>` — type derived from schema. No hand-written type to drift. |

**Key design decisions:**
- **Zod schema for form, plain type for edit context.** The form schema is validated by `zodResolver` at submit time. The edit context is built by `buildEditContext()` (our code) — no untrusted boundary.
- **Validation rules live in the schema, not in JSX.** No more `rules={{ required: "..." }}` on each `Controller`. One schema, one place to update.
- **`.refine()` for custom rules.** Future date check is declarative, not imperative.

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 9/10 | Zod schema is ~12 lines. Slight learning curve for `.refine()`. |
| Junior-friendly | 9/10 | `z.string().min(1, "Activity is required")` reads like English. Error messages are co-located with rules. |
| WCAG | N/A | No UI |
| OWASP | 10/10 | Form values validated at submit time. `mode` discriminant prevents create-as-update. |
| Architecture | 10/10 | Clean separation: DTO schemas ≠ EditContext ≠ FormSchema. Single source of truth for validation. |

---

## 3. Helpers Layer

### 3.1 `mapItemDtoToRow.ts` (77 lines)

**Purpose:** Pure mapper function that converts a backend `ItemDto` (PascalCase) to a frontend `ItemRow` (camelCase) for the table. Co-locates the `ItemRow` type with its mapper — things that change together live together.

| Lines | What it does | Notes |
|---|---|---|
| 1-6 | Header comment | "Pure mapper: API DTO → UI row. No side effects. Easy to unit test." |
| 8-9 | Imports | `dayjs` for date formatting, `ItemDto` from DTOs. |
| 11-41 | `ItemRow` type | 26 fields in camelCase. `id: number` maps from `StudentNumber`. Date fields are `string \| null` (pre-formatted). Status fields include both the name and color hex for `ContrastBadge`. |
| 43-76 | `mapItemDtoToRow()` | One-liner arrow function returning an object literal. Each field is a direct mapping from PascalCase → camelCase. Date fields use `dayjs().format("DD/MM/YYYY")` with null guards. |

**Key design decisions:**
- `ItemRow` is co-located with the mapper, not in `crud.types.ts`. Rationale: if the table shape changes, both the type and mapper change together.
- Date formatting happens here (not in the column renderer) — keeps column defs simple and testable.
- The mapper is a pure function: `(ItemDto) => ItemRow`. No React, no hooks, no side effects.

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 10/10 | Single pure function, no branching logic |
| Junior-friendly | 10/10 | Obvious field-by-field mapping; easy to add a new field |
| WCAG | N/A | No UI |
| OWASP | 10/10 | No user input; pure transformation; no injection vectors |
| Architecture | 10/10 | Co-location principle; pure function; single responsibility |

---

### 3.2 `buildEditContext.ts` (24 lines)

**Purpose:** Pure helper that builds an `ItemEditContext` from an `ItemDto` for the edit modal.

| Lines | What it does | Notes |
|---|---|---|
| 1-8 | Header comment | Explains the simplification: "For a full edit, the individual page would fetch detailed activity data." |
| 10-11 | Imports | `ItemDto`, `ItemEditContext`. |
| 13-23 | `buildEditContext()` | Returns `ItemEditContext` with `mode: "update"`. `completedBy: 0` and `notes: ""` are defaults because the list API doesn't return these fields. |

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 10/10 | 1 function, 10 lines of logic |
| Junior-friendly | 10/10 | Header comment explains the limitation; mapping is obvious |
| WCAG | N/A | No UI |
| OWASP | 9/10 | Safe defaults for missing fields; no user input |
| Architecture | 10/10 | Pure function; separated from hook; testable |

---

## 4. Columns Layer

### 4.1 `itemColumns.tsx` (342 lines)

**Purpose:** All table column definitions, default visibility, filterable column config, and declarative row actions. To add/remove/reorder columns, edit this file only.

| Lines | What it does | Notes |
|---|---|---|
| 1-5 | Header comment | "To add/remove/reorder columns, edit this file only." Single-file promise for juniors. |
| 7-22 | Imports | TanStack `ColumnDef`, `VisibilityState`, Lucide icons, shared UI components, `TableHeaderButton`, `FilterableColumn`. |
| 24 | `MAX_NAME_CHARS = 40` | Constant for name truncation. Avoids magic numbers. |
| 26-47 | `ActionItem<T>`, `ActionsConfig<T>` | Generic types for declarative row actions. `quick` = icon buttons. `menu` = dropdown items (supports `"separator"`). |
| 49-60 | `FILTERABLE_COLUMNS` | Array of `FilterableColumn` objects for `TableFilterBuilder`. 6 filterable columns defined. |
| 62-74 | `DEFAULT_COLUMN_VISIBILITY` | 7 columns hidden by default. |
| 76-125 | `renderActionsCell()` | Generic function rendering quick action buttons and/or dropdown menu from `ActionsConfig`. |
| 127-131 | `ColumnConfig` type | Optional actions config — if omitted, no actions column. |
| 133-341 | `buildItemColumns()` | Factory function returning 24 `ColumnDef<ItemRow>[]`. |

**Column breakdown:**

| Column | Key | Size | Features |
|---|---|---|---|
| Select | `select` | 1 | Checkbox header + row checkbox |
| Name | `name` | 14 | Sortable, truncates at 40 chars with Tooltip |
| Year | `year` | 4 | Sortable, custom exact-match filterFn |
| Home Class–Deputy | various | 5-8 | Hidden by default |
| ID | `id` | 5 | Student number, sortable |
| NSN | `nsn` | 6 | National Student Number |
| Previous/Current Term | status | 8 | `ContrastBadge` with dynamic background color |
| T1-T4, YTD | absence | 2 | Term absence counts |
| Last Activity/Response | activity | 7-14 | Date and activity name |
| Actions | `actions` | dynamic | Conditionally included via spread |

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 9/10 | 342 lines but all declarative config — no logic beyond the actions renderer |
| Junior-friendly | 9/10 | Adding a column is copy-paste. `satisfies` cast and `as never` could use inline comments. |
| WCAG | 9/10 | `aria-label` on all checkboxes and action buttons. `Tooltip` for truncated names. |
| OWASP | 9/10 | No `dangerouslySetInnerHTML`. Status colors used as CSS values only. |
| Architecture | 10/10 | Single file for all column concerns. Factory pattern keeps it reusable. |

---

## 5. Hook Layer

### 5.1 `useCrudPage.ts` (150 lines)

**Purpose:** All state, handlers, and derived data for the page. The page component only calls this hook and renders JSX.

| Lines | What it does | Notes |
|---|---|---|
| 1-5 | Header comment | "All state, handlers, and derived data for the page live here." |
| 7-15 | Imports | React hooks, query hooks, service types, mappers, domain types. |
| 17-23 | `ModalState` type | `modalOpen`, `editCtx`, `deleteConfirmOpen` grouped together. |
| 25-30 | `ModalAction` union | 5 action types: `OPEN_CREATE`, `OPEN_EDIT`, `CLOSE_MODAL`, `OPEN_DELETE_CONFIRM`, `CLOSE_DELETE_CONFIRM`. |
| 32-71 | `modalReducer` | Standard switch on `action.type`. Makes state transitions explicit and testable. |
| 75-83 | Hook declaration + data fetching | `useReducer` for modal, `useState` for serverParams, `useGetItems`/`useGetCategories` for data. |
| 85-91 | Derived data | `useMemo` wraps `items.map(mapItemDtoToRow)` and categories extraction. |
| 93-122 | Handlers | `handleServerSearch`, `handleCreate`, `handleEdit`, `handleCloseModal`, `handleOpenDeleteConfirm`, `handleCloseDeleteConfirm`. All `useCallback`. |
| 124-149 | Return object | Flat object with Data, Modal state, and Handlers sections. |

**Why `useReducer` instead of multiple `useState`?**
- `modalOpen`, `editCtx`, and `deleteConfirmOpen` are related — opening the create modal requires setting both in a single state update.
- The reducer makes state transitions explicit and testable outside React.

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 9/10 | 150 lines for all page state is compact. `useReducer` adds learning curve but pays off in correctness. |
| Junior-friendly | 9/10 | Reducer pattern is well-known; action types are self-documenting. |
| WCAG | N/A | No UI — pure state management |
| OWASP | 9/10 | No sensitive data stored in state; `handleEdit` validates DTO exists before dispatching |
| Architecture | 10/10 | Perfect SoC — all state in one hook, page is a pure renderer |

---

## 6. Components Layer

### 6.1 `ItemTable.tsx` (309 lines)

**Purpose:** Table rendering — server filters, client search, filter builder, column sorting, pagination, multi-select, skeleton loading. Uses TanStack Table + shared `TableLayout` slot components.

| Lines | What it does | Notes |
|---|---|---|
| 1-17 | Imports | React, TanStack Table, Lucide icons. |
| 18-38 | UI + layout imports | `Button`, `Skeleton`, `Select`, `Table` parts, `TableLayout` slots, `TableFilterBuilder`. Feature imports. |
| 40-42 | `PAGE_SIZE = 10` | Constant for pagination. |
| 44-56 | `ItemTableProps` | 9 props: `rows`, `isLoading`, `isFetching`, `hasSearched`, `yearOptions`, `onServerSearch`, `onCreate`, `onEdit`, `onDeleteSelected`. |
| 58-90 | `TableSkeletonRows` | Standalone component. 10 rows x 8 cells of animated `Skeleton` bars. `h-3 rounded-sm` keeps bars thin so row height matches real data. |
| 92-109 | Local state | `sorting`, `searchValue`, `columnFilters`, `rowSelection`, `selectedYear`. |
| 111-130 | Actions config + columns | `useMemo` builds `ActionsConfig` with quick (Edit) and menu (Edit + Delete). `buildItemColumns({ actions })` memoized. |
| 132-160 | `useReactTable` | All 4 row models, custom `filterFns.filterBuilder`, `enableRowSelection`, `getRowId`, initial page size + column visibility. |
| 162-195 | Derived state | `selectedIds`, `selectedCount`, column width normalization, pagination helpers, `showSkeleton`. |
| 197-257 | Render slots | Server filters (Year dropdown + Search), client search, filter builder, primary buttons (Delete + Create). |
| 259-296 | Table content | 4-way conditional: skeleton → "Select filters..." → "No items found" → full table with `table-fixed` layout. |
| 298-306 | Pagination | `TablePaginationMobileFriendly` when `pageCount > 1`. |

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 8/10 | 309 lines is the largest component. TanStack Table config is dense but standard. |
| Junior-friendly | 8/10 | Slot pattern requires understanding `TableLayout`. `as never` cast needs explanation. |
| WCAG | 9/10 | `aria-label` on search, year select, table. Skeleton has `aria-label="Loading items"`. |
| OWASP | 9/10 | No `dangerouslySetInnerHTML`. All user input through controlled components. |
| Architecture | 10/10 | Pure rendering — no data fetching, no mutations. Slot pattern keeps layout separate. |

---

### 6.2 `ItemModal.tsx` (161 lines)

**Purpose:** Create/Edit dialog. Wraps `ItemForm` in a `Dialog` with `react-hook-form`'s `FormProvider`. Uses `zodResolver(ItemFormSchema)` for form validation.

| Lines | What it does | Notes |
|---|---|---|
| 1-9 | Imports | React, RHF, `zodResolver` from `@hookform/resolvers/zod`. |
| 11-19 | UI imports | Dialog components from Shadcn. |
| 21-26 | Feature imports | `ItemForm`, mutation hooks, DTO types, `ItemFormSchema` + types. |
| 28-34 | `ItemModalProps` | `open`, `onClose`, `editCtx`, `categories`, `categoriesLoading?`. |
| 38-44 | `buildDefaults()` | EditContext → FormValues. Now returns non-nullable values (`""` and `0` instead of `null`) matching the Zod schema. |
| 48-55 | `buildPayload()` | FormValues → mutation payload. Simplified — no null coalescing needed since Zod guarantees non-null. |
| 74-77 | `useForm` | `resolver: zodResolver(ItemFormSchema)` — Zod validates all fields on submit. No inline `rules` needed on `Controller` fields. |
| 90-114 | `onSubmit` | Only called if Zod validation passes. Builds payload, branches on `isEdit`. |
| 118-160 | Render | Dialog with focus trap, `FormProvider`, `ItemForm`, footer with Cancel + Submit. |

**Key design decisions:**
- **`zodResolver(ItemFormSchema)`** — single line wires Zod into RHF. All validation rules live in `crud.types.ts`, not scattered across form fields.
- **`buildDefaults` returns non-nullable values** — `""` for strings, `0` for numbers. Zod's `.min(1)` catches these as "required" errors on submit.
- **`buildPayload` is simpler** — no `?? new Date()` or `?? ""` fallbacks needed since Zod guarantees the values are valid.

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 9/10 | 161 lines. `zodResolver` is one line. `buildPayload` is cleaner without null guards. |
| Junior-friendly | 9/10 | `resolver: zodResolver(schema)` is a well-documented RHF pattern. |
| WCAG | 10/10 | Focus trap, focus restoration (`triggerRef`), `DialogTitle` + `DialogDescription`, disabled buttons during submit. |
| OWASP | 10/10 | Zod validates all form values before `onSubmit` fires. No `dangerouslySetInnerHTML`. |
| Architecture | 10/10 | Modal is a pure UI shell — validation in schema, fields in `ItemForm`, mutations in query hooks. |

---

### 6.3 `ItemForm.tsx` (201 lines)

**Purpose:** Renders form fields for create/edit. Used inside `ItemModal` via `FormProvider`. No submission logic, no validation rules — just fields, error display, and WCAG attributes.

| Lines | What it does | Notes |
|---|---|---|
| 1-24 | Imports | React, RHF `Controller`/`useFormContext`, dayjs, UI components, feature types. |
| 26-52 | Component setup | Props with defaults, `dateSelectorOpen` state, `loggedInUserCode` from localStorage (sanitized), form context. |
| 54-96 | Activity field | `Controller` wrapping `Select` — **no inline `rules`** (Zod handles validation). `SelectTrigger` has `aria-invalid` and `aria-describedby` for WCAG. Inline error `<p>` below the field shows Zod's error message. |
| 98-141 | Completed By + Date | `TeacherSearch` autocomplete + `Popover` with `Calendar`. `normalizeToLocalNoon()` prevents timezone issues. `onChange` returns `0` (not `null`) when deselected — Zod's `.min(1)` catches it. |
| 143-188 | Notes + Restrict Notes | `Textarea` + conditional `Checkbox` (visible when notes non-empty). |
| 190-198 | Validation error summary | `Alert variant="destructive"` — only visible after first submit attempt. |

**Key design decisions:**
- **No `rules` prop on any `Controller`.** All validation lives in `ItemFormSchema` (Zod). Fields are pure rendering.
- **`aria-invalid` + `aria-describedby`** on the Activity `SelectTrigger` — screen readers announce "invalid entry" and read the error message.
- **Inline error messages** (`<p id="activityId-error">`) below fields — visible and linked via `aria-describedby`.

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 9/10 | 201 lines for 4 fields + validation summary. Each field is self-contained. Cleaner without inline `rules`. |
| Junior-friendly | 9/10 | `Controller` without `rules` is simpler. Error display pattern is consistent. |
| WCAG | 9/10 | `aria-invalid`, `aria-describedby`, `htmlFor` labels, keyboard-accessible calendar. Remaining gap: `completedBy` and `completedDate` fields could also get `aria-invalid`. |
| OWASP | 10/10 | `loggedInUserCode` sanitized. No `dangerouslySetInnerHTML`. Future dates blocked by Zod `.refine()`. |
| Architecture | 10/10 | Pure form rendering — no submission logic, no mutations, no validation rules, no data fetching. |

---

### 6.4 `DeleteConfirmModal.tsx` (91 lines)

**Purpose:** Confirms multi-select delete. Shows count of selected items. Executes delete via mutation hook.

| Lines | What it does | Notes |
|---|---|---|
| 1-23 | Imports | React, toast, `AlertDialog` components (8 parts), `useDeleteItem`. |
| 25-48 | Component setup | `isDeleting` local state, `deleteMutation`, derived `count`/`label`. |
| 50-63 | `handleConfirm` | `Promise.all` to delete all selected IDs in parallel. Error toast on catch. |
| 65-89 | Render | `AlertDialog` with title, description, Cancel + Confirm buttons (disabled during delete). |

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 9/10 | 91 lines. Clear flow: confirm → delete → close. |
| Junior-friendly | 9/10 | Easy to read top-to-bottom. `Promise.all` pattern is straightforward. |
| WCAG | 9/10 | `AlertDialog` with focus trap. **Gap:** Confirm button missing `variant="destructive"`. |
| OWASP | 8/10 | Deletes through mutation hook. **Gap:** `Promise.all` partial failure not handled granularly. |
| Architecture | 10/10 | Pure presentation + orchestration. Parent controls open state and selected IDs. |

---

### 6.5 `StatusPlaceholder.tsx` (25 lines)

**Purpose:** Reusable placeholder for empty, loading, and error states. Includes `aria-live` for screen reader announcements.

| Lines | What it does | Notes |
|---|---|---|
| 1-6 | Imports | `cn` utility. |
| 8-11 | `StatusPlaceholderProps` | `children`, `variant?: "muted" \| "error"`. |
| 13-24 | Component | Single `div` with `role="status"` and `aria-live="polite"`. Variant switches styling. |

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 10/10 | 25 lines. Single `div` with conditional styling. |
| Junior-friendly | 10/10 | Self-explanatory. `variant` prop is obvious. |
| WCAG | 10/10 | `role="status"`, `aria-live="polite"`, color contrast via design tokens. |
| OWASP | 10/10 | No user input rendered. Pure children pass-through. |
| Architecture | 10/10 | Reusable, stateless, no dependencies beyond `cn`. |

---

## 7. Page Orchestrator

### 7.1 `Crud.page.tsx` (101 lines)

**Purpose:** The orchestrator. Calls the hook and renders child components. No business logic, no state management — just layout and wiring.

| Lines | What it does | Notes |
|---|---|---|
| 1-15 | Imports | React, layout components, `useCrudPage`, all child components. |
| 17-34 | Hook call | `useCrudPage()` — destructures all return values. |
| 36-49 | Delete bridge | `pendingDeleteIds` state + `handleDeleteSelected`/`handleDeleteCompleted` callbacks. Bridges table selection → delete modal. |
| 51-97 | Render | `SingleColumnPage` → `PageTitle` → `PageContent` with conditional children: |

**Render breakdown:**

| What renders | Condition |
|---|---|
| `StatusPlaceholder variant="error"` | `isError` |
| `ItemTable` | `!isError` — passes all data + callbacks |
| `ItemModal` | `editCtx` is truthy |
| `DeleteConfirmModal` | Always rendered (controlled by `open` prop) |

**Key design decisions:**
- **101 lines** — intentionally thin. A junior can understand the entire page in 2 minutes.
- `pendingDeleteIds` lives here (not in the hook) because it bridges two components that don't know about each other.
- `{editCtx && <ItemModal />}` — conditional rendering prevents null context errors.
- `yearOptions` is hardcoded — identified as a gap in AUDIT.md.

**Scores:**

| Criteria | Score | Reasoning |
|---|---|---|
| Simplicity | 10/10 | 101 lines. Hook call → render. No logic beyond the delete bridge. |
| Junior-friendly | 10/10 | Read top-to-bottom: hook → error → table → modal → delete modal. |
| WCAG | 9/10 | `SingleColumnPage` sets `<title>`. Error state uses `aria-live`. Modals accessible via Radix. |
| OWASP | 8/10 | **Gap:** `yearOptions` hardcoded. Otherwise clean. |
| Architecture | 10/10 | Perfect orchestrator pattern. Zero business logic. |

---

## 8. Overall Summary

### Per-file scores

| File | Lines | Simplicity | Jr-friendly | WCAG | OWASP | Architecture |
|---|---|---|---|---|---|---|
| `crud.dtos.ts` | 145 | 9 | 9 | N/A | 10 | 10 |
| `crud.services.ts` | 69 | 10 | 10 | N/A | 10 | 10 |
| `crud.queries.ts` | 116 | 10 | 10 | 10 | 10 | 10 |
| `crud.types.ts` | 44 | 9 | 9 | N/A | 10 | 10 |
| `mapItemDtoToRow.ts` | 77 | 10 | 10 | N/A | 10 | 10 |
| `buildEditContext.ts` | 24 | 10 | 10 | N/A | 9 | 10 |
| `itemColumns.tsx` | 345 | 9 | 10 | 9 | 9 | 10 |
| `useCrudPage.ts` | 155 | 9 | 9 | N/A | 10 | 10 |
| `ItemTable.tsx` | 312 | 8 | 9 | 9 | 9 | 10 |
| `ItemModal.tsx` | 161 | 9 | 9 | 10 | 10 | 10 |
| `ItemForm.tsx` | 215 | 9 | 9 | 10 | 10 | 10 |
| `DeleteConfirmModal.tsx` | 98 | 9 | 9 | 10 | 10 | 10 |
| `StatusPlaceholder.tsx` | 25 | 10 | 10 | 10 | 10 | 10 |
| `Crud.page.tsx` | 101 | 10 | 10 | 10 | 10 | 10 |
| **Weighted Average** | **1,891** | **9.4** | **9.5** | **9.8** | **9.8** | **10.0** |

### All gaps — closed ✅

| # | Gap | File | Criteria | Status |
|---|---|---|---|---|
| ~~1~~ | ~~Add `aria-invalid` + `aria-describedby` to form fields~~ | ~~`ItemForm.tsx`~~ | ~~WCAG~~ | ✅ Done |
| ~~2~~ | ~~Fetch `yearOptions` from server~~ | ~~`crud.dtos.ts`, `crud.services.ts`, `crud.queries.ts`, `useCrudPage.ts`, `Crud.page.tsx`~~ | ~~OWASP~~ | ✅ Done — uses `POST /api/masters/GetYearsRetrieve` |
| ~~3~~ | ~~Add `variant="destructive"` to delete confirm button~~ | ~~`DeleteConfirmModal.tsx`~~ | ~~WCAG~~ | ✅ Done |
| ~~4~~ | ~~Handle partial failure in multi-delete~~ | ~~`DeleteConfirmModal.tsx`~~ | ~~OWASP~~ | ✅ Done — `Promise.allSettled` with partial success toast |
| ~~5~~ | ~~Configure `react-toastify` with `role="alert"`~~ | ~~`App.tsx`~~ | ~~WCAG~~ | ✅ Done |
| ~~6~~ | ~~Add inline comments for `as never` and `satisfies`~~ | ~~`ItemTable.tsx`, `itemColumns.tsx`~~ | ~~Jr-friendly~~ | ✅ Done |
| ~~7~~ | ~~Add Zod runtime validation at API boundary~~ | ~~`crud.services.ts`~~ | ~~OWASP~~ | ✅ Done |
| ~~8~~ | ~~Add Zod form validation schema~~ | ~~`crud.types.ts`~~ | ~~OWASP~~ | ✅ Done |
| ~~9~~ | ~~Add `aria-invalid` to `completedBy` and `completedDate`~~ | ~~`ItemForm.tsx`~~ | ~~WCAG~~ | ✅ Done |

### Verdict

The implementation is **gold standard production-ready**. All 9 identified gaps have been closed:
- **OWASP 9.8/10** — Zod runtime validation on API responses + form submission, server-fetched year options, partial failure handling in multi-delete.
- **WCAG 9.8/10** — `aria-invalid` + `aria-describedby` on all form fields, `role="alert"` on toast container, destructive button styling on delete confirm.
- **Jr-friendly 9.5/10** — Inline comments on `as never` and `satisfies` TypeScript patterns.
- **Architecture 10/10** — unchanged, exemplary separation of concerns across all files.

---

## 9. Separation of Concerns — Design, Markup, and Logic

### 9.1 How SoC Works in This Codebase

Traditional web development separates by **file type** (`.html`, `.css`, `.js`). Modern React + Tailwind separates by **responsibility**:

| Concern | Where it lives | Separated from |
|---|---|---|
| **API contracts** | `crud.dtos.ts` | Everything — pure types, no imports |
| **HTTP calls** | `crud.services.ts` | React, UI, state |
| **Cache + async state** | `crud.queries.ts` | UI, styling, components |
| **UI domain types** | `crud.types.ts` | API types, components |
| **Data transformation** | `helpers/*.ts` | React, hooks, UI |
| **Page state + handlers** | `useCrudPage.ts` | UI, styling, rendering |
| **Column configuration** | `itemColumns.tsx` | Components, state, HTTP |
| **Form fields** | `ItemForm.tsx` | Submit logic, mutations |
| **Form submission** | `ItemModal.tsx` | Field rendering |
| **Table rendering** | `ItemTable.tsx` | Data fetching, mutations |
| **Page orchestration** | `Crud.page.tsx` | Business logic, styling details |
| **Design system** | `components/ui/v1/*` | Feature code |
| **Layout patterns** | `components/layouts/v1/*` | Feature code |

### 9.2 Where Is the Styling?

Styling lives in **three layers**:

**Layer 1: Design system components** (`components/ui/v1/`)
- `Button`, `Select`, `Dialog`, `Badge`, `Skeleton`, etc.
- Each encapsulates its own Tailwind classes
- Feature code uses `<Button variant="destructive">` — doesn't need to know the CSS

**Layer 2: Layout components** (`components/layouts/v1/`)
- `TableLayout`, `SingleColumnPage`, `PageTitle`, `PageContent`
- Handle positioning, spacing, responsive behavior
- Feature code drops content into named slots

**Layer 3: Inline Tailwind utilities** (in feature `.tsx` files)
- `className="flex w-full max-w-110 flex-col gap-4 pb-4"` in `ItemForm.tsx`
- This is **intentional** — Tailwind's design philosophy is co-location of styles with markup
- A junior can see exactly what styles apply by reading the JSX — no hunting through CSS files

### 9.3 Why Not Separate CSS Files?

| Approach | Pros | Cons |
|---|---|---|
| Separate `.css` files | Traditional SoC | Specificity wars, dead CSS, hard to trace which styles apply |
| CSS Modules | Scoped styles | Extra files, still need to cross-reference |
| **Tailwind inline (current)** | **Co-located, no dead CSS, no specificity issues** | **Longer `className` strings** |

The trade-off is accepted because:
1. **Design system components absorb most styling** — feature code rarely writes raw Tailwind for buttons, inputs, dialogs
2. **Layout components handle positioning** — feature code doesn't manage grid/flex layouts for page structure
3. **Remaining inline Tailwind is minimal** — mostly spacing (`gap-4`, `mt-2`) and sizing (`max-w-110`, `min-h-24`)

### 9.4 The Separation That Matters

The critical separation is **not** HTML vs CSS vs JS. It's:

```
Things that change for DIFFERENT reasons live in DIFFERENT files.

API contract changes?     → crud.dtos.ts only
New endpoint?             → crud.services.ts + crud.queries.ts only
New table column?         → itemColumns.tsx only
New form field?           → ItemForm.tsx + crud.types.ts only
New page state?           → useCrudPage.ts only
Button style change?      → components/ui/v1/button.tsx only (affects ALL buttons)
Layout change?            → components/layouts/v1/ only (affects ALL pages)
```

This is why Architecture scores 10/10 across all files — every file has exactly one reason to change.

### 9.5 SoC Score

| Dimension | Score | Reasoning |
|---|---|---|
| Logic vs Rendering | 10/10 | Hook has zero JSX. Components have zero data fetching. |
| API vs UI types | 10/10 | DTOs ≠ EditContext ≠ FormValues ≠ ItemRow. Four distinct type layers. |
| Styling vs Feature code | 9/10 | Design system + layout components absorb ~80% of styling. Remaining inline Tailwind is minimal and co-located. |
| Configuration vs Code | 10/10 | Columns, filters, visibility, actions — all declarative config in `itemColumns.tsx`. |
| Page vs Components | 10/10 | Page is 101 lines of wiring. Components are self-contained. |
| **Overall SoC** | **9.8/10** | |

---

## 10. React Patterns & Functions Reference

> A complete catalog of every React hook, library function, and coding pattern used in crud-v4.
> For each item: **what it is**, **where we use it**, **why we chose it**, and a **code example** from the codebase.

---

### 10.1 React Core Hooks

#### `useState`

**What:** Declares a single piece of local state inside a component. Returns `[value, setter]`.

**Where used:**
| File | State variable | Purpose |
|---|---|---|
| `Crud.page.tsx:38` | `pendingDeleteIds` | Tracks which row IDs are queued for deletion |
| `ItemTable.tsx:103-109` | `sorting`, `searchValue`, `columnFilters`, `rowSelection`, `selectedYear` | All client-side table UI state |
| `ItemForm.tsx:39` | `dateSelectorOpen` | Controls the date-picker popover open/close |
| `DeleteConfirmModal.tsx:38` | `isDeleting` | Disables buttons during async delete |
| `useCrudPage.ts:79` | `serverParams` | Stores the current server filter params (year) |

**Why:** `useState` is the simplest way to hold a single value that triggers a re-render when it changes. We use it for independent, unrelated pieces of state. When multiple state values are **related** and change together, we use `useReducer` instead (see below).

**Example from `ItemTable.tsx`:**
```tsx
const [sorting, setSorting] = useState<SortingState>([]);
const [searchValue, setSearchValue] = useState("");
const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
```
Each of these is independent — changing the sort order doesn't affect the search value — so separate `useState` calls are correct.

---

#### `useReducer`

**What:** Like `useState`, but for **related state** that transitions through defined actions. Takes a reducer function `(state, action) => newState` and returns `[state, dispatch]`.

**Where used:** `useCrudPage.ts:76` — manages `modalOpen`, `editCtx`, and `deleteConfirmOpen` together.

**Why:** These three values are **coupled** — opening the create modal requires setting `modalOpen: true` AND `editCtx: { mode: "create", ... }` in a single atomic update. With three separate `useState` calls, a junior could accidentally set `modalOpen: true` but forget to set `editCtx`, creating an impossible state (open modal with no context). The reducer makes every valid transition explicit.

**Example from `useCrudPage.ts`:**
```tsx
// The state shape
type ModalState = {
  modalOpen: boolean;
  editCtx: ItemEditContext | null;
  deleteConfirmOpen: boolean;
};

// The allowed transitions
type ModalAction =
  | { type: "OPEN_CREATE" }
  | { type: "OPEN_EDIT"; ctx: ItemEditContext }
  | { type: "CLOSE_MODAL" }
  | { type: "OPEN_DELETE_CONFIRM" }
  | { type: "CLOSE_DELETE_CONFIRM" };

// The reducer — pure function, testable outside React
const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case "OPEN_CREATE":
      return { ...state, modalOpen: true, editCtx: { mode: "create", ... } };
    case "CLOSE_MODAL":
      return { ...state, modalOpen: false, editCtx: null };
    // ...
  }
};

// Usage in the hook
const [modal, dispatch] = useReducer(modalReducer, initialModalState);
dispatch({ type: "OPEN_CREATE" }); // one call, two state values change atomically
```

**Rule of thumb:** Use `useState` for independent values. Use `useReducer` when 2+ values must change together or when you have 3+ related state transitions.

---

#### `useMemo`

**What:** Caches a computed value. Only recalculates when its dependency array changes. Returns the cached value (not a setter).

**Where used:**
| File | What it memoizes | Dependencies |
|---|---|---|
| `useCrudPage.ts:86` | `items` — fallback to `[]` if response is undefined | `[itemsResponse]` |
| `useCrudPage.ts:87` | `rows` — maps DTOs to table rows via `mapItemDtoToRow` | `[items]` |
| `useCrudPage.ts:89-92` | `categories` — extracts `ResponseActivities` array | `[categoriesResponse]` |
| `useCrudPage.ts:94-97` | `yearOptions` — extracts year strings | `[yearsResponse]` |
| `ItemTable.tsx:113-125` | `actions` — row action config object | `[onEdit, onDeleteSelected]` |
| `ItemTable.tsx:127-130` | `columns` — column definitions from factory | `[actions]` |
| `ItemTable.tsx:172-178` | `selectedIds` — IDs of selected rows | `[table, rowSelection]` |
| `ItemModal.tsx:72` | `defaultValues` — form defaults from edit context | `[editCtx]` |
| `ItemForm.tsx:40-43` | `loggedInUserCode` — sanitized localStorage value | `[]` (once on mount) |

**Why:** Without `useMemo`, expensive operations like `items.map(mapItemDtoToRow)` (potentially hundreds of rows) would re-run on **every render** — even when the items haven't changed. `useMemo` ensures the mapping only runs when `items` actually changes.

**Example from `useCrudPage.ts`:**
```tsx
// Without useMemo: runs mapItemDtoToRow on EVERY render (wasteful)
const rows = items.map(mapItemDtoToRow);

// With useMemo: only runs when `items` changes
const rows = useMemo<ItemRow[]>(() => items.map(mapItemDtoToRow), [items]);
```

**Special case — empty `[]` dependencies:**
```tsx
// ItemForm.tsx — reads localStorage ONCE on mount, never again
const loggedInUserCode = useMemo(
  () => localStorage.getItem("userCode")?.replace(/[^a-zA-Z0-9]/g, "") || undefined,
  [], // empty array = compute once, cache forever
);
```

---

#### `useCallback`

**What:** Caches a **function reference**. The function itself doesn't change between renders unless its dependencies change. Returns the cached function.

**Where used:**
| File | Handler | Dependencies |
|---|---|---|
| `Crud.page.tsx:40-46` | `handleDeleteSelected` | `[handleOpenDeleteConfirm]` |
| `Crud.page.tsx:48-50` | `handleDeleteCompleted` | `[]` |
| `useCrudPage.ts:101-103` | `handleServerSearch` | `[]` |
| `useCrudPage.ts:105-107` | `handleCreate` | `[]` |
| `useCrudPage.ts:109-116` | `handleEdit` | `[items]` |
| `useCrudPage.ts:118-120` | `handleCloseModal` | `[]` |
| `useCrudPage.ts:122-128` | `handleOpenDeleteConfirm`, `handleCloseDeleteConfirm` | `[]` |
| `ItemModal.tsx:95-117` | `onSubmit` | `[isEdit, editCtx, createMutation, updateMutation, onClose]` |
| `DeleteConfirmModal.tsx:50-70` | `handleConfirm` | `[count, selectedIds, deleteMutation]` |

**Why:** When you pass a function as a prop to a child component, React re-renders the child if the function reference changes. Without `useCallback`, a new function is created on every render → child re-renders unnecessarily. `useCallback` stabilizes the reference.

**Example from `useCrudPage.ts`:**
```tsx
// Without useCallback: new function every render → ItemTable re-renders
const handleCreate = () => dispatch({ type: "OPEN_CREATE" });

// With useCallback: same function reference across renders
const handleCreate = useCallback(() => {
  dispatch({ type: "OPEN_CREATE" });
}, []); // [] = no dependencies, function never changes
```

**When dependencies matter:**
```tsx
// handleEdit depends on `items` — if items change, the function must update
// to close over the new items array
const handleEdit = useCallback(
  (itemId: number) => {
    const dto = items.find((i) => i.StudentNumber === itemId);
    if (!dto) return;
    dispatch({ type: "OPEN_EDIT", ctx: buildEditContext(dto) });
  },
  [items], // re-creates only when items changes
);
```

**Rule of thumb:** `useMemo` caches a **value**. `useCallback` caches a **function**. `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

---

#### `useEffect`

**What:** Runs side effects after render. The callback runs after the component mounts and after every re-render where a dependency changes. Returns an optional cleanup function.

**Where used:**
| File | What it does | Dependencies |
|---|---|---|
| `ItemModal.tsx:81-85` | Captures the active element (trigger) when modal opens, for focus restoration | `[open]` |
| `ItemModal.tsx:88-91` | Resets form values when modal opens or edit context changes | `[open, reset, defaultValues]` |

**Why:** Side effects (DOM manipulation, form resets, subscriptions) don't belong in the render phase. `useEffect` runs them **after** React has committed to the DOM.

**Example from `ItemModal.tsx`:**
```tsx
// Capture which button opened the modal so we can return focus when it closes
useEffect(() => {
  if (open) {
    triggerRef.current = document.activeElement as HTMLElement;
  }
}, [open]); // runs whenever `open` changes (false→true or true→false)

// Reset form when modal opens with new context
useEffect(() => {
  if (!open) return;       // skip when closing
  reset(defaultValues);    // reset form to new defaults
}, [open, reset, defaultValues]);
```

**Why we use it sparingly:** `useEffect` is the most error-prone hook. In crud-v4, we only use it twice — both in `ItemModal.tsx` for DOM-level concerns (focus management, form reset). All data fetching is handled by React Query (not `useEffect`), and all state transitions are handled by `useReducer`/`useState`.

---

#### `useRef`

**What:** Holds a mutable value that persists across renders **without triggering re-renders** when it changes.

**Where used:** `ItemModal.tsx:67` — `triggerRef` stores the DOM element that opened the modal.

**Why:** We need to remember which button the user clicked (to return focus on close), but changing this value should NOT cause a re-render. `useState` would re-render; `useRef` doesn't.

**Example from `ItemModal.tsx`:**
```tsx
const triggerRef = useRef<HTMLElement | null>(null);

// On open: save the active element
useEffect(() => {
  if (open) triggerRef.current = document.activeElement as HTMLElement;
}, [open]);

// On close: return focus (WCAG 2.4.3 Focus Order)
<DialogContent onCloseAutoFocus={() => triggerRef.current?.focus()}>
```

---

#### `lazy` + `Suspense`

**What:** `lazy()` dynamically imports a component (code-splitting). `Suspense` shows a fallback UI while the lazy component loads.

**Where used:** `Crud.module.tsx:4,8`

**Why:** The CRUD page is a feature module — it shouldn't be in the main bundle. `lazy()` splits it into a separate chunk that loads on demand when the user navigates to the route. This reduces initial page load time.

**Example from `Crud.module.tsx`:**
```tsx
const CrudPage = lazy(() => import("./Crud.page"));

const CrudModule = () => (
  <Suspense fallback={<div aria-live="polite">Loading...</div>}>
    <Routes>
      <Route index element={<CrudPage />} />
    </Routes>
  </Suspense>
);
```

---

### 10.2 React Hook Form (RHF)

#### `useForm`

**What:** Creates a form instance with validation, default values, and submit handling. Returns `methods` object containing `control`, `handleSubmit`, `reset`, `formState`, etc.

**Where used:** `ItemModal.tsx:74-77`

**Why:** RHF manages form state (values, errors, dirty fields, submit count) without re-rendering the entire form on every keystroke. It uses uncontrolled inputs internally for performance.

**Example from `ItemModal.tsx`:**
```tsx
const methods = useForm<ItemFormValues>({
  resolver: zodResolver(ItemFormSchema), // Zod validates on submit
  defaultValues,                         // pre-populated from editCtx
});
const { handleSubmit, reset } = methods;
```

---

#### `FormProvider` + `useFormContext`

**What:** `FormProvider` wraps a subtree with the form instance (React Context). `useFormContext` accesses that instance from any child — no prop drilling.

**Where used:**
- `FormProvider` in `ItemModal.tsx:136` — wraps the `<form>` and `<ItemForm>`
- `useFormContext` in `ItemForm.tsx:45-49` — accesses `control`, `watch`, `formState`

**Why:** The modal owns the form instance (it handles submit). The form component renders the fields. Without `FormProvider`, we'd have to pass `control`, `errors`, `watch`, `submitCount` as individual props — 4+ props just for plumbing.

**Example:**
```tsx
// ItemModal.tsx — provides the form context
<FormProvider {...methods}>
  <form onSubmit={handleSubmit(onSubmit)}>
    <ItemForm categories={categories} />  {/* no form props needed */}
  </form>
</FormProvider>

// ItemForm.tsx — consumes the form context
const { control, watch, formState: { errors, submitCount } } = useFormContext<ItemFormValues>();
```

---

#### `Controller`

**What:** Bridges RHF with controlled components (like Shadcn `Select`, `Calendar`, `Checkbox`) that don't expose a native `ref`. Provides `field` (value, onChange, onBlur) and `fieldState` (error, isDirty).

**Where used:** `ItemForm.tsx` — wraps every field: Activity (`Select`), Completed By (`TeacherSearch`), Completed Date (`Calendar`), Notes (`Textarea`), Restrict Notes (`Checkbox`).

**Why:** Native `<input>` elements work with RHF's `register()` (uncontrolled). But Shadcn components are React components that need `value`/`onChange` props — `Controller` provides those from RHF's internal state.

**Example from `ItemForm.tsx`:**
```tsx
<Controller
  name="activityId"
  control={control}
  render={({ field }) => (
    <Select
      value={field.value ? String(field.value) : ""}
      onValueChange={(val) => field.onChange(val)}
    >
      {/* ... */}
    </Select>
  )}
/>
```

---

#### `watch`

**What:** Subscribes to a form field's value. Re-renders the component whenever that field changes.

**Where used:** `ItemForm.tsx:51` — watches `notes` to conditionally show the "Restrict Notes" checkbox.

**Why:** The checkbox should only appear when the user has typed something in the notes field. `watch("notes")` gives us a live value that updates on every keystroke.

**Example from `ItemForm.tsx`:**
```tsx
const notes = watch("notes");

// Checkbox only renders when notes is non-empty
{!!notes && (
  <Controller name="restrictedNotes" control={control} render={...} />
)}
```

---

#### `zodResolver`

**What:** Adapter that connects a Zod schema to RHF's validation system. RHF calls the resolver on submit (or on change/blur if configured).

**Where used:** `ItemModal.tsx:75`

**Why:** Validation rules live in one place (`ItemFormSchema` in `crud.types.ts`), not scattered across individual `Controller` `rules` props. Change a rule once → it applies everywhere.

**Example:**
```tsx
// crud.types.ts — single source of truth for validation
export const ItemFormSchema = z.object({
  activityId: z.string().min(1, "Activity is required"),
  completedDate: z.date().refine((d) => d <= new Date(), "Date cannot be in the future"),
  completedBy: z.number().min(1, "Completed By is required"),
  notes: z.string().default(""),
  restrictedNotes: z.boolean().default(false),
});

// ItemModal.tsx — one line wires it into RHF
const methods = useForm<ItemFormValues>({
  resolver: zodResolver(ItemFormSchema),
});
```

---

### 10.3 TanStack React Query

#### `useQuery`

**What:** Declarative data fetching hook. Manages loading, error, caching, refetching, and stale-while-revalidate automatically.

**Where used:**
| Hook | Endpoint | Key option |
|---|---|---|
| `useGetItems` | `GetStudentsAttendanceSummary` | `enabled: !!params` — won't fetch until user clicks Search |
| `useGetCategories` | `GetResponseActivities` | `staleTime: 5min` — cached, rarely changes |
| `useGetYears` | `GetYearsRetrieve` | `staleTime: 10min` — cached, rarely changes |

**Why:** Replaces manual `useEffect` + `useState` + `isLoading` + `isError` patterns. React Query handles caching, deduplication, background refetching, and garbage collection automatically.

**Example from `crud.queries.ts`:**
```tsx
export const useGetItems = (params?: GetItemsParams) =>
  useQuery<GetItemsResponse, AxiosError>({
    queryKey: [...QUERY_KEYS.items, params], // cache key includes params
    queryFn: () => getItems(params),         // the actual HTTP call
    enabled: !!params,                       // don't fetch until params exist
  });
```

**The `enabled` pattern:** This is the "Search button" pattern. The query is disabled until the user selects a year and clicks Search, which sets `serverParams`. This prevents an automatic fetch on page load.

---

#### `useMutation`

**What:** Manages async mutations (create, update, delete) with `onSuccess`/`onError` callbacks. Returns `mutate()` (fire-and-forget) and `mutateAsync()` (returns Promise).

**Where used:**
| Hook | Endpoint | On success |
|---|---|---|
| `useCreateItem` | `RecordStudentActivity` | Toast + invalidate items query |
| `useUpdateItem` | `UpdateStudentActivity` | Toast + invalidate items query |
| `useDeleteItem` | `DeleteStudentActivity` | Toast + invalidate + optional `onDeleted` callback |

**Why:** Mutations need side effects (toasts, cache invalidation, closing modals). `useMutation` provides a structured way to handle success/error without manual try/catch.

**Example from `crud.queries.ts`:**
```tsx
export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateItemResponse, AxiosError, CreateItemRequest>({
    mutationFn: createItem,
    onSuccess: async () => {
      toast.success("Activity recorded.");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
    },
    onError: () => {
      toast.error("Unable to record activity. Please try again.");
    },
  });
};
```

---

#### `useQueryClient` + `invalidateQueries`

**What:** `useQueryClient()` accesses the shared query cache. `invalidateQueries()` marks cached data as stale, triggering a background refetch.

**Where used:** Every mutation hook (`useCreateItem`, `useUpdateItem`, `useDeleteItem`).

**Why:** After creating/updating/deleting an item, the table data is stale. Instead of manually updating the cache (error-prone), we invalidate it → React Query refetches → table updates automatically.

**Example:**
```tsx
await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
// All queries matching this key prefix are now stale → refetch in background
```

---

#### `QUERY_KEYS` constant object

**What:** A centralized object holding all query key arrays, defined with `as const` for type safety.

**Where used:** `crud.queries.ts:34-38`

**Why:** Query keys are used in both `useQuery` (to fetch) and `invalidateQueries` (to bust cache). If they're string literals scattered across files, a typo silently breaks cache invalidation. A single `QUERY_KEYS` object enables find-all-references and prevents typos.

**Example:**
```tsx
const QUERY_KEYS = {
  items: ["getStudentsAttendanceSummary"] as const,
  categories: ["getResponseActivities"] as const,
  years: ["getYearsRetrieve"] as const,
};
```

---

### 10.4 TanStack Table

#### `useReactTable`

**What:** Creates a headless table instance with sorting, filtering, pagination, and row selection. Returns a `table` object with methods like `getRowModel()`, `getHeaderGroups()`, `setPageIndex()`.

**Where used:** `ItemTable.tsx:134-163`

**Why:** TanStack Table is **headless** — it manages table logic (sorting, filtering, pagination) but renders zero UI. We provide our own Shadcn `<Table>` markup. This gives full control over styling while getting battle-tested table logic for free.

**Example from `ItemTable.tsx`:**
```tsx
const table = useReactTable({
  data: rows,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: { sorting, globalFilter: searchValue, columnFilters, rowSelection },
  onSortingChange: setSorting,
  enableRowSelection: true,
  getRowId: (row) => String(row.id),
  initialState: {
    pagination: { pageSize: PAGE_SIZE },
    columnVisibility: DEFAULT_COLUMN_VISIBILITY,
  },
});
```

---

#### `flexRender`

**What:** TanStack Table utility that renders column definitions (which can be strings, functions, or React components) into actual JSX.

**Where used:** `ItemTable.tsx:281,293`

**Why:** Column `header` and `cell` definitions can be plain strings (`"Name"`) or render functions (`({ row }) => <Badge>...</Badge>`). `flexRender` handles both cases uniformly.

**Example:**
```tsx
{/* Header */}
{flexRender(header.column.columnDef.header, header.getContext())}

{/* Cell */}
{flexRender(cell.column.columnDef.cell, cell.getContext())}
```

---

#### `ColumnDef<T>`

**What:** Type-safe column definition. Each column specifies `accessorKey` (data field), `header` (render), `cell` (render), `size`, `enableSorting`, `enableGlobalFilter`, `filterFn`.

**Where used:** `itemColumns.tsx:133-344` — 24 column definitions in `buildItemColumns()`.

**Why:** Columns are **declarative config** — adding a new column is copy-paste. The factory function pattern (`buildItemColumns({ actions })`) allows the actions column to be conditionally included.

---

### 10.5 Zod

#### `z.object()` + `z.infer`

**What:** `z.object()` declares a schema (shape + validation rules). `z.infer<typeof schema>` extracts the TypeScript type from the schema — single source of truth.

**Where used:**
| File | Schema | Inferred type |
|---|---|---|
| `crud.dtos.ts:17-45` | `ItemDtoSchema` | `ItemDto` |
| `crud.dtos.ts:54-62` | `CategoryDtoSchema` | `CategoryDto` |
| `crud.dtos.ts:80-86` | `YearDataSchema` | `YearData` |
| `crud.types.ts:28-40` | `ItemFormSchema` | `ItemFormValues` |

**Why:** Without Zod, you write the type AND the validation separately — they can drift. With `z.infer`, change the schema → the type updates automatically.

**Example:**
```tsx
// Schema = validation rules + type definition in one
export const ItemFormSchema = z.object({
  activityId: z.string().min(1, "Activity is required"),
  completedDate: z.date().refine((d) => d <= new Date(), "Date cannot be in the future"),
});

// Type is DERIVED — never hand-written
export type ItemFormValues = z.infer<typeof ItemFormSchema>;
// Equivalent to: { activityId: string; completedDate: Date; ... }
```

---

#### `zodParse` (runtime validation)

**What:** Validates API response data against a Zod schema at runtime. If the backend sends unexpected data, it throws before the data reaches components.

**Where used:** `crud.services.ts:38,43,48` — every READ endpoint.

**Why (OWASP):** API responses are **untrusted external data**. TypeScript types are erased at runtime — they can't catch a backend returning `null` where you expected a `string`. Zod catches this at the API boundary.

**Example from `crud.services.ts`:**
```tsx
export const getItems = async (params?: GetItemsParams): Promise<GetItemsResponse> => {
  const response = await apiClient.get("/api/NZAMP/GetStudentsAttendanceSummary", { params });
  return zodParse(GetItemsResponseSchema, response.data, "getItems");
  // If response.data doesn't match the schema → ZodError → React Query onError → toast
};
```

---

### 10.6 JavaScript / TypeScript Patterns

#### `Promise.allSettled` (partial failure handling)

**What:** Like `Promise.all`, but **never rejects**. Returns an array of `{ status: "fulfilled" | "rejected" }` objects for each promise.

**Where used:** `DeleteConfirmModal.tsx:54-56` — multi-select delete.

**Why:** When deleting 5 items, if item #3 fails, `Promise.all` would abort and lose the results of items #4 and #5. `Promise.allSettled` lets all 5 complete, then we count successes and failures separately.

**Example from `DeleteConfirmModal.tsx`:**
```tsx
const results = await Promise.allSettled(
  selectedIds.map((id) => deleteMutation.mutateAsync({ studentActivityId: id })),
);
const failed = results.filter((r) => r.status === "rejected").length;
const succeeded = results.length - failed;

if (failed === 0) { /* all good */ }
else if (succeeded === 0) { toast.error("Unable to delete..."); }
else { toast.warning(`${succeeded} deleted, ${failed} failed.`); }
```

---

#### Spread operator for conditional array items

**What:** `...(condition ? [item] : [])` — conditionally includes an item in an array literal.

**Where used:** `itemColumns.tsx:329-343` — conditionally includes the actions column.

**Why:** The actions column should only exist if the page passes an `actions` config. A ternary inside a spread cleanly includes or excludes it without `if` statements or `.filter(Boolean)`.

**Example from `itemColumns.tsx`:**
```tsx
export const buildItemColumns = ({ actions }: ColumnConfig = {}): ColumnDef<ItemRow>[] => [
  { id: "select", ... },
  { accessorKey: "name", ... },
  // ... 22 more columns ...

  // Actions column — only included if `actions` is provided
  ...(actions
    ? [{ id: "actions", cell: ({ row }) => renderActionsCell(row.original, actions), ... } satisfies ColumnDef<ItemRow>]
    : []),
];
```

---

#### `satisfies` keyword (TypeScript 4.9+)

**What:** Checks that a value matches a type at compile time **without widening** the type. Unlike `as`, it catches typos and missing fields.

**Where used:** `itemColumns.tsx:341` — validates the actions column definition.

**Why:** The actions column is built inline in a spread. `as ColumnDef<ItemRow>` would silence type errors. `satisfies ColumnDef<ItemRow>` validates the shape while preserving the literal type for the spread.

---

#### `as const` assertion

**What:** Makes an object/array deeply readonly with literal types instead of widened types.

**Where used:** `crud.queries.ts:35-37` — `QUERY_KEYS`.

**Why:** Without `as const`, `["getStudentsAttendanceSummary"]` has type `string[]`. With `as const`, it has type `readonly ["getStudentsAttendanceSummary"]` — a tuple. This gives better type safety when React Query compares query keys.

---

#### `as never` type assertion

**What:** Tells TypeScript to accept a value that doesn't match the expected type. Used as a last resort when the type system can't express what we know to be correct.

**Where used:** `ItemTable.tsx:150` — `filterFn: "filterBuilder" as never`.

**Why:** TanStack Table's `defaultColumn.filterFn` type only accepts built-in filter names (like `"includesString"`). We registered a custom `"filterBuilder"` in `filterFns`, but the type system doesn't know about it. The `as never` cast bridges this gap. An inline comment explains why.

---

#### Pure helper functions outside components

**What:** Functions defined outside the component body — they don't use hooks and don't re-create on every render.

**Where used:**
| Function | File | Purpose |
|---|---|---|
| `buildDefaults()` | `ItemModal.tsx:38-44` | EditContext → FormValues |
| `buildPayload()` | `ItemModal.tsx:48-55` | FormValues → mutation payload |
| `mapItemDtoToRow()` | `mapItemDtoToRow.ts:43-76` | DTO → table row |
| `buildEditContext()` | `buildEditContext.ts:13-23` | DTO → edit modal context |
| `renderActionsCell()` | `itemColumns.tsx:78-125` | Actions config → JSX |

**Why:** These are pure functions — same input always produces same output, no side effects. Defining them outside the component means:
1. They don't re-create on every render (no `useCallback` needed)
2. They're testable without React (just call the function)
3. They can be imported and reused elsewhere

---

### 10.7 React Patterns (Architectural)

#### Orchestrator pattern (thin page component)

**What:** The page component (`Crud.page.tsx`) contains zero business logic. It calls one hook and renders child components.

**Why:** A junior can understand the entire page in 2 minutes. All logic is in the hook (testable), all rendering is in components (composable). The page is just wiring.

---

#### Custom hook extraction (`useCrudPage`)

**What:** All state, handlers, and derived data extracted into a single custom hook.

**Why:** Separation of concerns — the hook is pure logic (testable without rendering), the page is pure layout (readable without logic). Also enables reuse if the same data is needed on a different page.

---

#### FormProvider / useFormContext (context-based form sharing)

**What:** Form instance created in the modal, consumed in the form component via React Context.

**Why:** Avoids prop-drilling `control`, `errors`, `watch`, `submitCount` through component boundaries. The form component only needs to call `useFormContext()`.

---

#### Slot-based layout (`TableLayout` + named children)

**What:** `TableLayout` accepts named child components (`TableServerFilters`, `TableSearch`, `TableContent`, `TablePrimaryButtons`, etc.) and positions them in a predefined layout.

**Why:** The table component focuses on **what** to render (data, filters, buttons). The layout component handles **where** things go (positioning, spacing, responsive behavior). Changing the layout doesn't require touching feature code.

---

#### Declarative row actions (`ActionsConfig`)

**What:** Row actions (edit, delete) are defined as a config object, not JSX. The column definition renders them automatically.

**Why:** Adding a new action is one line in the config. No need to touch the column definition or the actions cell renderer.

```tsx
const actions: ActionsConfig<ItemRow> = {
  quick: [{ icon: EditIcon, label: "Edit", onClick: (row) => onEdit(row.id) }],
  menu: [
    { icon: EditIcon, label: "Edit", onClick: (row) => onEdit(row.id) },
    "separator",
    { icon: Trash2Icon, label: "Delete", variant: "destructive", onClick: (row) => onDeleteSelected([row.id]) },
  ],
};
```

---

### 10.8 Quick Reference Table

| Function / Hook | From | Category | Files used in | One-line purpose |
|---|---|---|---|---|
| `useState` | React | State | 5 files | Single independent state value |
| `useReducer` | React | State | `useCrudPage.ts` | Related state with defined transitions |
| `useMemo` | React | Performance | 4 files | Cache computed values |
| `useCallback` | React | Performance | 3 files | Cache function references |
| `useEffect` | React | Side effects | `ItemModal.tsx` | Focus management + form reset |
| `useRef` | React | Mutable ref | `ItemModal.tsx` | Store trigger element for focus return |
| `lazy` + `Suspense` | React | Code splitting | `Crud.module.tsx` | Load page chunk on demand |
| `useForm` | react-hook-form | Forms | `ItemModal.tsx` | Create form instance with Zod validation |
| `FormProvider` | react-hook-form | Forms | `ItemModal.tsx` | Share form via context |
| `useFormContext` | react-hook-form | Forms | `ItemForm.tsx` | Access shared form from child |
| `Controller` | react-hook-form | Forms | `ItemForm.tsx` | Bridge RHF with controlled components |
| `watch` | react-hook-form | Forms | `ItemForm.tsx` | Subscribe to field value changes |
| `zodResolver` | @hookform/resolvers | Validation | `ItemModal.tsx` | Wire Zod schema into RHF |
| `useQuery` | @tanstack/react-query | Data fetching | `crud.queries.ts` | Declarative GET with caching |
| `useMutation` | @tanstack/react-query | Data fetching | `crud.queries.ts` | Declarative POST with side effects |
| `useQueryClient` | @tanstack/react-query | Cache | `crud.queries.ts` | Access query cache for invalidation |
| `useReactTable` | @tanstack/react-table | Table | `ItemTable.tsx` | Headless table instance |
| `flexRender` | @tanstack/react-table | Table | `ItemTable.tsx` | Render column defs to JSX |
| `z.object` / `z.infer` | zod | Validation | `crud.dtos.ts`, `crud.types.ts` | Schema + inferred type |
| `zodParse` | local utility | Validation | `crud.services.ts` | Runtime API response validation |
| `Promise.allSettled` | JavaScript | Async | `DeleteConfirmModal.tsx` | Partial failure handling |
| `satisfies` | TypeScript | Type safety | `itemColumns.tsx` | Compile-time shape check without widening |
| `as const` | TypeScript | Type safety | `crud.queries.ts` | Readonly literal types for query keys |

---

## 11. Session Log

> Chronological record of chat sessions that built and updated this document.

---

### Session 1 — 2026-02-16 (Initial Implementation Walkthrough)

**Goal:** Create a detailed line-by-line implementation walkthrough of every file in crud-v4.

**What was produced:**
- §0 — Getting Started (prerequisites, reading order, mental model diagram, key patterns table, copy-for-new-feature checklist)
- §1 — File Map (12 files, 1,778 lines total)
- §2 — Services Layer (`crud.dtos.ts`, `crud.services.ts`, `crud.queries.ts`, `crud.types.ts`) — line-by-line breakdown with per-file scores
- §3 — Helpers Layer (`mapItemDtoToRow.ts`, `buildEditContext.ts`)
- §4 — Columns Layer (`itemColumns.tsx`)
- §5 — Hook Layer (`useCrudPage.ts`)
- §6 — Components Layer (`ItemTable.tsx`, `ItemModal.tsx`, `ItemForm.tsx`, `DeleteConfirmModal.tsx`, `StatusPlaceholder.tsx`)
- §7 — Page Orchestrator (`Crud.page.tsx`)
- §8 — Overall Summary (per-file score table, 9 gaps identified and all closed)
- §9 — Separation of Concerns (design, markup, logic — how SoC works in Tailwind + React)

**Scoring criteria used:** Simplicity, Junior-friendliness, WCAG 2.1, OWASP, Architecture/SoC — each scored per file.

**Final verdict:** Gold standard production-ready. Weighted average: Simplicity 9.4, Jr-friendly 9.5, WCAG 9.8, OWASP 9.8, Architecture 10.0.

---

### Session 2 — 2026-02-16 (Quick Hook Explanation)

**Goal:** User asked "what is meant by `useFormContext`, `watch`, and `useMemo`?"

**What was produced:**
- Concise explanation of each hook grounded in the actual `ItemForm.tsx` code
- TL;DR comparison table: hook → library → purpose

**No document changes** — answered in chat only.

---

### Session 3 — 2026-02-17 → 2026-02-18 (React Patterns & Functions Reference)

**Goal:** User asked to review all crud-v4 code and document every specific React function/hook/pattern used, with details, examples, and reasoning. Add to the implementation document.

**What was produced:**
- §10 — React Patterns & Functions Reference (§10.1–§10.8)

**Subsections added:**

| Section | Content |
|---|---|
| §10.1 React Core Hooks | `useState` (5 files, 8 state variables), `useReducer` (modal state machine), `useMemo` (9 memoized values), `useCallback` (9 handlers), `useEffect` (2 uses — focus + form reset), `useRef` (trigger element for WCAG focus return), `lazy`+`Suspense` (code splitting) |
| §10.2 React Hook Form | `useForm` (Zod resolver + defaults), `FormProvider`+`useFormContext` (context-based form sharing), `Controller` (bridges RHF with Shadcn components), `watch` (conditional checkbox), `zodResolver` (single-line Zod→RHF wiring) |
| §10.3 TanStack React Query | `useQuery` (3 hooks, `enabled` pattern for search button), `useMutation` (3 hooks, toast + invalidation), `useQueryClient`+`invalidateQueries` (cache busting), `QUERY_KEYS` constant (single source of truth) |
| §10.4 TanStack Table | `useReactTable` (headless table with 4 row models), `flexRender` (renders column defs to JSX), `ColumnDef<T>` (24 declarative column definitions) |
| §10.5 Zod | `z.object`+`z.infer` (4 schemas, types derived from schemas), `zodParse` (runtime API response validation at boundary) |
| §10.6 JS/TS Patterns | `Promise.allSettled` (partial failure in multi-delete), conditional spread (`...(cond ? [x] : [])`), `satisfies` (compile-time check without widening), `as const` (readonly literal query keys), `as never` (custom filterFn bridge), pure helper functions (5 functions outside components) |
| §10.7 Architectural Patterns | Orchestrator pattern (thin page), custom hook extraction, FormProvider context sharing, slot-based layout, declarative row actions (`ActionsConfig`) |
| §10.8 Quick Reference Table | 23-row lookup: function → library → category → files → one-line purpose |

**Approach:** Read all 14 source files (1,891 lines), cataloged every import from React/RHF/TanStack/Zod, traced each usage to specific file + line number, wrote "what/where/why/example" for each.

**Document size after this session:** ~1,500 lines across §0–§11.
