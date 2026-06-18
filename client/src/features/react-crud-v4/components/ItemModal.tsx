// ============================================================================
// CRUD Standard — Item Modal (Create / Edit)
// Wraps ItemForm in a Dialog with react-hook-form's FormProvider.
// Single create or single edit — no bulk operations.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/v1/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/v1/dialog";

import { ItemForm } from "./ItemForm";
import { useCreateItem, useUpdateItem } from "../Services/crud.queries";
import type { CreateItemRequest, UpdateItemRequest } from "../Services/crud.dtos";
import { ItemFormSchema } from "../Services/crud.types";
import type { ItemEditContext, ItemFormValues } from "../Services/crud.types";

type ItemModalProps = {
  open: boolean;
  onClose: () => void;
  editCtx: ItemEditContext;
};

// ── Build default form values from the edit context ─────────────────────────

const buildDefaults = (ctx: ItemEditContext): ItemFormValues => ({
  activityId: ctx.activityId ? String(ctx.activityId) : "",
  completedDate: ctx.completedDate ?? new Date(),
  completedBy: ctx.completedBy || 0,
  notes: ctx.notes ?? "",
  restrictedNotes: !!ctx.restrictedNotes,
});

// ── Build the shared mutation payload from form values (DRY) ────────────────

const buildPayload = (values: ItemFormValues) => ({
  activityId: Number(values.activityId),
  completedDate: values.completedDate,
  completedBy: values.completedBy,
  notes: values.notes,
  restrictedNotes: values.restrictedNotes,
  tempAttachments: [] as [],
});

// ── Component ───────────────────────────────────────────────────────────────

export const ItemModal = ({
  open,
  onClose,
  editCtx,
}: ItemModalProps) => {
  const isEdit = editCtx.mode === "update";
  const triggerRef = useRef<HTMLElement | null>(null);

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();

  const defaultValues = useMemo(() => buildDefaults(editCtx), [editCtx]);

  const methods = useForm<ItemFormValues>({
    resolver: zodResolver(ItemFormSchema),
    defaultValues,
  });
  const { handleSubmit, reset } = methods;

  // Capture the element that triggered the modal so we can return focus
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Reset form when the modal opens or the context changes
  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
  }, [open, reset, defaultValues]);

  // ── Submit ──────────────────────────────────────────────────────────────

  const onSubmit = useCallback(
    (values: ItemFormValues) => {
      const payload = buildPayload(values);

      if (isEdit && editCtx.studentActivityId) {
        const request: UpdateItemRequest = {
          studentActivityId: editCtx.studentActivityId,
          studentId: editCtx.studentId,
          studentKey: editCtx.studentKey,
          ...payload,
        };
        updateMutation.mutate(request, { onSuccess: onClose });
      } else {
        const request: CreateItemRequest = {
          studentIds: [editCtx.studentId],
          selectedStudents: [{ studentId: editCtx.studentId, studentKey: editCtx.studentKey }],
          ...payload,
        };
        createMutation.mutate(request, { onSuccess: onClose });
      }
    },
    [isEdit, editCtx, createMutation, updateMutation, onClose],
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-h-dvh overflow-y-auto"
        onCloseAutoFocus={() => triggerRef.current?.focus()}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Item" : "Create Item"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the item details." : "Fill in the details to create a new item."}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <ItemForm
              isSubmitting={isSubmitting}
              completedByCode={isEdit ? editCtx.completedByCode : undefined}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
