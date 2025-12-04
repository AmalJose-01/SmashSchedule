import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getKnockoutScheduleAPI } from "../services/teamServices";
import { useEffect } from "react";


export const useGetKnockoutList = (tournamentId) => {
 const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["knockoutSchedule", tournamentId],
    queryFn: () => getKnockoutScheduleAPI(tournamentId),
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Error loading tournaments"),
  });
    const handleKnockoutList = () => {
    if (!data) return [];

    return data;
  };

  useEffect(() => {
    if (isLoading || isFetching) {
      toast.loading("Loading knockout schedule...", { id: "knockoutLoader" });
    } else {
      toast.dismiss("knockoutLoader");
    }
  }, [isLoading, isFetching]);

  return {
    handleKnockoutList,
    isKnockoutLoading: isLoading,
    error,
  };
};