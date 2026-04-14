import apiClient from "./api/axiosInstance.js";
import { headerData } from "../../utils/storageHandler";


export const  registerAPI = async (input) => {
    const response = await apiClient.post(`/user/signup`,input)
    return response.data

}

export const loginAPI = async (input) => {
    
  const response = await apiClient.post(`/admin/login`,input)
  return response.data
}



export const loginWithGoogleAPI = async (input) => {
    console.log("input",input);
    
  const response = await apiClient.post(`/admin/loginGoogle`,input)
  return response.data
}


export const forgotPasswordAPI = async (input) => {
    console.log("input",input);
    
  const response = await apiClient.post(`/user/forgot-password`,input)
  return response.data
}

export const resetPasswordAPI = async (input) => {
    console.log("input",input);
  const response = await apiClient.post(`/user/reset-password`,input)
  return response.data
}

export const getUserDetailAPI = async () => {
  console.log("getUserDetailAPI called with ID:",headerData()); // <--- should log when triggered

  try {
    const response = await apiClient.get(
      `/admin/getUserDetail`
    );
    console.log("getUserDetailAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
     throw error
  }
};



