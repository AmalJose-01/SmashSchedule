import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getTournamentDetailsAPI } from "../services/teamServices";
import { useEffect } from "react";
import { getAdminTournamentDetailsAPI } from "../services/admin/adminTeamServices";
import { useDispatch } from "react-redux";

export const useTournamentDetail = (tournamentId, userType) => {
  console.log(userType);
  const dispatch = useDispatch();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey:
      userType === "Admin"
        ? ["adminTournamentDetail", tournamentId]
        : ["tournamentDetail", tournamentId],
    queryFn: () =>
      userType === "Admin"
        ? getAdminTournamentDetailsAPI(tournamentId)
        : getTournamentDetailsAPI(tournamentId),
    onError: (err) =>
      toast.error(
        err?.response?.data?.message || "Error loading tournament details"
      ),
  });

  useEffect(() => {
    if (isLoading) {
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
    if (error?.status === 401) {
      console.log("handleTournamentDetail", error.response.data.message);
      dispatch(logOut());
      toast.error(error.response.data.message);
    }

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
