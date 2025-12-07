import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getTournamentListAPI } from "../services/teamServices";
import { useEffect } from "react";

export const useTournament = () => {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["tournamentList"],
    queryFn: getTournamentListAPI,
     //  Cache for 10 minutes — avoid refetching
  staleTime: 10 * 60 * 1000,
  cacheTime: 30 * 60 * 1000,

  refetchOnWindowFocus: false,

    onError: (err) =>
      toast.error(err?.response?.data?.message || "Error loading tournaments"),
  });


useEffect(() => {
  if (isLoading ) {
    toast.loading("Loading tournaments...", { id: "tournamentLoader" });
  } else {
    toast.dismiss("tournamentLoader");
  }
}, [isLoading]);

useEffect(() => {
  if (!isLoading && !isFetching) {
    toast.dismiss("tournamentLoader");
  }
}, [isFetching, isLoading]);


  const handleTournamentList = () => {
    if (!data?.tournaments) return [];

    return data.tournaments
      .map((t) =>
        t.tournamentName && t._id
          ? { tournamentId: t._id, name: t.tournamentName }
          : null
      )
      .filter(Boolean);
  };

  return {
    handleTournamentList,
    isTournamentLoading: isLoading,
    error,
  };
};
