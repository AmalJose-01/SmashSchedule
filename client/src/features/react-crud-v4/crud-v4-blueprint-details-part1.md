# CRUD v4 Blueprint — Detailed Guide (Part 1 of 2)

> **Audience:** Developers new to React, TypeScript, or this codebase.
> Explains every file — the *what*, the *why*, and *what breaks without it*.
> Read `crud-v4-blueprint.md` first for the high-level rules.
> **Part 2** covers: `page.tsx`, `ItemTable`, `ItemModal`, `ItemForm`, `DeleteConfirmModal`, `StatusPlaceholder`, `module.tsx`, common mistakes, glossary.

---

## 1. Mental Model — How the Pieces Fit Together

```
Browser URL: /my-feature
      │
      ▼
Feature.module.tsx        ← lazy-loads the page only when the user navigates here
      │
      ▼
Feature.page.tsx          ← orchestrator: calls the hook, renders children, zero logic
      │
      ├── useFeaturePage.ts   ← all state, all handlers, all derived data
      │       ├── useGetItems()        ← server list data
      │       ├── useGetCategories()   ← dropdown reference data
      │       └── useReducer()         ← modal open/close state
      │
      ├── <ItemTable>           ← rows, search, filters, pagination
      ├── <ItemModal>           ← create/edit form in a dialog
      └── <DeleteConfirmModal>  ← confirms before deleting
```

**Every layer has ONE job.**

| Layer | Job | What it must NOT do |
|---|---|---|
| `services.ts` | HTTP calls | No React, no UI |
| `queries.ts` | Cache + loading/error state | No JSX |
| `useFeaturePage.ts` | State + derived data | No JSX |
| `page.tsx` | Layout + wiring | No business logic |
| `components/` | Render UI | Minimal local state only |

**Why so many files?** When requirements change:
- Change the API endpoint → edit only `services.ts`
- Add a column → edit only `itemColumns.tsx`
- Change validation → edit only `types.ts`

With everything in one file, every change risks breaking everything else.

---

## 2. `Services/feature.dtos.ts`

**DTO = Data Transfer Object.** Defines the exact shape of data coming from the server.

### `import { z } from "zod"`

Zod validates *actual runtime data* from the network. TypeScript types only exist at compile time — at runtime TypeScript is gone. Without Zod, if the server sends `null` where you expected a `string`, the app silently breaks in confusing ways. With Zod, you get an immediate, clear error at the API boundary: `"Expected string, received null at path: StudentName"`.

### Item schema

```ts
export const ItemDtoSchema = z.object({
  StudentName: z.string(),
  StudentNumber: z.number(),
  CurrentYear: z.string(),
  NSN: z.string(),
  HomeClass: z.string(),
});
```

- Field names are **PascalCase** — that's what C# sends. We rename to camelCase in the mapper, not here.
- `z.string()` — field must be a string. Missing or null → Zod throws.
- You can add rules: `z.string().min(1)` (non-empty), `z.string().email()` (valid email).

### Response schema

```ts
export const GetItemsResponseSchema = z.array(ItemDtoSchema);
```

The API returns a list. `z.array` wraps the item schema — every element must match.
If the API returns `{ Items: [...] }` instead of a bare array, use:
`z.object({ Items: z.array(ItemDtoSchema) })`. Always match exactly what the C# controller returns.

### Inferred types

```ts
export type ItemDto = z.infer<typeof ItemDtoSchema>;
export type GetItemsResponse = z.infer<typeof GetItemsResponseSchema>;
```

`z.infer` extracts a TypeScript type *from* the Zod schema automatically. You never write the type manually — it is always derived from the schema. Add a field to the schema → the TypeScript type gains it automatically. They can never drift apart.

### Request types (plain `type`, no Zod)

```ts
export type CreateItemRequest = { studentIds: number[]; activityId: number; notes: string; };
```

Request bodies are data *we construct* — TypeScript's compile-time checking is sufficient.
Zod is only needed for data arriving *from* external sources we don't control.

---

