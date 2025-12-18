import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTeamAPI } from "../services/admin/adminTeamServices";
import { useEffect } from "react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

export const useDeleteTeam = (teamId) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
    const navigate = useNavigate();


  const mutation = useMutation({
    mutationKey: ["deleteTeam", teamId],
    mutationFn: deleteTeamAPI,
    onMutate: () => toast.loading("Delete tournament..."),
    onSuccess: () => {
      toast.dismiss();
      toast.success("Delete tournament successfully!");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: (error) => {
      toast.dismiss();
    
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

  useEffect(() => {
    if (mutation.isLoading) {
      toast.loading("Deleting team...", { id: "deleteLoader" });
    } else {
      toast.dismiss("deleteLoader");
    }
  }, [mutation.isLoading]);

  useEffect(() => {
    if (!mutation.isLoading && !mutation.isFetching) {
      toast.dismiss("Deleting team...", { id: "deleteLoader" });
    }
  }, [mutation.isLoading, mutation.isFetching]);

  const handleTeamDelete = (data) => {
    try {
      toast.promise(mutation.mutateAsync(data), {
        loading: "Delete tournament...",
        success: "delete tournament successfully",
        error: "Error delete tournament",
      });
    } catch (error) {
      console.log(error);
      if (error?.status === 401) {
        console.log("handleTeamDelete", error.response.data.message);
        dispatch(logOut());
        toast.error(error.response.data.message);
      } else {
        toast.error("Error delete tournament");
      }
    }
  };

  return {
    handleTeamDelete,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
  };
};
