import apiClient from "./api/axiosInstance.js";
import { BASE_URL } from "../../utils/config";
import { headerData } from "../../utils/storageHandler";
import { useDispatch } from "react-redux";



export const subscriptionAPI = async (paymentData) => {
  console.log("subscriptionAPI called with ID:",headerData()); // <--- should log when triggered

  try {
    const response = await apiClient.post(
      `/payment/subscription`,paymentData
    );
    console.log("subscriptionAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
       throw error;
  }
};

export const createCheckoutAPI = async (paymentData) => {
  console.log("subscriptionAPI called with ID:",headerData()); // <--- should log when triggered

  try {
    const response = await apiClient.post(
      `/payment/create-checkout`,paymentData
    );
    console.log("createCheckoutAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {

 console.log("createCheckoutAPI error", error);
    throw error;
  }
};