## 3. `Services/feature.types.ts`

Holds **UI-layer types** — not API shapes.

### `ItemEditContext`

```ts
export type ItemEditContext = {
  mode: "create" | "update";
  studentActivityId?: number;
  studentId: number;
  completedDate: Date;
  notes: string;
};
```

When the user clicks "Edit", we pre-populate the modal form. `ItemEditContext` is the shape of that pre-populated data.

- **`mode: "create" | "update"`** — same modal handles both. `mode` tells it which mutation to call on submit. This is a *discriminated union* — inside `if (ctx.mode === "update")`, TypeScript knows `studentActivityId` may exist.
- **`studentActivityId?: number`** — optional because it doesn't exist yet during create.
- **`completedDate: Date`** — the form's date picker needs a `Date` object. The API sends ISO strings. The mapper converts string → Date. Each layer uses the format most natural to it.

### `ItemFormSchema`

```ts
export const ItemFormSchema = z.object({
  activityId: z.string({ required_error: "Activity is required" }).min(1, "Activity is required"),
  completedDate: z.date({ required_error: "Date is required" })
    .refine((d) => d <= new Date(), "Date cannot be in the future"),
  notes: z.string().default(""),
  restrictedNotes: z.boolean().default(false),
});
```

When the user clicks Submit, React Hook Form runs this schema. If any field fails, the form shows an error and does **not** call the API.

- **`required_error` vs `.min(1, ...)`** — you need both: `required_error` fires when the field is missing entirely (undefined); `.min(1)` fires when it's present but empty (`""`).
- **`.refine((d) => d <= new Date(), "...")`** — custom rule. Returns `true` = valid, `false` = invalid.
- **`.default("")`** — if the field is absent when the form initializes, use this value. Prevents TypeScript errors about potentially undefined form values.

### `ItemFormValues`

```ts
export type ItemFormValues = z.infer<typeof ItemFormSchema>;
```

Always derived from the schema — never written manually. React Hook Form uses this type to give you autocomplete on `form.watch("fieldName")`.

---

## 4. `Services/feature.services.ts`

One function per API endpoint. No business logic. No React. No UI.

### Key imports

```ts
import apiClient from "@/features/common/API/apiClient";
import { zodParse } from "@/utils/zodParse";
```

- **`apiClient`** — pre-configured Axios instance that automatically adds the auth token to every request. Using raw `axios` means you'd add the token manually every time — and forget sometimes.
- **`zodParse`** — runs a Zod schema against data, returns validated data or throws a clear error with the function name included (so you know which call failed).

### GET function

```ts
export const getItems = async (params?: GetItemsParams): Promise<GetItemsResponse> => {
  const response = await apiClient.get("/api/teachinglearning/nzamp/GetStudents", { params });
  return zodParse(GetItemsResponseSchema, response.data, "getItems");
};
```

- **`async`/`await`** — network calls are asynchronous. `async` marks the function as returning a Promise. `await` pauses until the server responds.
- **`{ params }`** — Axios converts the params object to URL query string automatically. `{ year: "10" }` → `?year=10`.
- **`response.data`** — Axios wraps the HTTP response. `.data` is the actual JSON body.
- **`zodParse(...)`** — validates the response at the boundary. Unexpected data throws immediately with a clear error instead of silently producing `undefined` values that crash later.

### POST (mutation) function

```ts
export const createItem = async (payload: CreateItemRequest): Promise<CreateItemResponse> => {
  const response = await apiClient.post<CreateItemResponse>("/api/.../RecordActivity", payload);
  return response.data;
};
```

No `zodParse` here — write operations return simple success/error responses. We trust our own payload construction.

---

## 5. `Services/feature.queries.ts`

React Query manages **server state** — caching, loading/error states, background refetching, cache invalidation. This file wraps service functions in React Query hooks.

