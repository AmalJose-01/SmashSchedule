import { useMutation } from "@tanstack/react-query";
import { loginAPI } from "../services/userServices";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { loginUser } from "../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";

export const useLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationKey: ["login"],
    mutationFn: loginAPI,
  });

  const handleLogin = (data) => {
    try {
      toast.promise(
        mutation.mutateAsync(data), // React Query mutation returns a promise
        {
          loading: "Logging in...",
          success: (res) => {
            console.log("res..........", res);
            let user = res.user;

             if (user.accountType === "admin") {
              //  navigate("/tournament-list");
                  navigate("/tournament-list", { replace: true });

            }

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
      console.log("error..........", error);
      const message = error.response.data?.message || "Login failed.";
      toast.error(message);
    }
  };

  return {
    handleLogin,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
  };
};
