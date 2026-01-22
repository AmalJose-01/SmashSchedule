import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveCourtUseCase } from "../../Presentation/court/saveCourt";
import { toast } from "sonner";
import { courtRepository } from "../../domain/venue/courtRepository";
import { useSelector } from "react-redux";

const useSaveCourt = () => {
  // Hook implementation goes here
const queryClient = useQueryClient();

 const venue = useSelector((state) => state.venue.venueData);

  const venue_Id = venue?.id;

   const user = useSelector((state) => state.user.user);
    const userId = user?._id;

  const mutation = useMutation({
    mutationKey: ["saveCourt"],
    // mutationFn: addCourtAPI,
    mutationFn: (courtData) =>
        saveCourtUseCase(courtData, courtRepository),

    onMutate: () => {
      toast.dismiss();
      toast.loading("Saving court...");
    },

    onSuccess: (data) => {
      toast.dismiss();
      toast.success("Court saved successfully!");

    
      queryClient.invalidateQueries({
        queryKey: ["venueDetail", venue_Id, userId],
      });
      return data;
    },

    onError: (error) => {
      toast.dismiss();
      toast.error(
        error?.response?.data?.error || "Failed to save court"
      );
    },
  });

  const saveCourt = async (courtData) => {
    return await mutation.mutateAsync(courtData);
  };

  return {
    saveCourt,
    isSaving: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };

};
export default useSaveCourt;