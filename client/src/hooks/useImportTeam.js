import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importTeamAPI } from "../services/admin/adminTeamServices";
import { useDispatch } from "react-redux";
import { logOut } from "../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";

export const useImportTeam = (input) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationKey: ["importTeam"],
    mutationFn: importTeamAPI,
    onMutate: () => toast.loading("Import teams..."),
    onSuccess: () => {
      toast.dismiss();
      // toast.success("Import team successfully!");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: (error) => {
      console.log("MUTATION ERROR:", error);
      toast.dismiss();
      if (error?.response?.status === 401) {
        toast.error(error.response.data.message || "Session expired");

        dispatch(logOut());
        navigate("/");

        return;
      } else if (
        error?.response?.status === 409 &&
        error?.response?.data?.message === "No new teams to insert"
      ) {
        if (error?.response?.data?.skippedTeams.length > 0) {
          const skippedTeams = error.response.data.skippedTeams;
          const teamNames = skippedTeams
            .map((team) => team.teamName)
            .join(", ");
          toast.error(`These teams were skipped (already exist): ${teamNames}`);
          return;
        } else {
          toast.error("No new teams to insert");
          return;
        }
      }else if (
        error?.response?.status === 409 &&
        error?.response?.data?.message === "Team members cannot be the same"
      ) {
        if (error?.response?.data?.sameBothMembers.length > 0) {
          const skippedTeams = error.response.data.sameBothMembers;
          const teamNames = skippedTeams
            .map((team) => team.teamName)
            .join(", ");
          toast.error(`Team members cannot be the same: ${teamNames}`);
          return;
        } else {
          toast.error("No new teams to insert");
          return;
        }
      }

      // Fallback for other errors
      toast.error(error?.response?.data?.message || error.message);
    },
  });
  const handleUseImportTeam = (data) => {
    try {
      toast.promise(mutation.mutateAsync(data), {
        success: (res) => {
          let skippedCount = res.skippedCount || 0;
          if (skippedCount > 0) {
            const skippedTeams = res.skippedTeams || [];
            const teamNames = skippedTeams
              .map((team) => team.teamName)
              .join(", ");
            toast.success(
              `Teams imported successfully! ${skippedCount} teams were skipped (already exist): ${teamNames}`
            );
          } else {
            toast.success("Teams imported successfully!");
          }
          return res;
        },

        // // loading: "Import team...",
        // success: "Import team successfully",
        // // error: "Error Import Team",
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
    handleUseImportTeam,
    isLoading: mutation.isLoading,
    importError: mutation.isError,
    successImportTeam: mutation.isSuccess,
  };
};