### Key imports

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
```

- **`useQuery`** — for GET operations. Handles caching, loading, error states automatically.
- **`useMutation`** — for POST/PUT/DELETE. Handles loading, error, success callbacks.
- **`useQueryClient`** — accesses the query cache to invalidate (clear) data after mutations.
- **`import type { AxiosError }`** — `import type` imports only the TypeScript type, not runtime code. The type is erased at compile time — no Axios code is bundled just for this import.

### Query keys

```ts
const QUERY_KEYS = {
  items: ["getItems"] as const,
  categories: ["getCategories"] as const,
  years: ["getYearsRetrieve"] as const,
};
```

React Query identifies cached data by a "query key" array. If two components use the same key, they share cached data (no duplicate requests). A typo in a string literal creates a different key and caching breaks silently. Centralizing prevents this.

**`as const`** — makes array values readonly literal types. TypeScript catches typos at compile time.

**Why arrays?** React Query supports hierarchical keys. `["getItems", { year: "10" }]` is a child of `["getItems"]`. Invalidating `["getItems"]` clears all child keys too.

### List query hook

```ts
export const useGetItems = (params?: GetItemsParams) =>
  useQuery<GetItemsResponse, AxiosError>({
    queryKey: [...QUERY_KEYS.items, params],
    queryFn: () => getItems(params),
    enabled: !!params,
  });
```

- **`queryKey: [...QUERY_KEYS.items, params]`** — `{ year: "10" }` and `{ year: "11" }` are cached separately. Changing the year filter fetches fresh data for the new key while keeping the old year's data in cache.
- **`queryFn: () => getItems(params)`** — wrapped in an arrow function so `params` is captured from the closure at fetch time, not at hook definition time.
- **`enabled: !!params`** — `!!params` converts `params` to boolean. `undefined` → `false`, any object → `true`. When `false`, React Query does NOT fire the query. This is the **"Search button" pattern**: data only fetches after the user fills in filters and clicks Search.

### Reference data query (with `staleTime`)

```ts
export const useGetYears = () =>
  useQuery<GetYearsRetrieveResponse, AxiosError>({
    queryKey: [...QUERY_KEYS.years],
    queryFn: getYears,
    staleTime: 10 * 60 * 1000,
  });
