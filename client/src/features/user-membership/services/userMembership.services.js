import axiosInstance from "../../../../utils/axiosInstance.js";
import { headerData } from "../../../../utils/storageHandler.js";

export const getMyMemberships = async () => {
  const response = await axiosInstance.get("/membership/my-memberships", headerData());
  return response.data;
};

export const cancelMembership = async (memberId) => {
  const response = await axiosInstance.put(`/membership/${memberId}/cancel`, {}, headerData());
  return response.data;
};
