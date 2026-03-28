import axios from "axios";
import { BASE_URL } from "../../../../../utils/config.js";
import { headerData } from "../../../../../utils/storageHandler.js";

export const getMyClubProfile = async () => {
  const response = await axios.get(`${BASE_URL}/club/my-profile`, headerData());
  return response.data;
};

export const upsertClubProfile = async (profileData) => {
  const response = await axios.put(`${BASE_URL}/club/my-profile`, profileData, headerData());
  return response.data;
};

export const uploadClubLogo = async (file) => {
  const formData = new FormData();
  formData.append("logo", file);
  const response = await axios.post(`${BASE_URL}/club/upload-logo`, formData, {
    ...headerData(),
    headers: { ...headerData().headers, "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
