import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { venueRepository } from "../../domain/venue/venueRepository";
import { deleteVenueUseCase } from "../../Presentation/venue/deleteVenue";
import { useSelector } from "react-redux";

const useDeleteVenue = () => {
  const queryClient = useQueryClient();
  const user = useSelector((state) => state.user.user);
  const userId = user?._id;

  const mutation = useMutation({
    mutationKey: ["deleteVenue"],
    mutationFn: (venueId) => deleteVenueUseCase(venueId, venueRepository),
    onMutate: () => {
      toast.dismiss();
      toast.loading("Deleting venue...");
    },
    onSuccess: async () => {
      toast.dismiss();
      toast.success("Venue deleted successfully!");

      await queryClient.invalidateQueries({
        queryKey: ["venueList", userId],
        exact: true,
      });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error?.response?.data?.message || "Failed to delete venue");
    },
  });

  const deleteVenue = async (venueId) => {
    return await mutation.mutateAsync(venueId);
  };

  return {
    deleteVenue,
    isDeleting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
};

export default useDeleteVenue;
