import axios from "axios";
import { BASE_URL } from "../../utils/config";
import { headerData } from "../../utils/storageHandler";



export const subscriptionAPI = async (paymentData) => {
  console.log("subscriptionAPI called with ID:",headerData()); // <--- should log when triggered

  try {
    const response = await axios.post(
      `${BASE_URL}/payment/subscription`,paymentData,headerData()
    );
    console.log("getKnockoutScheduleAPI response:====", response.data); // <--- log the full response
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch tournament details"
    );
  }
};
