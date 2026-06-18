// ============================================================================
// CRUD Standard — Page Component
// This is the orchestrator. It calls the hook and renders child components.
// No business logic, no state management — just layout and wiring.
// ============================================================================

import { useCallback, useState } from "react";

import { PageContent, PageTitle, SingleColumnPage } from "@/components/layouts/v1/SingleColumnPage.layout";

import { useCrudPage } from "./hooks/useCrudPage";
import { ItemTable } from "./components/ItemTable";
import { ItemModal } from "./components/ItemModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";

const CrudPage = () => {
  const {
    rows,
    yearOptions,
    isLoading,
    isFetching,
    isError,
    hasSearched,
    modalOpen,
    editCtx,
    deleteConfirmOpen,
    handleServerSearch,
    handleCreate,
    handleEdit,
    handleCloseModal,
    handleOpenDeleteConfirm,
    handleCloseDeleteConfirm,
  } = useCrudPage();

  // Track which IDs are pending deletion (supports both row-action and multi-select)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);

  const handleDeleteSelected = useCallback(
    (ids: number[]) => {
      setPendingDeleteIds(ids);
      handleOpenDeleteConfirm();
    },
    [handleOpenDeleteConfirm],
  );

  const handleDeleteCompleted = useCallback(() => {
    setPendingDeleteIds([]);
  }, []);

  return (
    <SingleColumnPage windowTitle="CRUD: Items">
      <PageTitle>CRUD: Items</PageTitle>

      <PageContent>
        {/* Table — error renders inside, search filters always visible */}
        <ItemTable
          rows={rows}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          hasSearched={hasSearched}
          yearOptions={yearOptions}
          onServerSearch={handleServerSearch}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDeleteSelected={handleDeleteSelected}
        />

        {/* Create / Edit Modal */}
        {editCtx && (
          <ItemModal
            open={modalOpen}
            onClose={handleCloseModal}
            editCtx={editCtx}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          open={deleteConfirmOpen}
          onClose={handleCloseDeleteConfirm}
          selectedIds={pendingDeleteIds}
          onDeleted={handleDeleteCompleted}
        />
      </PageContent>
    </SingleColumnPage>
  );
};

export default CrudPage;
