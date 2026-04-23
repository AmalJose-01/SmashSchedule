import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyMemberships, cancelMembership } from "./userMembership.services.js";

export const userMembershipKeys = {
  all: ["user-memberships"],
  mine: () => [...userMembershipKeys.all, "mine"],
};

export const useGetMyMemberships = () => {
  return useQuery({
    queryKey: userMembershipKeys.mine(),
    queryFn: getMyMemberships,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
};

export const useInvalidateMyMemberships = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: userMembershipKeys.mine() });
};

export const useCancelMembership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId) => cancelMembership(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMembershipKeys.mine() });
    },
  });
};
