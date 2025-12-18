import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveScoreAPI } from "../services/admin/adminTeamServices";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

export const useUpdateScore = (input) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
    const navigate = useNavigate();


  const mutation = useMutation({
    mutationKey: ["tournament"],
    mutationFn: saveScoreAPI,
    onMutate: () => toast.loading("Saving score..."),
    onSuccess: () => {
      toast.dismiss();
      toast.success("Score saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminTournamentDetail"] });
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail"] });
    },
    onError: (error) => {
      toast.dismiss();

      if (error?.response?.status === 401) {
        toast.error(error.response.data.message || "Session expired");

        dispatch(logOut());
        navigate("/");
        return;
      }

      toast.error(error?.message || "Failed to save score");
    },
  });
  const handleScore = (data) => {
    try {
      toast.promise(mutation.mutateAsync(data), {
        loading: "Updating score...",
        success: "Score updated successfully",
        error: "Error updating score",
      });
    } catch (error) {
      console.log(error);

      if (error?.status === 401) {
        console.log("handleScore", error.response.data.message);
        dispatch(logOut());
        toast.error(error.response.data.message);
      } else {
        toast.error("Error updating score");
      }
    }
  };
  return {
    handleScore,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
  };
};
