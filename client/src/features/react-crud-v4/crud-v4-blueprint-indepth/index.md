# CRUD v4 — In-Depth Learning Guide

> **This is the holy bible for React development in this codebase.**
> Written for someone with zero React experience who wants to become an expert fast.
> Every chapter uses **real code from `react-crud-v4/`** — not made-up examples.
> Each line is explained: what it does, why it exists, what breaks without it, and what best practice it follows.

---

## How to Use This Guide

**If you are brand new to React:** Read chapters 1 → 10 in order. Each chapter builds on the previous.

**If you are implementing a new feature:** Use this as a reference. Jump to the chapter for the file you are working on.

**If something is broken:** Check chapter 10 (Common Mistakes) first.

---

## Chapters

| # | File | What You Will Learn |
|---|---|---|
| [01](./01-mental-model.md) | Architecture | How all the pieces fit together, why each layer exists, the data flow from server to screen |
| [02](./02-dtos-and-zod.md) | `Services/crud.dtos.ts` | Zod schemas, runtime validation, `z.infer`, why TypeScript alone is not enough |
| [03](./03-types-and-forms.md) | `Services/crud.types.ts` | `ItemEditContext`, `ItemFormSchema`, discriminated unions, form validation with Zod |
| [04](./04-services.md) | `Services/crud.services.ts` | HTTP calls, `apiClient`, `zodParse`, `async`/`await`, Axios, separation of concerns |
| [05](./05-react-query.md) | `Services/crud.queries.ts` | `useQuery`, `useMutation`, query keys, `staleTime`, cache invalidation, `enabled`, `select` |
| [06](./06-mapper-and-context.md) | `helpers/` | Pure functions, `mapItemDtoToRow`, `buildEditContext`, why co-location matters |
| [07](./07-columns.md) | `columns/itemColumns.tsx` | TanStack Table column defs, `buildItemColumns`, `ActionsConfig`, `FILTERABLE_COLUMNS`, `satisfies` |
| [08](./08-page-hook.md) | `hooks/useCrudPage.ts` | `useReducer`, `useMemo`, `useCallback`, discriminated unions, the orchestrator hook pattern |
| [09](./09-components.md) | `components/` + `Crud.page.tsx` + `Crud.module.tsx` | Page, Table, Modal, Form, DeleteConfirmModal, StatusPlaceholder, lazy loading |
| [10](./10-mistakes-and-glossary.md) | — | 12 common mistakes with before/after fixes, best practices checklist, full glossary |

---

## Quick Reference — React Hooks Used in This Codebase

| Hook | Where Used | Purpose |
|---|---|---|
| `useState` | `ItemTable`, `Crud.page` | Simple independent local state |
| `useReducer` | `useCrudPage` | Coupled state that changes together atomically |
| `useMemo` | `useCrudPage`, `ItemTable` | Cache expensive computations, stable references |
| `useCallback` | `useCrudPage`, `ItemModal` | Stable function references to prevent child re-renders |
| `useEffect` | `ItemModal` | Sync form state when modal opens/context changes |
| `useRef` | `ItemModal` | Store focus target without triggering re-renders |
| `useQuery` | `crud.queries.ts`, `ItemForm` | Fetch + cache server data |
| `useMutation` | `crud.queries.ts`, `ItemModal` | POST/PUT/DELETE with success/error callbacks |
| `useQueryClient` | `crud.queries.ts` | Invalidate cache after mutations |
| `useForm` | `ItemModal` | Create form instance with Zod validation |
| `useFormContext` | `ItemForm` | Read form instance from `FormProvider` context |
| `useReactTable` | `ItemTable` | Create TanStack Table instance |
| `useSearchParams` | `crud.queries.ts` (URL override pattern) | Read URL query params |

---

## Quick Reference — File Responsibilities

```
react-crud-v4/
├── Services/
│   ├── crud.dtos.ts     → API shapes only. Zod schemas + inferred types. No UI.
│   ├── crud.services.ts → HTTP calls only. One function per endpoint. No React.
│   ├── crud.queries.ts  → React Query hooks. Caching, loading, error, invalidation.
│   └── crud.types.ts    → UI types: ItemEditContext, ItemFormSchema, ItemFormValues.
├── helpers/
│   ├── mapItemDtoToRow.ts  → ItemRow type + DTO→Row mapper. Pure function. Co-located.
│   └── buildEditContext.ts → DTO → edit context. Pure function.
├── columns/
│   └── itemColumns.tsx  → Column defs, DEFAULT_COLUMN_VISIBILITY, FILTERABLE_COLUMNS.
├── hooks/
│   └── useCrudPage.ts   → All state + handlers. useReducer + useMemo + useCallback.
├── components/
│   ├── ItemTable.tsx         → TanStack Table rendering. Local UI state only.
│   ├── ItemModal.tsx         → Dialog + useForm + FormProvider + submit logic.
│   ├── ItemForm.tsx          → Form fields. useFormContext + Controller. Self-fetches data.
│   ├── DeleteConfirmModal.tsx → Confirm dialog. Promise.allSettled for multi-delete.
│   └── StatusPlaceholder.tsx → Empty/error/loading states. WCAG aria-live.
├── Crud.page.tsx   → Orchestrator. Calls useCrudPage. Renders children. Zero logic.
└── Crud.module.tsx → Lazy-load boundary. Routes. React.lazy + Suspense.
```

---

## The Golden Rules (memorise these)

1. **Each file has one job.** If a file is doing two jobs, split it.
2. **Components fetch their own data.** Never prop-drill query results down from the page.
3. **URL param overrides go in `select`.** Never in the page hook or as props.
4. **Coupled state uses `useReducer`.** Independent state uses `useState`.
5. **Types are always derived from Zod schemas** via `z.infer`. Never written manually.
6. **Handlers passed as props use `useCallback`.** Computed values use `useMemo`.
7. **Multi-delete uses `Promise.allSettled`.** Never `Promise.all`.
8. **The page component contains zero business logic.** It only calls the hook and renders.
9. **`ItemRow` is co-located with its mapper.** They always change together.
10. **Never deviate from this blueprint without explicit approval and documentation.**

---

*Start reading: [Chapter 1 — Mental Model](./01-mental-model.md)*
