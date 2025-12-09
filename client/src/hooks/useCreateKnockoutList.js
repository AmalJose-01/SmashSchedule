import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { createKnockoutScheduleAPI } from "../services/admin/adminTeamServices";

export const useCreateKnockoutList = (tournament) => {
  let loadingToastId;

  const { data, isLoading, error } = useQuery({
    queryKey: ["knockoutSchedule", tournament?.tournamentId],
    queryFn: async () => {
      loadingToastId = toast.loading("Creating knockout schedule...");
      const res = await createKnockoutScheduleAPI(tournament);
      return res;
    },
    onSuccess: () => {
      toast.dismiss(loadingToastId);
      toast.success("Knockout schedule created successfully!");
            queryClient.invalidateQueries({ queryKey: ["knockoutSchedule"] });

    },

    onError: (err) => {
      toast.dismiss(loadingToastId);
      toast.error(err?.response?.data?.message || "Error loading tournaments");
    },
  });
  const handleCreateKnockoutList = () => {
if(error?.status === 401){
  console.log("handleTournamentList",error.response.data.message);
  dispatch(logOut())
  toast.error(error.response.data.message)

}

    if (!data?.schedule) return [];

    return data.schedule;
  };

  return {
    handleCreateKnockoutList,
    isKnockoutLoading: isLoading,
    error,
  };
};
