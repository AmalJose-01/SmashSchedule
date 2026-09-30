import { takeRedirect } from "../utils/postLoginRedirect";
import { isAdminNotVerifiedError } from "../utils/adminVerification";
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
      if (isAdminNotVerifiedError(err)) return; // alert + logout already handled
      toast.error(err?.response?.data?.message || "Login failed");
    },
  });

  const handleLoginWithGoogle = async (inputData) => {
    try {
      toast.promise(
        await loginWithGoogleMutation.mutateAsync(inputData), // React Query mutation returns a promise
        {
          loading: "Logging in...",
          success: (res) => {
            let user = res.user;

            dispatch(loginUser(res));

            // Navigate based on account type
            if (user.accountType === "admin") {
              navigate("/dashboard", { replace: true });
            } else if (user.accountType === "user") {
              navigate(takeRedirect("user") || "/user/dashboard", { replace: true });
            }

            return "Login successful!";
          },
          error: (err) => {
            const message =
              err.response?.data?.message || err.message || "Login failed";
            return message;
          },
        }
      );
    } catch {
      // Error (e.g. wrong portal for this account) is already shown by onError.
    }
  };

  return {
    handleLoginWithGoogle,
    isLoading: loginWithGoogleMutation.isLoading,
  };
};
