import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getAdminTournamentInformationAPI } from "../services/admin/adminTeamServices";
import { useDispatch } from "react-redux";
import { logOut } from "../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { getTournamentInformationAPI } from "../services/teamServices";

export const useTournamentInformation = (tournamentId, userType) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey:
      userType === "Admin"
        ? ["adminTournamentInformation", tournamentId]
        : ["tournamentDetail", tournamentId],
    queryFn: () =>
      userType === "Admin"
        ? getAdminTournamentInformationAPI(tournamentId)
        : getTournamentInformationAPI(tournamentId),
    onError: (error) => {
      console.log("MUTATION ERROR:", error);

      if (error?.response?.status === 401) {
        toast.error(error.response.data.message || "Session expired");

        dispatch(logOut());
        navigate("/");
        return;
      }

      // Fallback for other errors
      toast.error(error?.response?.data?.message || error.message);
    },
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

  const handleTournamentInformation = () => {
    if (error?.status === 401) {
      console.log("handleTournamentInformation", error.response.data.message);
      dispatch(logOut());
      toast.error(error.response.data.message);
    }

    if (!data) return null;

    return data;
  };

  return {
    handleTournamentInformation,
    tournamentInfo: data,
    isTournamentInfoLoading: isLoading,
    error,
  };
};
