import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getTournamentDetailsAPI } from "../services/teamServices";
import { useEffect } from "react";

export const useTournamentDetail = (tournamentId) => {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["tournamentDetail", tournamentId],
    queryFn: () => getTournamentDetailsAPI(tournamentId),
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Error loading tournament details"),
  });

useEffect(() => {
  if (isLoading ) {
    toast.loading("Loading matches...", { id: "matchLoader" });
  } else {
    toast.dismiss("matchLoader");
  }
}, [isLoading]);

   useEffect(() => {
    if (!isLoading && !isFetching) {
      toast.dismiss("Loading matches...", { id: "matchLoader" });
    } 
  }, [isLoading, isFetching]);



  const handleTournamentDetail = () => {
    if (!data) return null;

    return data;
  };

  return {
    handleTournamentDetail,
    tournamentDetail: data,
    isTournamentDetailLoading: isLoading,
    error,
  };
};