/**
 * ========================================
 * FEATURE: User Signup
 * MODULE: Service Layer
 * FILE: API Services
 * ========================================
 *
 * Pure API calls — no business logic or React dependencies.
 */

import apiClient from "../../../services/api/axiosInstance.js";

/**
 * Register a new user account
 * @param {{ email: string, password: string, confirmPassword: string }} signupData
 * @returns {Promise<SignupResponse>}
 */
export const signupUser = async (signupData) => {
  const response = await apiClient.post("/user/signup", signupData);
  return response.data;
};
