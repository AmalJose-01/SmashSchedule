import axios from "axios";
import { BASE_URL } from "../../utils/config";


export const  registerAPI = async (input) => {
    const response = await axios.post(`${BASE_URL}/user/signup`,input)
    return response.data

}

export const loginAPI = async (input) => {
    
  const response = await axios.post(`${BASE_URL}/admin/login`,input)
  return response.data
}



export const loginWithGoogleAPI = async (input) => {
    console.log("input",input);
    
  const response = await axios.post(`${BASE_URL}/admin/loginGoogle`,input)
  return response.data
}


export const forgotPasswordAPI = async (input) => {
    console.log("input",input);
    
  const response = await axios.post(`${BASE_URL}/user/forgot-password`,input)
  return response.data
}

export const resetPasswordAPI = async (input) => {
    console.log("input",input);
  const response = await axios.post(`${BASE_URL}/user/reset-password`,input)
  return response.data
}
