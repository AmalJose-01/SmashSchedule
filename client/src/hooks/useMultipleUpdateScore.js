import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveMultipleScoreAPI } from "../services/admin/adminTeamServices";
import { useDispatch } from "react-redux";

export const useMultipleUpdateScore = (input) => {
      const queryClient = useQueryClient();
        const dispatch = useDispatch();


  const mutation = useMutation({
    mutationKey: ["tournament"],
    mutationFn: saveMultipleScoreAPI,
    onMutate: () => toast.loading("Saving score..."),
    onSuccess: () => {
       toast.dismiss(); 
      toast.success("Score saved successfully!");
queryClient.invalidateQueries({ queryKey: ["adminTournamentDetail"] });
queryClient.invalidateQueries({ queryKey: ["tournamentDetail"] });
    },
    onError: (err) => {
       toast.dismiss(); 
       console.log("errffffffff",err);
       
      toast.error(err?.response.data.message || "Failed to save score");
    },
  });
  const handleMultipleScore = (data) => {

    try {
toast.promise(mutation.mutateAsync(data), {
        loading: "Updating score...",
        success: "Score updated successfully",
        error: "Error updating score",
      });      
    } catch (error) {
      console.log(error);

if(error?.status === 401){
  console.log("handleScore",error.response.data.message);
  dispatch(logOut())
  toast.error(error.response.data.message)

}else{  toast.error("Error updating score");}

    
      
    }
  };
  return { handleMultipleScore,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess
  };
} 