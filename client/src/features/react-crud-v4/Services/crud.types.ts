// ============================================================================
// CRUD Standard — Domain Types
// These are the UI-facing types used throughout any CRUD feature.
//
// Zod schema validates form values before submission. The type is inferred
// from the schema so there is a single source of truth.
//
// Structure mirrors v3 NZAMP student summary rows and activity forms.
// ============================================================================

import { z } from "zod";

/** Shape used to pre-populate the modal for create or edit. */
export type ItemEditContext = {
  mode: "create" | "update";
  studentActivityId?: number;
  studentId: number;
  studentKey: string;
  activityId: number;
  completedDate: Date;
  completedBy: number;       // StaffID
  completedByCode?: string;
  notes: string;
  restrictedNotes: boolean;
};

/** Zod schema for form validation — single source of truth for rules. */
export const ItemFormSchema = z.object({
  activityId: z
    .string({ required_error: "Activity is required" })
    .min(1, "Activity is required"),
  completedDate: z
    .date({ required_error: "Date is required" })
    .refine((d) => d <= new Date(), "Date cannot be in the future"),
  completedBy: z
    .number({ required_error: "Completed By is required" })
    .min(1, "Completed By is required"),
  notes: z.string().default(""),
  restrictedNotes: z.boolean().default(false),
});

/** Form values managed by react-hook-form inside the modal. */
export type ItemFormValues = z.infer<typeof ItemFormSchema>;
