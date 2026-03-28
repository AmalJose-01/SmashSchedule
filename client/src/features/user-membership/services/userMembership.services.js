import axiosInstance from "../../../../utils/axiosInstance.js";
import { headerData } from "../../../../utils/storageHandler.js";

export const getMyMemberships = async () => {
  const response = await axiosInstance.get("/membership/my-memberships", headerData());
  return response.data;
};
