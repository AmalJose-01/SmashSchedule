import { useMutation } from "@tanstack/react-query";
import { loginWithGoogleAPI } from "../services/userServices";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginUser } from "../redux/slices/userSlice";

export const useGoogleLogin = () => {
  // Implementation for Google Login

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loginWithGoogleMutation = useMutation({
    mutationKey: ["login"],
    mutationFn: loginWithGoogleAPI,
    onMutate: () => toast.loading("Loading...."),

    onSuccess: () => {
      toast.dismiss();
      toast.success("Login successfully!");
    },
    onError: (err) => {
      toast.dismiss();
      toast.error(err?.response.data.message || "Failed to save score");
    },
  });

  const handleLoginWithGoogle = async (inputData) => {
    try {
      toast.promise(
        await loginWithGoogleMutation.mutateAsync(inputData), // React Query mutation returns a promise
        {
          loading: "Logging in...",
          success: (res) => {
            console.log("res..........", res);
            let user = res.user;

            console.log("user..........", user);

           

            dispatch(loginUser(res));

         

            return "Login successful!";
          },
          error: (err) => {
            const message =
              err.response?.data?.message || err.message || "Login failed";
            return message;
          },
        }
      );
    } catch (error) {
      console.log("tradedashboard", error);

      alert(error.response?.data?.message || "Login failed");
    }
  };

  return {
    handleLoginWithGoogle,
    isLoading: loginWithGoogleMutation.isLoading,
  };
};
