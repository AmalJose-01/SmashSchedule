import apiClient from "../../../../services/api/axiosInstance.js";
import { BASE_URL } from "../../../../../utils/config.js";
import { headerData } from "../../../../../utils/storageHandler.js";

export const getMyClubProfile = async () => {
  const response = await apiClient.get(`/club/my-profile`);
  return response.data;
};

export const upsertClubProfile = async (profileData) => {
  const response = await apiClient.put(`/club/my-profile`, profileData);
  return response.data;
};

export const uploadClubLogo = async (file) => {
  const formData = new FormData();
  formData.append("logo", file);
  const response = await apiClient.post(`/club/upload-logo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
