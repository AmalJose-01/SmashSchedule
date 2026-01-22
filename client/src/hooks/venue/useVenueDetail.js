import { useQuery, useQueryClient } from "@tanstack/react-query";
import { venueRepository } from "../../domain/venue/venueRepository";
import { getVenueDetailUseCase } from "../../Presentation/venue/getVenueDetail";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

const useGetDetailVenue = () => {
  const queryClient = useQueryClient();

   const user = useSelector((state) => state.user.user);
    const userId = user?._id;


 const venue = useSelector((state) => state.venue.venueData);

  const venue_Id = venue?.id;


  const isEditMode = Boolean(venue_Id);

  console.log("isEditMode", isEditMode);

const query = useQuery({
  queryKey: ["venueDetail", venue_Id, userId],  
  queryFn: () =>
    getVenueDetailUseCase(venue_Id, userId, venueRepository),
  enabled: !!venue_Id && !!userId,
  onError: (error) => {
    toast.dismiss();
    toast.error(
      error?.response?.data?.error || "Failed to fetch venue details",
    );
  },
  onMutate: () => {
    toast.dismiss();
    toast.loading("Fetching venue details...");
  },
  onSuccess: (data) => {
    toast.dismiss();
    toast.success("Venue details fetched successfully!");
  },
    
});


  return {
    venueDetail: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useGetDetailVenue;
