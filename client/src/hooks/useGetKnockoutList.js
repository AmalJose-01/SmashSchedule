import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getKnockoutScheduleAPI } from "../services/teamServices";
import { useEffect } from "react";
import { getAdminKnockoutScheduleAPI } from "../services/admin/adminTeamServices";


export const useGetKnockoutList = (tournamentId,userType) => {
 const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["knockoutSchedule", tournamentId],
    queryFn: () => userType === "Admin" ? getAdminKnockoutScheduleAPI(tournamentId) : getKnockoutScheduleAPI(tournamentId),
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Error loading tournaments"),
  });
    const handleKnockoutList = () => {
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