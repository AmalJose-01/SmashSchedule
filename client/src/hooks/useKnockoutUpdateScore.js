import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveKnockoutScoreAPI } from "../services/teamServices";

export const useKnockoutUpdateScore = (input) => {
          const queryClient = useQueryClient();
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
      toast.error("Error updating score");
      
    }
  };
  return { handleKnockoutScore,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess
  };

}
