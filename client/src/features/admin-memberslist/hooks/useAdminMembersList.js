import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetMembersList, useDeleteMember, useUpdateMember } from "../services/adminMembersList.queries.js";

export const useAdminMembersList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);

  const statusFilter = searchParams.get("status") || "";

  const { data, isLoading } = useGetMembersList(currentPage, 10, searchTerm, statusFilter);
  const { mutate: deleteMemberMutate, isPending: isDeleting } = useDeleteMember();
  const { mutate: updateMemberMutate, isPending: isUpdating } = useUpdateMember();

  const members = data?.members || [];
  const pagination = data?.pagination;

  const handleStatusFilter = (status) => {
    if (status) setSearchParams({ status });
    else setSearchParams({});
    setCurrentPage(1);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleEdit = (member) => setEditingMember({ ...member });
  const handleCancelEdit = () => setEditingMember(null);

  const handleSaveEdit = (memberId, formData) => {
    updateMemberMutate({ memberId, data: formData }, { onSuccess: () => setEditingMember(null) });
  };

  const handleDeleteConfirm = (member) => setDeletingMember(member);
  const handleCancelDelete = () => setDeletingMember(null);

  const handleDelete = () => {
    if (!deletingMember) return;
    deleteMemberMutate(deletingMember._id, { onSuccess: () => setDeletingMember(null) });
  };

  const getStatusColor = (status) => {
    const map = { ACTIVE: "#10b981", PENDING_VERIFICATION: "#f59e0b", EXPIRED: "#ef4444", SUSPENDED: "#6b7280" };
    return map[status] || "#9ca3af";
  };

  const getStatusLabel = (status) => {
    const map = { ACTIVE: "Active", PENDING_VERIFICATION: "Pending", EXPIRED: "Expired", SUSPENDED: "Suspended", CANCELLED: "Cancelled" };
    return map[status] || status;
  };

  const getFilterTitle = () => {
    const map = { ACTIVE: "Active Members", PENDING_VERIFICATION: "Pending Verification", EXPIRED: "Expired Members", "": "All Members" };
    return map[statusFilter] ?? "Members";
  };

  return {
    members, pagination, isLoading,
    searchTerm, statusFilter, currentPage, setCurrentPage,
    editingMember, deletingMember,
    isDeleting, isUpdating,
    handleStatusFilter, handleSearch,
    handleEdit, handleCancelEdit, handleSaveEdit,
    handleDeleteConfirm, handleCancelDelete, handleDelete,
    getStatusColor, getStatusLabel, getFilterTitle,
  };
};
