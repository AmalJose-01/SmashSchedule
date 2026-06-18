# CRUD v4 Blueprint — Detailed Guide (Part 2 of 2)

> Continues from `crud-v4-blueprint-details-part1.md`.
> Covers: `page.tsx`, `ItemTable`, `ItemModal`, `ItemForm`, `DeleteConfirmModal`, `StatusPlaceholder`, `module.tsx`, common mistakes, glossary.

---

## 10. `Feature.page.tsx`

The orchestrator. Calls the hook, renders children, contains zero business logic.

```tsx
export default function CrudPage() {
  const {
    rows, yearOptions, isLoading, isFetching, isError, hasSearched,
    modalOpen, editCtx, deleteConfirmOpen,
    handleServerSearch, handleCreate, handleEdit,
    handleCloseModal, handleOpenDeleteConfirm, handleCloseDeleteConfirm,
  } = useCrudPage();

  return (
    <PageLayout>
      <PageHeader title="Students" onAdd={handleCreate} addLabel="Record Activity" />
      {!hasSearched ? (
        <StatusPlaceholder status="search" message="Select filters and click Search." />
      ) : isError ? (
        <StatusPlaceholder status="error" message="Failed to load students." />
      ) : (
        <ItemTable
          rows={rows} yearOptions={yearOptions}
          isLoading={isLoading} isFetching={isFetching}
          onEdit={handleEdit} onDeleteSelected={handleOpenDeleteConfirm}
          onSearch={handleServerSearch}
        />
      )}
      <ItemModal open={modalOpen} editCtx={editCtx} onClose={handleCloseModal} />
      <DeleteConfirmModal open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm} />
    </PageLayout>
  );
}
```

**Why is the page so thin?** The page has one job: layout and conditional rendering. All logic is in `useCrudPage`. This means the hook is testable without rendering UI, and the page is readable at a glance.

**Conditional rendering order** — evaluated top to bottom:
1. User hasn't searched yet → show "Search to see results"
2. Last fetch failed → show error message
3. Otherwise → show the table (which handles its own loading state internally)

**`<ItemModal>` and `<DeleteConfirmModal>` are always rendered** — not inside the conditional. They are always in the DOM but controlled by the `open` prop. This preserves closing animations. If you conditionally rendered them, the animation would be cut off.

---

## 11. `components/ItemTable.tsx`

Handles rendering only. Manages its own local UI state (sort, search, pagination, column visibility, column filters). Receives data and handlers as props.

### TanStack Table setup

```tsx
const table = useReactTable({
  data: rows,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  onGlobalFilterChange: setGlobalFilter,
  onColumnVisibilityChange: setColumnVisibility,
  onRowSelectionChange: setRowSelection,
  filterFns: {
    filterBuilder: (row, id, val) => filterBuilderFn(row, id, val, FILTERABLE_COLUMNS),
  },
  defaultColumn: { filterFn: "filterBuilder" },
  state: { sorting, columnFilters, globalFilter, columnVisibility, rowSelection, pagination },
  initialState: {
    columnVisibility: DEFAULT_COLUMN_VISIBILITY,
    pagination: { pageSize: 20 },
  },
});
```

- **`getCoreRowModel()`** — required. Processes raw data into TanStack Table's internal row model.
- **`getSortedRowModel()`** — enables client-side sorting. Without this, clicking column headers does nothing.
- **`getFilteredRowModel()`** — enables client-side filtering (global search + column filters).
- **`getPaginationRowModel()`** — enables client-side pagination.
- **`onSortingChange: setSorting`** — when the user clicks a column header, TanStack Table calls this. The `state: { sorting }` feeds it back in, completing the controlled state loop.
- **`filterFns: { filterBuilder: ... }`** — registers the custom filter function from `TableFilterBuilder`. Without this, the filter builder's tags have no effect.
- **`defaultColumn: { filterFn: "filterBuilder" }`** — applies the custom filter to all columns by default.
- **`initialState`** — sets starting state without making it controlled. `DEFAULT_COLUMN_VISIBILITY` hides cluttering columns. `pageSize: 20` shows 20 rows initially.

