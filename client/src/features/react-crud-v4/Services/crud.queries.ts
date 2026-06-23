// ============================================================================
// CRUD Standard — React Query Hooks
// One hook per API operation. Mutations invalidate the list query on success.
//
// Mirrors the v3 NZAMP query patterns (query keys, invalidation, toasts).
// ============================================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

import {
  getItems,
  getCategories,
  getYears,
  createItem,
  updateItem,
  deleteItem,
  type GetItemsParams,
} from "./crud.services";
import type {
  GetItemsResponse,
  GetCategoriesResponse,
  GetYearsRetrieveResponse,
  CreateItemRequest,
  CreateItemResponse,
  UpdateItemRequest,
  UpdateItemResponse,
  DeleteItemRequest,
} from "./crud.dtos";

// ── Query Keys (single source of truth) ─────────────────────────────────────

const QUERY_KEYS = {
  items: ["getStudentsAttendanceSummary"] as const,
  categories: ["getResponseActivities"] as const,
  years: ["getYearsRetrieve"] as const,
};

// ── READ ────────────────────────────────────────────────────────────────────

export const useGetItems = (params?: GetItemsParams) =>
  useQuery<GetItemsResponse, AxiosError>({
    queryKey: [...QUERY_KEYS.items, params],
    queryFn: () => getItems(params),
    enabled: !!params,
  });

export const useGetCategories = () =>
  useQuery<GetCategoriesResponse, AxiosError>({
    queryKey: [...QUERY_KEYS.categories],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000, // categories rarely change
  });

export const useGetYears = () =>
  useQuery<GetYearsRetrieveResponse, AxiosError>({
    queryKey: [...QUERY_KEYS.years],
    queryFn: getYears,
    staleTime: 10 * 60 * 1000, // years rarely change
  });

// ── CREATE ──────────────────────────────────────────────────────────────────

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

// ── UPDATE ──────────────────────────────────────────────────────────────────

export const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateItemResponse, AxiosError, UpdateItemRequest>({
    mutationFn: updateItem,
    onSuccess: async () => {
      toast.success("Activity updated.");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
    },
    onError: () => {
      toast.error("Unable to update activity. Please try again.");
    },
  });
};

// ── DELETE ───────────────────────────────────────────────────────────────────

export const useDeleteItem = (options?: { onDeleted?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, DeleteItemRequest>({
    mutationFn: deleteItem,
    onSuccess: async () => {
      toast.success("Activity deleted.");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items });
      options?.onDeleted?.();
    },
    onError: () => {
      toast.error("Unable to delete activity. Please try again.");
    },
  });
};
