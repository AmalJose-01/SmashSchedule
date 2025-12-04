import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveScoreAPI } from "../services/teamServices";

export const useUpdateScore = (input) => {
      const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["tournament"],
    mutationFn: saveScoreAPI,
    onMutate: () => toast.loading("Saving score..."),
    onSuccess: () => {
       toast.dismiss(); 
      toast.success("Score saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail"] });
    },
    onError: (err) => {
       toast.dismiss(); 
      toast.error(err?.message || "Failed to save score");
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
      toast.error("Error updating score");
      
    }
  };
  return { handleScore,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess
  };
} 