```

**`staleTime: 10 * 60 * 1000`** — data is "fresh" for 10 minutes (value is milliseconds). React Query returns cached data without re-fetching during this window.

Year/category data rarely changes — it's reference data. Item data changes when users create/edit/delete — it needs to be fresh after mutations, so no `staleTime` (default is 0).

### Mutation hook

```ts
export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateItemResponse, AxiosError, CreateItemRequest>({
    mutationFn: createItem,
    onSuccess: async () => {
      toast.success("Item created.");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
    },
    onError: () => {
      toast.error("Unable to create item. Please try again.");
    },
  });
};
```

- **Three generic types on `useMutation`**: `<SuccessData, ErrorType, InputVariables>`. TypeScript uses these to type `data`, `error`, and the argument to `mutation.mutate(...)`.
- **`onSuccess`**: (1) shows a green toast, (2) invalidates the items cache → triggers re-fetch → table updates automatically. No manual refresh needed.
- **`await queryClient.invalidateQueries(...)`** — without `await`, the modal might close before the re-fetch completes, causing the table to briefly show stale data.
- **`onError`**: shows a red toast. React Query handles the error state internally.

### URL param override pattern

```ts
export const useGetSettingsQuery = () => {
  const [searchParams] = useSearchParams();
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: Services.getSettings,
    select: (data) => ({
      showWidget: parseBoolParam(searchParams.get("showWidget")) ?? data.showWidget,
      nameFormat: parseEnumParam(searchParams.get("nameFormat"), VALID_FORMATS) ?? data.nameFormat,
    }),
  });
};
```

**`select`** — transforms data after it arrives from the API. Runs every time data is accessed.

**Why override in `select` instead of the page?** Every component calling this hook automatically gets URL-overridden values. No prop drilling, no extra `useState`, no `useEffect`. If you override in the page and pass it as a prop, you have to thread it through every component that needs it.

**`?? data.showWidget`** — nullish coalescing: use the right side only if the left is `null` or `undefined`. Priority: URL param → API result.

---

## 6. `helpers/mapItemDtoToRow.ts`

Pure function that transforms API data into table-friendly data.

### Row type (co-located with mapper)

```ts
export type ItemRow = {
  id: number;
  name: string;
  year: string;
  lastActivityDate: string | null;
  homeClass: string;
};
```

**Why define `ItemRow` here (not in `types.ts`)?** `ItemRow` and `mapItemDtoToRow` always change together. If you add a column, you update both. Co-locating them means you always find them together — *"things that change together, live together."*

**`string | null`** — forces every consumer to handle the null case explicitly. TypeScript won't let you call `.toUpperCase()` on `string | null` without a null check first. This prevents runtime crashes.

### Mapper function

```ts
export const mapItemDtoToRow = (dto: ItemDto): ItemRow => ({
  id: dto.StudentNumber,
  name: dto.StudentName,
  year: dto.CurrentYear,
  lastActivityDate: dto.LastActivityDate
    ? dayjs(dto.LastActivityDate).format("DD/MM/YYYY")
    : null,
  homeClass: dto.HomeClass,
});
```

- **Why a separate mapper?** The API shape (PascalCase, ISO dates) differs from what the table needs (camelCase, formatted dates). The mapper is the single translation point. If the backend renames a field, you update only this function.
- **Why a pure function?** No side effects — takes input, returns output. Trivially unit-testable: `expect(mapItemDtoToRow(mockDto)).toEqual(expectedRow)`. No mocking needed.
- **`dto.LastActivityDate ? dayjs(...).format(...) : null`** — ternary: if truthy, format it; otherwise return null.
- **`id: dto.StudentNumber`** — renames from domain-specific `StudentNumber` to generic `id`. TanStack Table uses `id` for row identity.

---

## 7. `helpers/buildEditContext.ts`

Pure function that builds the pre-populated modal context from a DTO.

```ts
export const buildEditContext = (dto: ItemDto): ItemEditContext => ({
  mode: "update",
  studentActivityId: dto.LastActivityId,
  studentId: dto.StudentNumber,
  completedDate: dto.LastActivityDate ? new Date(dto.LastActivityDate) : new Date(),
  notes: "",
  restrictedNotes: false,
});
```

- **`mode: "update"`** — hardcoded because this function is only called when editing. The "create" context is built inline in the reducer with `mode: "create"` and empty defaults.
- **`new Date(dto.LastActivityDate)`** — converts an ISO string to a JavaScript `Date` object. The form's date picker needs a `Date`. `new Date()` (no argument) = today, used as fallback.
- **`notes: ""`** — empty default. The user types their own notes when editing.
- **Why not use the DTO directly in the modal?** The DTO has the API shape (PascalCase, strings for dates). The modal needs the UI shape (camelCase, `Date` objects). This function is the translation layer.

---

## 8. `columns/itemColumns.tsx`

Declarative config for the table. **To add a column, edit only this file.**

### Filterable columns

```ts
export const FILTERABLE_COLUMNS: FilterableColumn[] = [
  { id: "name",      label: "Name",       type: "string", valueType: "text" },
  { id: "year",      label: "Year",       type: "string", valueType: "dropdown" },
  { id: "homeClass", label: "Home Class", type: "string", valueType: "dropdown" },
];
```

`TableFilterBuilder` uses this to know which columns can be filtered and how to render the filter input. `valueType: "text"` → text input. `valueType: "dropdown"` → dropdown populated from actual row values.

### Default column visibility

```ts
export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  homeClass: false,
  studentKey: false,
};
```

Some columns are useful for filtering/export but clutter the default view. Users can show them via the column visibility toggle. `VisibilityState` is TanStack Table's type — a `Record<string, boolean>`.

### Action config types

```ts
export type ActionItem<T> = {
  icon: React.ReactNode;
  label: string;
  onClick: (row: T) => void;
  variant?: "default" | "destructive";
};

