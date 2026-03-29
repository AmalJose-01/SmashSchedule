import apiClient from "../../../services/api/axiosInstance.js";
import { BASE_URL } from "../../../../utils/config.js";
import { headerData } from "../../../../utils/storageHandler.js";

export const getAllMembers = async (page = 1, limit = 10, search = "", status = "") => {
  const response = await apiClient.get(`/membership/admin/members`, {
    params: { page, limit, search, status },
  });
  return response.data;
};

export const deleteMember = async (memberId) => {
  const response = await apiClient.delete(
    `/membership/admin/members/${memberId}`
  );
  return response.data;
};

export const updateMember = async (memberId, data) => {
  const response = await apiClient.put(
    `/membership/admin/members/${memberId}`,
    data
  );
  return response.data;
};
