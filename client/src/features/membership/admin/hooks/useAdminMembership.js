import { useState } from "react";
import { toast } from "sonner";
import {
  useGetMembershipStats,
  useGetAllMembers,
  useGetPendingVerifications,
  useGetExpiringMemberships,
  useVerifyDocument,
} from "../services/adminMemberManagement.queries.js";

export const useAdminMembership = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState(null);

  // Use new query hooks
  const { data: statsData, isLoading: isStatsLoading } = useGetMembershipStats();
  const { data: membersData, isLoading: isMembersLoading } = useGetAllMembers(
    currentPage,
    10,
    searchTerm,
    statusFilter
  );
  const { data: pendingData, isLoading: isPendingLoading } = useGetPendingVerifications();
  const { data: expiringData, isLoading: isExpiringLoading } = useGetExpiringMemberships();

  // Use verification mutation
  const { mutate: verifyDocument, isPending: isVerifying } = useVerifyDocument();

  const stats = statsData?.stats;
  const members = membersData?.members || [];
  const pagination = membersData?.pagination;
  const pendingDocuments = pendingData?.documents || [];
  const expiringMembers = expiringData?.members || [];

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: "#10b981",
      PENDING_VERIFICATION: "#f59e0b",
      EXPIRED: "#ef4444",
      SUSPENDED: "#ef4444",
      CANCELLED: "#6b7280",
    };
    return colors[status] || "#9ca3af";
  };

  const getStatusLabel = (status) => {
    const labels = {
      ACTIVE: "Active",
      PENDING_VERIFICATION: "Pending",
      EXPIRED: "Expired",
      SUSPENDED: "Suspended",
      CANCELLED: "Cancelled",
    };
    return labels[status] || status;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleVerifyDocument = (documentId, status, reason = "") => {
    verifyDocument({ documentId, status, reason });
  };

  return {
    // State
    activeTab,
    searchTerm,
    statusFilter,
    currentPage,
    selectedMember,

    // Data
    stats,
    members,
    pagination,
    pendingDocuments,
    expiringMembers,

    // Loading states
    isStatsLoading,
    isMembersLoading,
    isPendingLoading,
    isExpiringLoading,
    isVerifying,

    // Handlers
    handleTabChange,
    handleSearch,
    handleFilterChange,
    handlePageChange,
    handleVerifyDocument,
    setSelectedMember,

    // Utilities
    getStatusColor,
    getStatusLabel,
  };
};
