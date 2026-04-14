import Navbar from "../../../components/Navbar.jsx";
import { useAdminMembersList } from "../hooks/useAdminMembersList.js";
import FilterBar from "../components/FilterBar.jsx";
import MembersTable from "../components/MembersTable.jsx";
import EditMemberModal from "../components/EditMemberModal.jsx";
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
import "./AdminMembersList.css";

const AdminMembersList = () => {
  const {
    members,
    pagination,
    isLoading,
    searchTerm,
    statusFilter,
    currentPage,
    setCurrentPage,
    editingMember,
    deletingMember,
    isDeleting,
    isUpdating,
    handleStatusFilter,
    handleSearch,
    handleEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteConfirm,
    handleCancelDelete,
    handleDelete,
    getStatusColor,
    getStatusLabel,
    getFilterTitle,
  } = useAdminMembersList();

  return (
    <div className="aml-container">
      <div className="sticky top-0 z-50 bg-white shadow">
        <Navbar />
      </div>
      <div className="aml-content">
        <div className="aml-page-header">
          <div>
            <h1>{getFilterTitle()}</h1>
            <p>
              {pagination?.total ?? 0} member
              {pagination?.total !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
        <FilterBar
          statusFilter={statusFilter}
          searchTerm={searchTerm}
          onStatusChange={handleStatusFilter}
          onSearch={handleSearch}
        />
        <MembersTable
          members={members}
          isLoading={isLoading}
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onEdit={handleEdit}
          onDelete={handleDeleteConfirm}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
        />
      </div>
      <EditMemberModal
        member={editingMember}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        isUpdating={isUpdating}
      />
      <DeleteConfirmModal
        member={deletingMember}
        onConfirm={handleDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AdminMembersList;
