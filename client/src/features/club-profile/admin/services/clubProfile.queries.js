import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMyClubProfile, upsertClubProfile, uploadClubLogo } from "./clubProfile.services.js";
import { getAccessToken } from "../../../../../utils/storageHandler.js";

export const clubProfileQueryKeys = {
  all: ["club-profile"],
  mine: () => [...clubProfileQueryKeys.all, "mine"],
};

export const useGetMyClubProfile = () => {
  return useQuery({
    queryKey: clubProfileQueryKeys.mine(),
    queryFn: getMyClubProfile,
    enabled: !!getAccessToken(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

export const useUpsertClubProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertClubProfile,
    onSuccess: () => {
      toast.success("Club profile saved!");
      queryClient.invalidateQueries({ queryKey: clubProfileQueryKeys.mine() });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to save club profile");
    },
  });
};

export const useUploadClubLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadClubLogo,
    onSuccess: () => {
      toast.success("Logo uploaded!");
      queryClient.invalidateQueries({ queryKey: clubProfileQueryKeys.mine() });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Logo upload failed");
    },
  });
};
