import apiClient from "../../../services/api/axiosInstance.js";

export const getMyUserDetail = async () => {
  const response = await apiClient.get(`/user-detail/me`);
  return response.data;
};

export const saveMyUserDetail = async (data) => {
  const response = await apiClient.put(`/user-detail/me`, data);
  return response.data;
};

// Permanently deletes the signed-in player's account and related data.
export const deleteMyAccount = async () => {
  const response = await apiClient.delete(`/user-detail/account`, { data: { confirm: "DELETE" } });
  return response.data;
};
