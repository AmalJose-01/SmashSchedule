import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getKnockoutScheduleAPI } from "../services/teamServices";
import { useEffect } from "react";
import { getAdminKnockoutScheduleAPI } from "../services/admin/adminTeamServices";
import { useDispatch } from "react-redux";
import { logOut } from "../redux/slices/userSlice";


export const useGetKnockoutList = (tournamentId,userType) => {
    const dispatch = useDispatch();

 const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["knockoutSchedule", tournamentId],
    queryFn: () => userType === "Admin" ? getAdminKnockoutScheduleAPI(tournamentId) : getKnockoutScheduleAPI(tournamentId),
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Error loading tournaments"),
  });
    const handleKnockoutList = () => {
      if(error?.status === 401){
  console.log("handleKnockoutList",error.response.data.message);
  dispatch(logOut())
  toast.error(error.response.data.message)

}
    if (!data) return [];

    return data;
  };

  useEffect(() => {
    if (isLoading ) {
      toast.loading("Loading knockout schedule...", { id: "knockoutLoader" });
    } else {
      toast.dismiss("knockoutLoader");
    }
  }, [isLoading]);

    useEffect(() => {
    if (!isLoading && !isFetching) {
      toast.dismiss("Loading knockout schedule...", { id: "knockoutLoader" });
    } 
  }, [isLoading, isFetching]);

  return {
    handleKnockoutList,
    isKnockoutLoading: isLoading,
    error,
  };
};