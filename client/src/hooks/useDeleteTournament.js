import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTournamentAPI } from "../services/admin/adminTeamServices";
import { useEffect } from "react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";

export const useDeleteTournament = (tournamentId) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const mutation = useMutation({
    mutationKey: ["delete", tournamentId],
    mutationFn: deleteTournamentAPI,
    onMutate: () => toast.loading("Delete tournament..."),
    onSuccess: () => {
      toast.dismiss();
      toast.success("Delete tournament successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminTournamentList"] });
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
      if (error?.status === 401) {
        console.log("handleTournamentList", error.response.data.message);
        dispatch(logOut());
        toast.error(error.response.data.message);
      } else {
        toast.error("Error delete tournament");
      }
    }
  };

  return {
    handleTournamentDelete,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
  };
};
