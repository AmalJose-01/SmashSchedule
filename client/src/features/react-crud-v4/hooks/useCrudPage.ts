// ============================================================================
// CRUD Standard — Page Hook
// All state, handlers, and derived data for the page live here.
// The page component only calls this hook and renders JSX.
// ============================================================================

import { useCallback, useMemo, useReducer, useState } from "react";

import { useGetItems, useGetYears } from "../Services/crud.queries";
import type { GetItemsParams } from "../Services/crud.services";
import { mapItemDtoToRow } from "../helpers/mapItemDtoToRow";
import { buildEditContext } from "../helpers/buildEditContext";
import type { ItemRow } from "../helpers/mapItemDtoToRow";
import type { ItemEditContext } from "../Services/crud.types";
import type { ItemDto } from "../Services/crud.dtos";

// ── Reducer ─────────────────────────────────────────────────────────────────

type ModalState = {
  modalOpen: boolean;
  editCtx: ItemEditContext | null;
  deleteConfirmOpen: boolean;
};

type ModalAction =
  | { type: "OPEN_CREATE" }
  | { type: "OPEN_EDIT"; ctx: ItemEditContext }
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
          studentId: 0,
          studentKey: "",
          activityId: 0,
          completedDate: new Date(),
          completedBy: 0,
          notes: "",
          restrictedNotes: false,
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

export const useCrudPage = () => {
  const [modal, dispatch] = useReducer(modalReducer, initialModalState);

  // ── Server filter state ──────────────────────────────────────────────────
  const [serverParams, setServerParams] = useState<GetItemsParams | undefined>(undefined);

  // ── Data fetching ───────────────────────────────────────────────────────
  const { data: itemsResponse, isLoading, isFetching, isError } = useGetItems(serverParams);
  const { data: yearsResponse } = useGetYears();

  const items = useMemo<ItemDto[]>(() => itemsResponse ?? [], [itemsResponse]);
  const rows = useMemo<ItemRow[]>(() => items.map(mapItemDtoToRow), [items]);

  const yearOptions = useMemo<string[]>(
    () => yearsResponse?.YearList.map((y) => y.Year).filter((yr) => yr !== "") ?? [],
    [yearsResponse],
  );

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleServerSearch = useCallback((params: GetItemsParams) => {
    setServerParams(params);
  }, []);

  const handleCreate = useCallback(() => {
    dispatch({ type: "OPEN_CREATE" });
  }, []);

  const handleEdit = useCallback(
    (itemId: number) => {
      const dto = items.find((i) => i.StudentNumber === itemId);
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
    yearOptions,
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
