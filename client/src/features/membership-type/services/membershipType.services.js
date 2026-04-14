import apiClient from "../../../services/api/axiosInstance.js";
import { BASE_URL } from "../../../../utils/config.js";
import { headerData } from "../../../../utils/storageHandler.js";

export const getAllMembershipTypes = async () => {
  const response = await apiClient.get(
    `/membership/admin/membership-types`
  );
  return response.data;
};

export const createMembershipType = async (typeData) => {
  const response = await apiClient.post(
    `/membership/admin/membership-types`,
    typeData
  );
  return response.data;
};

export const updateMembershipType = async (typeId, typeData) => {
  const response = await apiClient.put(
    `/membership/admin/membership-types/${typeId}`,
    typeData
  );
  return response.data;
};

export const deleteMembershipType = async (typeId) => {
  const response = await apiClient.delete(
    `/membership/admin/membership-types/${typeId}`
  );
  return response.data;
};
