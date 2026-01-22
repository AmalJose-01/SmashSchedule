import { useQuery } from "@tanstack/react-query";
import { getVenueUseCase } from "../../Presentation/venue/getVenue";
import { venueRepository } from "../../domain/venue/venueRepository";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logOut } from "../../redux/slices/userSlice";
import { toast } from "sonner";

const useGetVenue = () => {
  const user = useSelector((state) => state.user.user);
  const userId = user?._id;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["venueList", userId],
    queryFn: () => getVenueUseCase(userId, venueRepository),
    enabled: !!userId, // Only fetch if userId exists
    onError: (error) => {
      toast.dismiss();
      if (error?.response?.status === 401) {
        toast.error(error.response.data.message || "Session expired");
        dispatch(logOut());
        navigate("/");
        return;
      }
    },
  });

  return {
    venues: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useGetVenue;
