import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTournamentAPI } from "../services/teamServices";
import { useEffect } from "react";
import { toast } from "sonner";

export const useDeleteTournament = (tournamentId) => {
          const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["delete", tournamentId],
    mutationFn: deleteTournamentAPI,
    onMutate: () => toast.loading("Delete tournament..."),
    onSuccess: () => {
      toast.dismiss();
      toast.success("Delete tournament successfully!");
      queryClient.invalidateQueries({ queryKey: ["tournamentList"] });
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err?.message || "Failed to delete tournament");
    },
  });

  useEffect(() => {
    if (mutation.isLoading) {
      toast.loading("Deleting tournament...", { id: "deleteLoader" });
    } else {
      toast.dismiss("deleteLoader");
    }
  }, [mutation.isLoading]);

  useEffect(() => {
    if (!mutation.isLoading && !mutation.isFetching) {
      toast.dismiss("Deleting tournament...", { id: "deleteLoader" });
    }
  }, [mutation.isLoading, mutation.isFetching]);


const handleTournamentDelete = (data) => {

    try {
toast.promise(mutation.mutateAsync(data), {
        loading: "Delete tournament...",
        success: "delete tournament successfully",
        error: "Error delete tournament",
      });      
    } catch (error) {
      console.log(error);
      toast.error("Error delete tournament");
      
    }
  };






  return {handleTournamentDelete,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess
  };
};
