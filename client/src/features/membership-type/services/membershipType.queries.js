import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAllMembershipTypes,
  createMembershipType,
  updateMembershipType,
  deleteMembershipType,
} from "./membershipType.services.js";

export const membershipTypeQueryKeys = {
  all: ["membership-types"],
  list: () => [...membershipTypeQueryKeys.all, "list"],
};

export const useGetAllMembershipTypes = () => {
  return useQuery({
    queryKey: membershipTypeQueryKeys.list(),
    queryFn: getAllMembershipTypes,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

export const useCreateMembershipType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMembershipType,
    onSuccess: () => {
      toast.success("Membership type created successfully!");
      queryClient.invalidateQueries({ queryKey: membershipTypeQueryKeys.list() });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create membership type");
    },
  });
};

export const useUpdateMembershipType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ typeId, ...typeData }) => updateMembershipType(typeId, typeData),
    onSuccess: () => {
      toast.success("Membership type updated successfully!");
      queryClient.invalidateQueries({ queryKey: membershipTypeQueryKeys.list() });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update membership type");
    },
  });
};

export const useDeleteMembershipType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMembershipType,
    onSuccess: () => {
      toast.success("Membership type deleted successfully!");
      queryClient.invalidateQueries({ queryKey: membershipTypeQueryKeys.list() });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete membership type");
    },
  });
};
