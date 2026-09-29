import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMyClubs, addMyClub, setClubFavourite, removeMyClub, getClubEvents } from "./myClubs.services.js";

export const myClubsKeys = {
  list: ["my-clubs"],
  events: (clubId) => ["club-events", clubId],
};

export const useMyClubs = () =>
  useQuery({ queryKey: myClubsKeys.list, queryFn: getMyClubs, staleTime: 1000 * 60 * 2, select: (r) => r.data ?? [] });

// All three mutations return the updated list, so write it straight into the cache.
const useListMutation = (mutationFn, successMsg) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (res) => {
      qc.setQueryData(myClubsKeys.list, res);
      if (successMsg) toast.success(successMsg);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Something went wrong"),
  });
};

export const useAddMyClub = () => useListMutation(addMyClub, "Added to My Clubs");
export const useSetClubFavourite = () => useListMutation(setClubFavourite);
export const useRemoveMyClub = () => useListMutation(removeMyClub, "Removed from My Clubs");

export const useClubEvents = (clubId, enabled) =>
  useQuery({
    queryKey: myClubsKeys.events(clubId),
    queryFn: () => getClubEvents(clubId),
    enabled: !!clubId && enabled,
    staleTime: 1000 * 60,
  });
