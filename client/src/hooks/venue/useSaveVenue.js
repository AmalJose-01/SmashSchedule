import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { saveVenueUseCase } from "../../Presentation/venue/saveVenue";
import { venueRepository } from "../../domain/venue/venueRepository";
import { setVenueData } from "../../redux/slices/venueSlice";
import { useDispatch } from "react-redux";

const useSaveVenue = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const mutation = useMutation({
    mutationKey: ["saveVenue"],
    mutationFn: (venueData) =>
      saveVenueUseCase(venueData, venueRepository),

    onMutate: () => {
      toast.dismiss();
      toast.loading("Saving venue...");
    },

    onSuccess: (data) => {
      toast.dismiss();
      toast.success("Venue saved successfully!");

      queryClient.invalidateQueries({
        queryKey: ["venueList"],
      });



    dispatch(setVenueData(data));
      

      return data;
    },

    onError: (error) => {
      toast.dismiss();
      toast.error(
        error?.response?.data?.error || "Failed to save venue"
      );
    },
  });

  const saveVenue = async (venueData) => {
    return await mutation.mutateAsync(venueData);
  };

  return {
    saveVenue,
    isSaving: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
};

export default useSaveVenue;
