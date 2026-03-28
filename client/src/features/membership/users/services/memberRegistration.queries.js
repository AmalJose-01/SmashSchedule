/**
 * ========================================
 * FEATURE: Membership
 * MODULE: User Service Layer
 * FILE: React Query Hooks & Cache Management
 * ========================================
 * 
 * Centralized data fetching and mutation hooks for membership operations.
 * Manages caching strategy, cache invalidation, and automatic refetching.
 * All queries and mutations go through this layer in components.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAccessToken } from "../../../../../utils/storageHandler.js";
import {
  registerMember,
  getMembershipTypes,
  getMemberProfile,
  updateMemberProfile,
  uploadVerificationDocument,
  renewMembership,
  getMembershipHistory,
} from "./memberRegistration.services.js";

// ========== QUERY KEYS ==========
export const membershipQueryKeys = {
  all: ["membership"],
  types: () => [...membershipQueryKeys.all, "types"],
  profiles: () => [...membershipQueryKeys.all, "profiles"],
  profile: (id) => [...membershipQueryKeys.profiles(), id],
  history: () => [...membershipQueryKeys.all, "history"],
  memberHistory: (id) => [...membershipQueryKeys.history(), id],
};

// ========== QUERIES ==========

/**
 * Hook to fetch all membership types
 */
export const useGetMembershipTypes = () => {
  const adminId = localStorage.getItem("clubAdminId") || undefined;
  return useQuery({
    queryKey: [...membershipQueryKeys.types(), adminId],
    queryFn: () => getMembershipTypes(adminId),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

/**
 * Hook to fetch member profile
 */
export const useGetMemberProfile = (memberId) => {
  return useQuery({
    queryKey: membershipQueryKeys.profile(memberId),
    queryFn: () => getMemberProfile(memberId),
    enabled: !!memberId && !!getAccessToken(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook to fetch membership history
 */
export const useGetMembershipHistory = (memberId) => {
  return useQuery({
    queryKey: membershipQueryKeys.memberHistory(memberId),
    queryFn: () => getMembershipHistory(memberId),
    enabled: !!memberId && !!getAccessToken(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// ========== MUTATIONS ==========

/**
 * Hook to register a new member
 */
export const useRegisterMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerMember,
    onSuccess: (data) => {
      localStorage.setItem("memberId", data.member._id);
      if (data.alreadyExists) {
        toast.info("You're already registered. Loading your membership.");
      } else {
        toast.success("Registration successful!");
      }
      queryClient.invalidateQueries({ queryKey: membershipQueryKeys.profiles() });
    },
    onError: (error) => {
      console.error("Registration error:", error);
      console.error("Error response:", error.response);
      const errorMessage = error.response?.data?.message || error.message || "Registration failed";
      toast.error(errorMessage);
      throw error;
    },
  });
};

/**
 * Hook to update member profile
 */
export const useUpdateMemberProfile = (memberId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileData) => updateMemberProfile(memberId, profileData),
    onSuccess: (data) => {
      toast.success("Profile updated successfully!");
      // Invalidate profile query
      queryClient.invalidateQueries({
        queryKey: membershipQueryKeys.profile(memberId),
      });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "Update failed";
      toast.error(errorMessage);
      throw error;
    },
  });
};

/**
 * Hook to upload verification document
 */
export const useUploadVerificationDocument = (memberId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, documentType }) =>
      uploadVerificationDocument(memberId, file, documentType),
    onSuccess: (data) => {
      toast.success("Document uploaded successfully!");
      // Invalidate profile to refresh verification status
      queryClient.invalidateQueries({
        queryKey: membershipQueryKeys.profile(memberId),
      });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "Upload failed";
      toast.error(errorMessage);
      throw error;
    },
  });
};

/**
 * Hook to renew membership
 */
export const useRenewMembership = (memberId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => renewMembership(memberId),
    onSuccess: (data) => {
      toast.success("Membership renewed successfully!");
      // Invalidate profile and history
      queryClient.invalidateQueries({
        queryKey: membershipQueryKeys.profile(memberId),
      });
      queryClient.invalidateQueries({
        queryKey: membershipQueryKeys.memberHistory(memberId),
      });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "Renewal failed";
      toast.error(errorMessage);
      throw error;
    },
  });
};
