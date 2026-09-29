import apiClient from "../../../services/api/axiosInstance.js";

export const getMyUserDetail = async () => {
  const response = await apiClient.get(`/user-detail/me`);
  return response.data;
};

export const saveMyUserDetail = async (data) => {
  const response = await apiClient.put(`/user-detail/me`, data);
  return response.data;
};