export type ActionsConfig<T> = {
  quick?: ActionItem<T>[];
  menu?: (ActionItem<T> | "separator")[];
};
```

**Why declarative config instead of hardcoded buttons?** The column file should not contain business logic. It accepts a config describing the actions and renders them generically. The actual handlers (`onEdit`, `onDelete`) come from the page hook — testable in isolation.

- **`quick`** — icon buttons shown directly in the row. Good for 1–2 primary actions.
- **`menu`** — items in a "⋮" dropdown. Good for 3+ actions.
- **`"separator"`** — a visual divider line in the dropdown.
- **`variant: "destructive"`** — renders the button/item in red, signaling a dangerous action.

### Column builder function

```ts
export const buildItemColumns = (
  { actions }: { actions?: ActionsConfig<ItemRow> } = {}
): ColumnDef<ItemRow>[] => [
  {
    id: "select",
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
        aria-label={`Select row ${row.id}`}
      />
    ),
    size: 1,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <TableHeaderButton label="Name" column={column} />,
    size: 14,
  },
  // ... more columns ...
  ...(actions
    ? [{ id: "actions", cell: ({ row }) => renderActionsCell(row.original, actions) } satisfies ColumnDef<ItemRow>]
    : []),
];
```

- **`= {}`** — default parameter. Called with no arguments → `actions` is `undefined` → no actions column added.
- **`id: "select"`** — no `accessorKey` because this column doesn't display data — it renders a checkbox.
- **`table.getIsAllPageRowsSelected()`** — returns `true` if every row on the current page is checked. Used to show the header "select all" checkbox as checked.
- **`!!v`** — Shadcn's `onCheckedChange` can return `boolean | "indeterminate"`. `!!` normalizes it to `boolean`.
- **`aria-label`** — required for accessibility. Screen readers announce this when the user focuses the checkbox. Without it, the checkbox is announced as just "checkbox" with no context.
- **`size: 1`** — relative size unit. The table normalizes all column sizes to percentages. `1` out of ~100 total ≈ 1% width.
- **`accessorKey: "name"`** — tells TanStack Table to read `row.original.name` for this column. TypeScript checks that `"name"` is a valid key of `ItemRow`.
- **`<TableHeaderButton>`** — shared component that renders a sortable column header. Clicking toggles sort ascending/descending.
- **`...(actions ? [...] : [])`** — conditional spread. If `actions` is provided, add the actions column. If not, spread an empty array (adds nothing).
- **`satisfies ColumnDef<ItemRow>`** — TypeScript operator that checks the object matches the type WITHOUT widening it. Unlike `as ColumnDef<ItemRow>` (which forces the type and hides errors), `satisfies` catches type errors while preserving the inferred type.
- **`row.original`** — TanStack Table wraps your row data in a `Row<T>` object. `.original` gives you back the raw `ItemRow`.

---

## 9. `hooks/useFeaturePage.ts`

**The most important file.** All state and logic lives here. The page component just calls this and renders.

### Modal state type

```ts
type ModalState = {
  modalOpen: boolean;
  editCtx: ItemEditContext | null;
  deleteConfirmOpen: boolean;
};
```

**Why group these three?** They are *coupled* — they always change together. When you open the edit modal, you need `modalOpen: true` AND `editCtx: theItem` at the same time. With separate `useState` calls, there's a risk of a render where `modalOpen` is `true` but `editCtx` is still `null`, causing a crash or flash of wrong UI. `useReducer` guarantees they change atomically in a single dispatch.

### Action union type

```ts
type ModalAction =
  | { type: "OPEN_CREATE" }
  | { type: "OPEN_EDIT"; ctx: ItemEditContext }
  | { type: "CLOSE_MODAL" }
  | { type: "OPEN_DELETE_CONFIRM" }
  | { type: "CLOSE_DELETE_CONFIRM" };
