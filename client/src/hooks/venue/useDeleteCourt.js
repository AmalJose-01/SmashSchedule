import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCourtUseCase } from "../../Presentation/court/deleteCourt";
import { courtRepository } from "../../domain/venue/courtRepository";
import { toast } from "sonner";
import { useSelector } from "react-redux";

const useDeleteCourt = () => {
  const queryClient = useQueryClient();
  const venue = useSelector((state) => state.venue.venueData);

  const venue_Id = venue?.id;

  const user = useSelector((state) => state.user.user);
  const userId = user?._id;

  const mutation = useMutation({
    mutationKey: ["deleteCourt"],
    mutationFn: (courtId) => deleteCourtUseCase(courtId, courtRepository),
    onMutate: () => {
      toast.dismiss();
      toast.loading("Deleting court...");
    },
    onSuccess: async () => {
      toast.dismiss();
      toast.success("Court deleted successfully!");
      await queryClient.invalidateQueries({
        queryKey: ["venueDetail", venue_Id, userId],
        exact: true,
      });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error?.response?.data?.message || "Failed to delete venue");
    },
  });

  const deleteCourt = async (courtId) => {
    return await mutation.mutateAsync(courtId);
  };

  return {
    deleteCourt,
    isDeleting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
};
export default useDeleteCourt;
