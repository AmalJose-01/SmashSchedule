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
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: false,
    onError: (error) => {
      const status = error?.response?.status;

      if (status === 401) {
        toast.error("Session expired");
        dispatch(logOut());
        navigate("/");
        return;
      }

      toast.error(
        error?.response?.data?.message || "Error loading user details"
      );
    },
  });

  return {
    userDetail: data, // ✅ return data directly
    isLoading,
    error,
  };
};
