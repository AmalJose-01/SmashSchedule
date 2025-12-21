import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { logOut } from "../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { getUserDetailAPI } from "../services/userServices";

export const useGetUserDetail = () => {
  console.log(userType);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey:
     ["userDetail"],
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
        error?.response?.data?.message || "Error loading tournament details"
      );
    },
  });

  useEffect(() => {
    if (isLoading) {
      toast.loading("Loading User Detail...", { id: "UserLoader" });
    } else {
      toast.dismiss("UserLoader");
    }
  }, [isLoading]);

  const handleGetUserDetail = () => {
    if (error?.status === 401) {
      console.log("handleGetUserDetail", error.response.data.message);
      dispatch(logOut());
      toast.error(error.response.data.message);
    }
    if (!data) return null;
    return data;
  };

  return {
    handleGetUserDetail,
    userDetail: data,
    error,
  };
};