```

**Why a discriminated union?** Each action has a different payload. `OPEN_EDIT` needs `ctx`. `OPEN_CREATE` needs nothing. TypeScript uses the `type` field to narrow the union — inside `case "OPEN_EDIT":`, TypeScript knows `action.ctx` exists. This prevents accessing `action.ctx` in the wrong case.

### The reducer

```ts
const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case "OPEN_CREATE":
      return { ...state, modalOpen: true, editCtx: { mode: "create", studentId: 0, ... } };
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
```

- **Pure function** — `(currentState, action) → newState`. No side effects. Trivially testable.
- **`{ ...state, modalOpen: true }`** — spread creates a new object with all existing fields, then overrides only the specified ones. Never mutate the existing state object directly in React.
- **`default: return state`** — if an unknown action is dispatched, return current state unchanged. Prevents crashes from typos in action types.

### Inside the hook

```ts
const [modal, dispatch] = useReducer(modalReducer, initialModalState);
```

`dispatch({ type: "OPEN_CREATE" })` calls `modalReducer(currentState, { type: "OPEN_CREATE" })` and re-renders with the new state.

```ts
const [serverParams, setServerParams] = useState<GetItemsParams | undefined>(undefined);
```

**Why `useState` here (not `useReducer`)?** `serverParams` is independent — it doesn't change together with any other state. `useState` is simpler and correct for independent values.

`undefined` as initial value means "the user hasn't searched yet". The query hook's `enabled: !!params` uses this to prevent fetching before the user clicks Search.

```ts
const { data: studentsResponse, isLoading, isFetching, isError } = useGetItems(serverParams);
```

- **`data: studentsResponse`** — destructuring with rename. `data` is React Query's name; we rename it to be more descriptive.
- **`isLoading`** — `true` during the very first fetch (no cached data yet). Used to show a skeleton.
- **`isFetching`** — `true` during ANY fetch, including background refetches. Used to show a spinner overlay.
- **`isError`** — `true` if the last fetch failed. Used to show an error message.

```ts
const rows = useMemo<ItemRow[]>(
  () => items.map(mapItemDtoToRow),
  [items],
);
```

**Why `useMemo`?** `.map()` creates a new array every time it runs. Without `useMemo`, a new `rows` array would be created on every render — even renders caused by unrelated state changes (like the user typing in the search box). This causes the table to re-render unnecessarily. `useMemo` caches the result and only recomputes when `items` changes.

**`[items]`** — the dependency array. `useMemo` only re-runs when `items` changes reference.

```ts
const handleEdit = useCallback((itemId: number) => {
  const dto = items.find((item) => item.StudentNumber === itemId);
  if (!dto) return;
  dispatch({ type: "OPEN_EDIT", ctx: buildEditContext(dto) });
}, [items]);
```

**Why `useCallback`?** `handleEdit` is passed as a prop to `<ItemTable>`. Without `useCallback`, a new function reference is created on every render, causing `<ItemTable>` to re-render even when nothing relevant changed. `useCallback` caches the function and only creates a new one when `items` changes.

**`if (!dto) return`** — defensive guard. If the item is not found (shouldn't happen, but defensive programming), do nothing instead of crashing.

### Return object

```ts
return {
  rows,
  yearOptions,
  isLoading,
  isFetching,
  isError,
  hasSearched: !!serverParams,
  modalOpen: modal.modalOpen,
  editCtx: modal.editCtx,
  deleteConfirmOpen: modal.deleteConfirmOpen,
  handleServerSearch,
  handleCreate,
  handleEdit,
  handleCloseModal,
  handleOpenDeleteConfirm,
  handleCloseDeleteConfirm,
};
```

**Why return an object (not an array)?** Named properties are self-documenting and order-independent. The page component destructures only what it needs:

```ts
const { rows, isLoading, modalOpen, handleCreate, handleEdit } = useFeaturePage();
```

If you returned an array like `useState` does, callers would have to remember the exact position of each value — fragile and unreadable.

**`hasSearched: !!serverParams`** — derived boolean. The page uses this to decide whether to show `<StatusPlaceholder>` ("Search to see results") or the actual table. Derived values belong in the hook, not in the page component.

---

*Continue in `crud-v4-blueprint-details-part2.md` →*
