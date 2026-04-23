/**
 * ========================================
 * FEATURE: User Signup
 * MODULE: Hooks
 * FILE: useUserSignup
 * ========================================
 *
 * Manages signup form state, validation, and submission.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { loginUser } from "../../../redux/slices/userSlice.js";
import { useSignupUser } from "../services/userSignup.queries.js";

export const useUserSignup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate: signup, isPending: isLoading } = useSignupUser();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      toast.error("Email is required");
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      toast.error("Password is required");
      return false;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error("Password must be at least 8 characters with uppercase, lowercase, number and special character");
      return false;
    }
    if (!formData.confirmPassword) {
      toast.error("Please confirm your password");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    signup(
      { email: formData.email, password: formData.password, confirmPassword: formData.confirmPassword },
      {
        onSuccess: (data) => {
          const accountType = data.user?.accountType || "user";

          dispatch(
            loginUser({
              user: { ...data.user, accountType },
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            })
          );
          toast.success("Account created successfully!");

          // Redirect based on actual account type from server
          if (accountType === "admin") {
            navigate("/dashboard");
          } else {
            navigate("/user/dashboard");
          }
        },
      }
    );
  };

  return {
    formData,
    showPassword,
    showConfirmPassword,
    isLoading,
    setShowPassword,
    setShowConfirmPassword,
    handleInputChange,
    handleSubmit,
  };
};
