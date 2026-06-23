// ============================================================================
// CRUD Standard — Delete Confirmation Modal
// Confirms multi-select delete. Shows count of selected items.
//
// Mirrors v3 NZAMP pattern: delete is per-studentActivityId.
// For multi-select, each ID is deleted sequentially.
// ============================================================================

import { useCallback, useState } from "react";
import { toast } from "react-toastify";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/v1/alert-dialog";

import { useDeleteItem } from "../Services/crud.queries";

type DeleteConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  selectedIds: number[];
  onDeleted: () => void;
};

export const DeleteConfirmModal = ({
  open,
  onClose,
  selectedIds,
  onDeleted,
}: DeleteConfirmModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMutation = useDeleteItem({
    onDeleted: () => {
      onClose();
      onDeleted();
    },
  });

  const count = selectedIds.length;
  const label = count === 1 ? "Item" : "Items";

  const handleConfirm = useCallback(async () => {
    if (count === 0) return;

    setIsDeleting(true);
    const results = await Promise.allSettled(
      selectedIds.map((id) => deleteMutation.mutateAsync({ studentActivityId: id })),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.length - failed;

    if (failed === 0) {
      // All succeeded — onDeleted callback handles toast + close via mutation hook
    } else if (succeeded === 0) {
      toast.error(`Unable to delete ${count === 1 ? "item" : `${count} items`}. Please try again.`);
    } else {
      toast.warning(`${succeeded} deleted, ${failed} failed. Please retry the remaining items.`);
    }

    setIsDeleting(false);
  }, [count, selectedIds, deleteMutation]);

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count} {label}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {count === 1 ? "this item" : `these ${count} items`} and
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting || count === 0}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : `Delete ${count} ${label}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
