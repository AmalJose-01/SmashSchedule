/**
 * ========================================
 * FEATURE: Membership
 * MODULE: Admin Service Layer
 * FILE: React Query Hooks & Cache Management
 * ========================================
 * 
 * Centralized data fetching and mutation hooks for admin membership operations.
 * Manages caching strategy, cache invalidation, and automatic refetching.
 * All queries and mutations go through this layer in components.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAllMembers,
  getPendingVerifications,
  verifyDocument,
  getExpiringMemberships,
  getMembershipStats,
  autoExpireMembers,
} from "./adminMemberManagement.services.js";

// ========== QUERY KEYS ==========
export const adminMembershipQueryKeys = {
  all: ["admin-membership"],
  members: () => [...adminMembershipQueryKeys.all, "members"],
  membersList: (page, limit, search, status) => [
    ...adminMembershipQueryKeys.members(),
    { page, limit, search, status },
  ],
  stats: () => [...adminMembershipQueryKeys.all, "stats"],
  verifications: () => [...adminMembershipQueryKeys.all, "verifications"],
  expiring: () => [...adminMembershipQueryKeys.all, "expiring"],
};

// ========== QUERIES ==========

/**
 * Hook to fetch all members with pagination and filtering
 */
export const useGetAllMembers = (page = 1, limit = 10, search = "", status = "") => {
  return useQuery({
    queryKey: adminMembershipQueryKeys.membersList(page, limit, search, status),
    queryFn: () => getAllMembers(page, limit, search, status),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to fetch pending verification documents
 * Auto-refetches every 30 seconds for real-time updates
 */
export const useGetPendingVerifications = () => {
  return useQuery({
    queryKey: adminMembershipQueryKeys.verifications(),
    queryFn: getPendingVerifications,
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
    staleTime: 0, // Always consider stale to enable refetching
  });
};

/**
 * Hook to fetch membership statistics
 */
export const useGetMembershipStats = () => {
  return useQuery({
    queryKey: adminMembershipQueryKeys.stats(),
    queryFn: getMembershipStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook to fetch expiring memberships
 */
export const useGetExpiringMemberships = () => {
  return useQuery({
    queryKey: adminMembershipQueryKeys.expiring(),
    queryFn: getExpiringMemberships,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

// ========== MUTATIONS ==========

/**
 * Hook to verify member documents
 */
export const useVerifyDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, status, rejectionReason }) =>
      verifyDocument(documentId, status, rejectionReason),
    onSuccess: (data) => {
      toast.success("Document verified successfully!");
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: adminMembershipQueryKeys.verifications(),
      });
      queryClient.invalidateQueries({
        queryKey: adminMembershipQueryKeys.members(),
      });
      queryClient.invalidateQueries({
        queryKey: adminMembershipQueryKeys.stats(),
      });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "Verification failed";
      toast.error(errorMessage);
      throw error;
    },
  });
};

/**
 * Hook to auto-expire memberships
 */
export const useAutoExpireMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: autoExpireMembers,
    onSuccess: (data) => {
      toast.success(`${data.expiredCount} memberships expired successfully!`);
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: adminMembershipQueryKeys.all,
      });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "Auto-expire failed";
      toast.error(errorMessage);
      throw error;
    },
  });
};
