// ============================================================================
// CRUD Standard — API Service Layer
// Each function maps to exactly one API endpoint.
// No business logic here — just HTTP calls via the shared apiClient.
//
// Endpoints mirror the NZAMP v3 backend so this template works against
// a real API.
// ============================================================================

import apiClient from "@/features/common/API/apiClient";
import { zodParse } from "@/utils/zodParse";
import {
  GetItemsResponseSchema,
  GetCategoriesResponseSchema,
  GetYearsRetrieveResponseSchema,
} from "./crud.dtos";
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

// ── Server filter params ─────────────────────────────────────────────────────

export type GetItemsParams = {
  year?: string;
};

// ── READ ────────────────────────────────────────────────────────────────────

export const getItems = async (params?: GetItemsParams): Promise<GetItemsResponse> => {
  const response = await apiClient.get("/api/NZAMP/GetStudentsAttendanceSummary", { params });
  return zodParse(GetItemsResponseSchema, response.data, "getItems");
};

export const getCategories = async (): Promise<GetCategoriesResponse> => {
  const response = await apiClient.get("/api/NZAMP/GetResponseActivities");
  return zodParse(GetCategoriesResponseSchema, response.data, "getCategories");
};

export const getYears = async (): Promise<GetYearsRetrieveResponse> => {
  const response = await apiClient.post("/masters/GetYearsRetrieve", {});
  return zodParse(GetYearsRetrieveResponseSchema, response.data, "getYears");
};

// ── CREATE ──────────────────────────────────────────────────────────────────

export const createItem = async (payload: CreateItemRequest): Promise<CreateItemResponse> => {
  const response = await apiClient.post<CreateItemResponse>("/api/NZAMP/RecordStudentActivity", payload);
  return response.data;
};

// ── UPDATE ──────────────────────────────────────────────────────────────────

export const updateItem = async (payload: UpdateItemRequest): Promise<UpdateItemResponse> => {
  const response = await apiClient.post<UpdateItemResponse>("/api/NZAMP/UpdateStudentActivity", payload);
  return response.data;
};

// ── DELETE ───────────────────────────────────────────────────────────────────

export const deleteItem = async (payload: DeleteItemRequest): Promise<void> => {
  await apiClient.post("/api/NZAMP/DeleteStudentActivity", payload);
};
