import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUserDetailAPI } from "../services/userServices";
import { useQuery } from "@tanstack/react-query";
import { logOut } from "../redux/slices/userSlice";
import { toast } from "sonner";

export const useGetUserDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["userDetail"],
    queryFn: getUserDetailAPI,
    onError: (error) => {
      toast.dismiss();

      if (error?.response?.status === 401) {
        toast.error(error.response.data.message || "Session expired");
        dispatch(logOut());
        navigate("/");
        return;
      }

      toast.error(
        error?.response?.data?.message || "Error loading user details"
      );
    },
  });

  const handleGetUserDetail = () => {
   
   
   
   
   
   
    try {
      if (error?.status === 401) {
      console.log("handleTournamentList", error.response.data.message);
      dispatch(logOut());
      toast.error(error.response.data.message);
    }

    if (!data?.user) return [];

    return data;
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
    handleGetUserDetail,
    userDetail: data,
    isLoading,
    error,
  };
};
