import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createMembershipType,
  getAllMembershipTypes,
  updateMembershipType,
  deleteMembershipType,
} from "./membershipTypeManagement.services.js";

// ========== QUERY KEYS ==========
export const membershipTypeQueryKeys = {
  all: ["membershipTypes"],
  list: () => [...membershipTypeQueryKeys.all, "list"],
};

// ========== QUERIES ==========

/**
 * Hook to fetch all membership types (admin view)
 */
export const useGetAllMembershipTypes = () => {
  return useQuery({
    queryKey: membershipTypeQueryKeys.list(),
    queryFn: getAllMembershipTypes,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// ========== MUTATIONS ==========

/**
 * Hook to create a new membership type
 */
export const useCreateMembershipType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMembershipType,
    onSuccess: (data) => {
      toast.success("Membership type created successfully!");
      queryClient.invalidateQueries({
        queryKey: membershipTypeQueryKeys.list(),
      });
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to create membership type";
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to update a membership type
 */
export const useUpdateMembershipType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ typeId, typeData }) =>
      updateMembershipType(typeId, typeData),
    onSuccess: (data) => {
      toast.success("Membership type updated successfully!");
      queryClient.invalidateQueries({
        queryKey: membershipTypeQueryKeys.list(),
      });
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to update membership type";
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook to delete a membership type
 */
export const useDeleteMembershipType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMembershipType,
    onSuccess: (data) => {
      toast.success("Membership type deleted successfully!");
      queryClient.invalidateQueries({
        queryKey: membershipTypeQueryKeys.list(),
      });
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to delete membership type";
      toast.error(errorMessage);
    },
  });
};
