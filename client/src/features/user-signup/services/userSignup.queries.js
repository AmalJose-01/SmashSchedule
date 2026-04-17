/**
 * ========================================
 * FEATURE: User Signup
 * MODULE: Service Layer
 * FILE: React Query Hooks
 * ========================================
 */

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { signupUser } from "./userSignup.services.js";

/**
 * Hook to register a new user account
 */
export const useSignupUser = () => {
  return useMutation({
    mutationFn: signupUser,
    onError: (error) => {
      console.log("error", error);
      
      const message = error.response?.data?.message || "Signup failed. Please try again.";
      toast.error(message);
    },
  });
};
