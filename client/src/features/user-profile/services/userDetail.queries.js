import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMyUserDetail, saveMyUserDetail } from "./userDetail.services.js";

export const userDetailKeys = { mine: ["user-detail", "mine"] };

export const useGetMyUserDetail = () =>
  useQuery({ queryKey: userDetailKeys.mine, queryFn: getMyUserDetail, staleTime: 1000 * 60 * 5 });

export const useSaveMyUserDetail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMyUserDetail,
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries({ queryKey: userDetailKeys.mine });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Could not save profile"),
  });
};
