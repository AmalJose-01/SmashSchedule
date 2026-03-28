import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAllMembers, deleteMember, updateMember } from "./adminMembersList.services.js";

export const adminMembersListKeys = {
  all: ["admin-members-list"],
  list: (page, limit, search, status) => [...adminMembersListKeys.all, { page, limit, search, status }],
};

export const useGetMembersList = (page, limit, search, status) =>
  useQuery({
    queryKey: adminMembersListKeys.list(page, limit, search, status),
    queryFn: () => getAllMembers(page, limit, search, status),
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      toast.success("Member deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminMembersListKeys.all });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete member");
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, data }) => updateMember(memberId, data),
    onSuccess: () => {
      toast.success("Member updated successfully");
      queryClient.invalidateQueries({ queryKey: adminMembersListKeys.all });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update member");
    },
  });
};
