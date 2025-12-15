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
      toast.error(err?.message || "Failed to save score");
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

            // if (user.accountType === "trade") {
            //   console.log("is trade");

            //   if (user.isVerified === true) {
            //     navigate("/tradedashboard");
            //   } else {
            //     navigate("/trade/add-profile");
            //   }
            // } else if (user.accountType === "user") {
            //   navigate("/userdashboard");
            // } else

            dispatch(loginUser(res));

            // if (user.accountType === "admin" && !user.isVerified) {
            //   // navigate("/tournament-list");
            //     navigate("/checkout");
            // }
            // // else  if (user.accountType === "admin") {
            // //   navigate("/tournament-list");
            // //   //  navigate("/checkout");
            // // }

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
