// ============================================================================
// CRUD Standard — DTOs (Data Transfer Objects)
// Shapes that match the API request/response contracts.
// Keep these 1:1 with the backend — never mix UI concerns here.
//
// Zod schemas validate API responses at runtime. Types are inferred from
// schemas so there is a single source of truth — no type/schema drift.
//
// Structure mirrors the NZAMP v3 API contracts so this template can be
// tested against a real backend.
// ============================================================================

import { z } from "zod";

// ── READ (list) ─────────────────────────────────────────────────────────────

export const ItemDtoSchema = z.object({
  StudentName: z.string(),
  StudentKey: z.string(),
  CurrentYear: z.string(),
  StudentNumber: z.number(),
  NSN: z.string(),
  HomeClass: z.string(),
  CoreClass: z.string(),
  House: z.string(),
  HomeRoom: z.string(),
  HomeTeacher: z.string(),
  Dean: z.string(),
  Deputy: z.string(),
  PreviousTermStatusId: z.number(),
  CurrentTermStatusId: z.number(),
  LastThresholdCrossedDate: z.string().nullable(),
  DaysAbsentT1: z.number(),
  DaysAbsentT2: z.number(),
  DaysAbsentT3: z.number(),
  DaysAbsentT4: z.number(),
  DaysAbsentYtd: z.number(),
  LastActivityDate: z.string().nullable(),
  LastActivityId: z.number(),
  LastActivityName: z.string(),
  CurrentTermStatusName: z.string(),
  CurrentTermStatusColor: z.string(),
  PreviousTermStatusName: z.string(),
  PreviousTermStatusColor: z.string(),
});

export const GetItemsResponseSchema = z.array(ItemDtoSchema);

export type GetItemsResponse = z.infer<typeof GetItemsResponseSchema>;
export type ItemDto = z.infer<typeof ItemDtoSchema>;

// ── CATEGORIES / ACTIVITIES (for the dropdown) ──────────────────────────────

export const CategoryDtoSchema = z.object({
  ActivityId: z.number(),
  ActivityName: z.string(),
  GroupId: z.number(),
  EmailTemplate: z.string(),
  TemplateId: z.number(),
  Locked: z.boolean(),
  GroupName: z.string(),
});

export const CategoryGroupDtoSchema = z.object({
  GroupId: z.number(),
  GroupName: z.string(),
});

export const GetCategoriesResponseSchema = z.object({
  ResponseActivities: z.array(CategoryDtoSchema),
  ResponseActivityGroups: z.array(CategoryGroupDtoSchema),
});

export type GetCategoriesResponse = z.infer<typeof GetCategoriesResponseSchema>;
export type CategoryDto = z.infer<typeof CategoryDtoSchema>;
export type CategoryGroupDto = z.infer<typeof CategoryGroupDtoSchema>;

// ── YEARS (server filter dropdown) ───────────────────────────────────────────

export const YearDataSchema = z.object({
  Year: z.string(),
  NumericEquiv: z.string(),
  Includes: z.string(),
  Description: z.string(),
  CurriculumYear: z.string(),
});

export const GetYearsRetrieveResponseSchema = z.object({
  YearList: z.array(YearDataSchema),
});

export type GetYearsRetrieveResponse = z.infer<typeof GetYearsRetrieveResponseSchema>;
export type YearData = z.infer<typeof YearDataSchema>;

// ── CREATE ──────────────────────────────────────────────────────────────────

export type CreateItemRequest = {
  studentIds: number[];
  selectedStudents: { studentId: number; studentKey: string }[];
  activityId: number;
  completedDate: Date;
  completedBy: number;
  notes: string;
  restrictedNotes: boolean;
  tempAttachments: [];
};

export type CreateItemResponse = {
  Items: CreateItemResult[];
};

export type CreateItemResult = {
  StudentId: number;
  StudentActivityId: number;
  StudentKey: string;
};

// ── UPDATE ──────────────────────────────────────────────────────────────────

export type UpdateItemRequest = {
  studentActivityId: number;
  studentId: number;
  studentKey: string;
  activityId: number;
  completedDate: Date;
  completedBy: number;
  notes: string;
  restrictedNotes: boolean;
  tempAttachments: [];
};

export type UpdateItemResponse = {
  studentActivityId: number;
  studentId: number;
  studentKey: string;
};

// ── DELETE ───────────────────────────────────────────────────────────────────

export type DeleteItemRequest = {
  studentActivityId: number;
};
