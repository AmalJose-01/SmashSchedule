import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveKnockoutScoreAPI } from "../services/admin/adminTeamServices";
import { useDispatch } from "react-redux";

export const useKnockoutUpdateScore = (input) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const mutation = useMutation({
    mutationKey: ["knockoutScore"],
    mutationFn: saveKnockoutScoreAPI,
    onMutate: () => toast.loading("Saving score..."),
    onSuccess: () => {
      toast.dismiss();
      toast.success("Score saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["knockoutSchedule"] });
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err?.message || "Failed to save score");
    },
  });
  const handleKnockoutScore = (data) => {
    try {
      toast.promise(mutation.mutateAsync(data), {
        loading: "Updating score...",
        success: "Score updated successfully",
        error: "Error updating score",
      });
    } catch (error) {
      console.log(error);
      if (error?.status === 401) {
        console.log("handleKnockoutScore", error.response.data.message);
        dispatch(logOut());
        toast.error(error.response.data.message);
      } else {
        toast.error("Error updating score");
      }
    }
  };
  return {
    handleKnockoutScore,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
  };
};
