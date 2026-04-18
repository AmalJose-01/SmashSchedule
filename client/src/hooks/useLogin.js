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
    mutation.mutateAsync(data)
      .then((res) => {
        console.log("res..........", res);
        let user = res.user;

        dispatch(loginUser(res));
        toast.success("Login successful!");

        if (user.accountType === "admin") {
          navigate("/dashboard", { replace: true });
        } else if (user.accountType === "user") {
          console.log("navigaTE ....FG");
          navigate("/user/dashboard", { replace: true });
        }
      })
      .catch((err) => {
        console.error("Login error:", err);
        const message =
          err.response?.data?.message ||
          err.message ||
          "Invalid username or password";

        // Show error toast and stay on login page
        toast.error(message);
      });
  };

  return {
    handleLogin,
    isLoading: mutation.isLoading || mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};