### Local state — why not in the page hook?

```tsx
const [sorting, setSorting] = useState<SortingState>([]);
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
const [globalFilter, setGlobalFilter] = useState("");
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
const [rowSelection, setRowSelection] = useState({});
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
```

These are pure UI concerns — sort order, search text, current page. They don't affect any other component. Keeping them local means the page hook stays clean and focused on server state and business logic.

### Columns memo

```tsx
const columns = useMemo(
  () => buildItemColumns({
    actions: {
      quick: [{ icon: <PencilIcon />, label: "Edit", onClick: (row) => onEdit(row.id) }],
      menu: [{ icon: <TrashIcon />, label: "Delete", onClick: () => onDeleteSelected(selectedIds), variant: "destructive" }],
    },
  }),
  [onEdit, onDeleteSelected, selectedIds],
);
```

**Why `useMemo`?** `buildItemColumns(...)` creates a new array every time it runs. Without `useMemo`, TanStack Table receives a new `columns` reference on every render, causing it to re-initialize — resetting sort, filters, and pagination. `useMemo` caches the columns and only rebuilds when handlers or selected IDs change.

### Table rendering

```tsx
<Table className="table-fixed w-full">
  <TableHeader>
    {table.getHeaderGroups().map((hg) => (
      <TableRow key={hg.id}>
        {hg.headers.map((header) => (
          <TableHead key={header.id} style={{ width: `${header.column.columnDef.size}%` }}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </TableHead>
        ))}
      </TableRow>
    ))}
  </TableHeader>
  <TableBody>
    {table.getRowModel().rows.map((row) => (
      <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

- **`table-fixed`** — CSS table layout mode. Column widths are fixed by the `width` style, not by content. Without this, columns resize based on content, causing layout shifts as data loads.
- **`style={{ width: \`${size}%\` }}`** — applies the percentage width from the column definition.
- **`flexRender(...)`** — TanStack Table's utility that renders either a React component or a plain value. Column `header` and `cell` can be functions or strings — `flexRender` handles both.
- **`table.getRowModel().rows`** — returns only the rows for the current page (after sorting, filtering, and pagination).
- **`data-state="selected"`** — Shadcn's `TableRow` applies a highlight style when this attribute is set. This is how selected rows get a visual highlight.

### Pagination

```tsx
<TablePaginationMobileFriendly
  pageCount={table.getPageCount()}
  currentPage={table.getState().pagination.pageIndex + 1}
  onPageChange={(p) => table.setPageIndex(p - 1)}
  totalItems={table.getFilteredRowModel().rows.length}
/>
```

- **`pageIndex + 1`** — TanStack Table uses 0-based indexes. The component displays 1-based numbers. Add 1 for display, subtract 1 when setting.
- **`table.getFilteredRowModel().rows.length`** — filtered row count (not raw data length). If filters are applied, shows the filtered count.

---

## 12. `components/ItemModal.tsx`

A dialog that wraps the form. Owns the `useForm` instance and provides it to child components via `FormProvider`.

```tsx
const form = useForm<ItemFormValues>({
  resolver: zodResolver(ItemFormSchema),
  defaultValues: editCtx
    ? { activityId: String(editCtx.activityId), completedDate: editCtx.completedDate, notes: editCtx.notes, restrictedNotes: editCtx.restrictedNotes }
    : { activityId: "", completedDate: new Date(), notes: "", restrictedNotes: false },
});
```

- **`resolver: zodResolver(ItemFormSchema)`** — connects Zod validation to React Hook Form. On submit, RHF runs the Zod schema. If validation fails, RHF populates `formState.errors` and does NOT call `onSubmit`.
- **`defaultValues`** — pre-populates the form. If `editCtx` is provided (editing), use context values. If not (creating), use empty defaults. Without `defaultValues`, all fields start as `undefined`, causing uncontrolled-to-controlled warnings.

### Why `useForm` lives in the modal (not the page hook)

The form instance must be created inside a React component. The modal is the right place because:
1. Form state (dirty fields, errors) is local to the modal — the page doesn't need it.
2. When the modal closes and re-opens, the form should reset — this happens naturally with new `editCtx`.

### The `useEffect` reset

```tsx
useEffect(() => {
  if (open) {
    form.reset(editCtx ? { ... } : { activityId: "", completedDate: new Date(), ... });
  }
}, [open, editCtx]);
```

`defaultValues` is only applied on the first render. `form.reset(...)` inside `useEffect` re-populates the form every time `open` or `editCtx` changes. Without this, editing item A, closing, then editing item B would show item A's data.

### Submit handler

```tsx
const onSubmit = async (values: ItemFormValues) => {
  if (editCtx?.mode === "update") {
    await updateMutation.mutateAsync({ studentActivityId: editCtx.studentActivityId!, activityId: Number(values.activityId), completedDate: dayjs(values.completedDate).format("YYYY-MM-DD"), notes: values.notes });
  } else {
    await createMutation.mutateAsync({ studentId: editCtx!.studentId, activityId: Number(values.activityId), completedDate: dayjs(values.completedDate).format("YYYY-MM-DD"), notes: values.notes });
  }
  onClose();
};
```

- **`values: ItemFormValues`** — RHF passes validated, typed form values. These have already passed Zod validation — you can trust their types.
- **`mutateAsync`** — returns a Promise. We `await` it so `onClose()` only runs after the mutation succeeds. If the mutation fails, `onError` shows a toast and `onClose()` is NOT called — the modal stays open.
- **`dayjs(...).format("YYYY-MM-DD")`** — converts `Date` back to ISO string for the API.
- **`Number(values.activityId)`** — Shadcn's Select returns strings. We convert to number for the API.

### `FormProvider`

```tsx
<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
  <DialogContent>
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ItemForm editCtx={editCtx} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {editCtx?.mode === "update" ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  </DialogContent>
</Dialog>
```

- **`<FormProvider {...form}>`** — spreads all form methods into React Context. Child components call `useFormContext()` to access the form without prop drilling.
- **`onOpenChange={(o) => !o && onClose()}`** — Shadcn's Dialog calls `onOpenChange(false)` when the user presses Escape or clicks outside. `!o && onClose()` means "if the dialog is closing, call `onClose`".
- **`form.handleSubmit(onSubmit)`** — RHF's submit handler. Runs validation first. If validation passes, calls `onSubmit(values)`. If validation fails, populates `formState.errors` and does NOT call `onSubmit`.
- **`disabled={...isPending}`** — disables the submit button while the mutation is in flight. Prevents double-submits.

---

## 13. `components/ItemForm.tsx`

Renders the form fields. Uses `useFormContext` to access the form — no props needed for form state.

```tsx
export function ItemForm({ editCtx }: { editCtx: ItemEditContext | null }) {
  const { control } = useFormContext<ItemFormValues>();
  const { data: activities } = useGetCategories();

  return (
    <FormField
      control={control}
      name="activityId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Activity</FormLabel>
          <FormControl>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Select activity..." /></SelectTrigger>
              <SelectContent>
                {activities?.map((a) => (
                  <SelectItem key={a.ActivityId} value={String(a.ActivityId)}>{a.ActivityName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

- **`useFormContext`** — reads the form instance from `FormProvider` context. No prop drilling needed.
- **`useGetCategories()` inside the form** — `ItemForm` fetches its own dropdown data. React Query returns cached data instantly — no extra network request. The page hook does NOT fetch categories and pass them down as props.
- **`<FormField>` / `Controller`** — Shadcn's `Select`, `Checkbox`, `DatePicker` are not standard HTML inputs — they don't work with RHF's `register()`. `Controller` (via `FormField`) provides a `value`/`onChange` interface that works with any custom component.
- **`render: ({ field }) => ...`** — `field` contains `value`, `onChange`, `onBlur`, `ref`. You use these on the input component.
- **`<FormMessage />`** — renders the validation error message for this field. If there's no error, renders nothing.

---

## 14. `components/DeleteConfirmModal.tsx`

Handles single and multi-row deletion with a confirmation dialog.

```tsx
const handleConfirm = async () => {
  if (selectedRows.length === 1) {
    await deleteMutation.mutateAsync({ studentActivityId: selectedRows[0].studentActivityId });
  } else {
    const results = await Promise.allSettled(
      selectedRows.map((row) => deleteMutation.mutateAsync({ studentActivityId: row.studentActivityId }))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) toast.error(`${failed} deletion(s) failed.`);
  }
  onClose();
};
```

**Why `Promise.allSettled` instead of `Promise.all`?**

- **`Promise.all`** — if ANY deletion fails, it immediately rejects and the rest are cancelled. Delete 5 items, item 3 fails → items 4 and 5 are never deleted.
- **`Promise.allSettled`** — waits for ALL deletions regardless of success or failure. Each result is `{ status: "fulfilled" }` or `{ status: "rejected" }`. You count failures and show a specific error: "2 of 5 deletions failed." Partial success is better than no success.

---

## 15. `components/StatusPlaceholder.tsx`

A reusable component for empty/loading/error/search states.

```tsx
export function StatusPlaceholder({ status, message }: StatusPlaceholderProps) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-16 gap-4">
      {icons[status]}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
```

- **`role="status"`** — WCAG accessibility. Tells screen readers this region contains status information.
- **`aria-live="polite"`** — tells screen readers to announce the content when it changes, but wait until the user is idle. Without this, screen reader users would not know the page state changed.
- **Why a shared component?** Without it, every feature implements its own empty state with slightly different styling. A shared component ensures consistency and means accessibility fixes are applied everywhere at once.

---

## 16. `Feature.module.tsx`

The entry point for the feature. Handles routing and code splitting.

```tsx
// Feature.module.tsx
export default function CrudModule() {
  return (
    <Routes>
      <Route index element={<CrudPage />} />
    </Routes>
  );
}

// main.tsx
const CrudModule = React.lazy(() => import("./features/react-crud-v4/Crud.module"));

{
  path: "crud/*",
  element: (
    <Suspense fallback={<LoadingIndicator type="bar" size="sm" />}>
      <CrudModule />
    </Suspense>
  ),
}
```

### `React.lazy`

Defers loading the module's JavaScript bundle until the user navigates to that route. Without lazy loading, ALL feature code is bundled into one large file that the user must download before seeing anything. With lazy loading, each feature is a separate chunk downloaded on demand — faster initial page load.

### `<Suspense fallback={...}>`

While the lazy module is downloading, React renders the `fallback`. Without `<Suspense>`, React throws an error when it encounters a lazy component that hasn't loaded yet.

### `path: "crud/*"` and `<Route index>`

The `*` in the parent route means "match anything after `/crud/`". The module's `<Route index>` matches `/crud/` exactly. This pattern allows features to define their own internal routing without the parent knowing about it. To add a detail page, add `<Route path="detail/:id" element={<DetailPage />} />` inside the module — no changes to `main.tsx` needed.

### Why a separate module file?

The module file is the **lazy-load boundary**. Everything imported by `Crud.module.tsx` is included in the lazy chunk. If `main.tsx` imported `CrudPage` directly (without lazy), it would be in the main bundle. The module file is intentionally thin — only routing. All real code is in `Crud.page.tsx` and its children.

---

## 17. Common Mistakes

### ❌ Fetching data in the page and passing it as props

```tsx
// WRONG
function CrudPage() {
  const { data: activities } = useGetCategories();
  return <ItemForm activities={activities} />;
}

// CORRECT — ItemForm fetches its own data
function ItemForm() {
  const { data: activities } = useGetCategories(); // cached, no extra request
}
```

React Query caches by query key. Calling `useGetCategories()` in `ItemForm` returns cached data instantly — no extra network request. Prop-drilling adds complexity with no benefit.

### ❌ Putting business logic in the page component

```tsx
// WRONG — untestable without rendering
function CrudPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const handleEdit = (id) => { /* ... */ };
}

// CORRECT — testable with renderHook
function CrudPage() {
  const { modalOpen, handleEdit } = useCrudPage();
}
```

### ❌ Writing TypeScript types manually instead of using `z.infer`

```ts
// WRONG — can drift from schema
const ItemDtoSchema = z.object({ StudentName: z.string() });
type ItemDto = { StudentName: string }; // duplicated

// CORRECT — always in sync
type ItemDto = z.infer<typeof ItemDtoSchema>;
```

### ❌ Using `Promise.all` for multi-delete

```ts
// WRONG — one failure cancels all
await Promise.all(ids.map((id) => deleteMutation.mutateAsync({ id })));

// CORRECT — all run, failures are counted
const results = await Promise.allSettled(ids.map((id) => deleteMutation.mutateAsync({ id })));
```

### ❌ Not using `useCallback` on handlers passed as props

```tsx
// WRONG — new function reference every render → child re-renders unnecessarily
const handleEdit = (id: number) => { dispatch({ type: "OPEN_EDIT", ... }); };

// CORRECT — stable reference
const handleEdit = useCallback((id: number) => { dispatch({ type: "OPEN_EDIT", ... }); }, [items]);
```

### ❌ Not using `useMemo` on the columns array

```tsx
// WRONG — TanStack Table re-initializes every render, resets sort/filters
const columns = buildItemColumns({ actions: { ... } });

// CORRECT
const columns = useMemo(() => buildItemColumns({ actions: { ... } }), [onEdit, onDelete]);
```

### ❌ Overriding URL params in the page hook instead of `select`

```ts
// WRONG — only the page hook gets the override; other consumers don't
const showWidget = params.get("showWidget") ?? settings?.showWidget;

// CORRECT — all consumers of the hook get the override automatically
useQuery({ select: (data) => ({ showWidget: parseBoolParam(params.get("showWidget")) ?? data.showWidget }) });
```

### ❌ Forgetting `enabled: !!params` on search-triggered queries

```ts
// WRONG — fires immediately on page load with no filters
useQuery({ queryKey: [...QUERY_KEYS.items, params], queryFn: () => getItems(params) });

// CORRECT — only fires after the user clicks Search
useQuery({ queryKey: [...QUERY_KEYS.items, params], queryFn: () => getItems(params), enabled: !!params });
```

---

## 18. Glossary

| Term | Meaning |
|---|---|
| **DTO** | Data Transfer Object — the exact shape of data from the server (PascalCase, raw types) |
| **Row** | Flattened, UI-ready version of a DTO (camelCase, formatted dates, display values) |
| **Edit Context** | Pre-populated data passed to the modal when editing an existing item |
| **Query Key** | Array that uniquely identifies a React Query cache entry |
| **staleTime** | How long React Query considers data "fresh" before re-fetching |
| **Discriminated Union** | A TypeScript union type where a shared field (like `mode`) narrows the type |
| **Pure Function** | A function with no side effects — same input always produces same output |
| **Orchestrator** | A component that wires together other components but contains no business logic |
| **Code Splitting** | Splitting the JS bundle into chunks loaded on demand (via `React.lazy`) |
| **Controlled State** | State managed externally and passed back in (TanStack Table's `state: { sorting }` pattern) |
| **`z.infer`** | Extracts a TypeScript type from a Zod schema — the type is always derived, never written manually |
| **`flexRender`** | TanStack Table utility that renders a column's `header` or `cell` — handles both functions and plain values |
| **`satisfies`** | TypeScript operator that checks a type without widening it — safer than `as` |
| **`Promise.allSettled`** | Runs all Promises and waits for all to complete, regardless of success or failure |
| **`aria-live`** | HTML attribute that tells screen readers to announce content changes |
| **`useMemo`** | React hook that caches a computed value and only recomputes when dependencies change |
| **`useCallback`** | React hook that caches a function reference and only creates a new one when dependencies change |
| **`useReducer`** | React hook for managing coupled state — guarantees atomic updates across multiple fields |
| **`FormProvider`** | React Hook Form context provider — makes the form instance available to all child components |
| **`useFormContext`** | React Hook Form hook — reads the form instance from `FormProvider` context |
| **`Controller`** | React Hook Form component — connects custom (non-HTML) inputs to the form |
