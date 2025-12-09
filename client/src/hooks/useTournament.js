import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logOut } from "../redux/slices/userSlice";
import { useQuery } from "@tanstack/react-query";
import { getAdminTournamentListAPI } from "../services/admin/adminTeamServices";
import { getTournamentListAPI } from "../services/teamServices";
import { useEffect } from "react";



export const useTournament = (userType) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [userType === "Admin" ? "adminTournamentList" : "tournamentList"],
    queryFn:
      userType === "Admin" ? getAdminTournamentListAPI : getTournamentListAPI,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,

    onError: (err) => {
      const message =
        err?.response?.data?.message || "Error loading tournaments";
    },
  });

  useEffect(() => {
    if (isLoading) {
      toast.loading("Loading tournaments...", { id: "tournamentLoader" });
    } else {
      toast.dismiss("tournamentLoader");
    }
  }, [isLoading]);

  const handleTournamentList = () => {




if(error?.status === 401){
  console.log("handleTournamentList",error.response.data.message);
  dispatch(logOut())
  toast.error(error.response.data.message)

}



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
    tournamentListError: error,
  };
};
