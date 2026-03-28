import axios from "axios";
import { BASE_URL } from "../../../../utils/config.js";
import { headerData } from "../../../../utils/storageHandler.js";

export const getAllMembershipTypes = async () => {
  const response = await axios.get(
    `${BASE_URL}/membership/admin/membership-types`,
    headerData()
  );
  return response.data;
};

export const createMembershipType = async (typeData) => {
  const response = await axios.post(
    `${BASE_URL}/membership/admin/membership-types`,
    typeData,
    headerData()
  );
  return response.data;
};

export const updateMembershipType = async (typeId, typeData) => {
  const response = await axios.put(
    `${BASE_URL}/membership/admin/membership-types/${typeId}`,
    typeData,
    headerData()
  );
  return response.data;
};

export const deleteMembershipType = async (typeId) => {
  const response = await axios.delete(
    `${BASE_URL}/membership/admin/membership-types/${typeId}`,
    headerData()
  );
  return response.data;
};
