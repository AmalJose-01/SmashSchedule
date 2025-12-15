import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveMatchesAPI } from "../services/admin/adminTeamServices";
import { useDispatch } from "react-redux";
import { logOut } from "../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";

export const useMatchSave = (input) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationKey: ["saveMatches"],
    mutationFn: saveMatchesAPI,
    onMutate: () => toast.loading("Schedule matches..."),
    onSuccess: () => {
      toast.dismiss();
      toast.success("Schedule matches successfully!");
     queryClient.invalidateQueries({ queryKey: ["adminTournamentInformation",input] });  
      //   queryClient.invalidateQueries({ queryKey: ["tournamentDetail"] });
    },
    onError: (error) => {
      console.log("MUTATION ERROR:", error);
toast.dismiss();
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
  const handleUseMatchScheduling = (data) => {
    try {
      toast.promise(mutation.mutateAsync(data), {
        loading: "Matches Scheduling..",
        success: "Matches Scheduling successfully",
        error: "Error Scheduling Matches",
      });
    } catch (error) {
      console.log(error);

      if (error?.status === 401) {
        console.log("handleUseMatchSave", error.response.data.message);
        dispatch(logOut());
        toast.error(error.response.data.message);
      } else {
        toast.error("Error Scheduling Matches");
      }
    }
  };
  return {
    handleUseMatchScheduling,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
  };
};
