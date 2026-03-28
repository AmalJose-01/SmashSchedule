import axios from "axios";
import { BASE_URL } from "../../../../../utils/config.js";
import { headerData } from "../../../../../utils/storageHandler.js";

/**
 * Create a new membership type
 */
export const createMembershipType = async (typeData) => {
  const response = await axios.post(
    `${BASE_URL}/membership/admin/membership-types`,
    typeData,
    headerData()
  );
  return response.data;
};

/**
 * Get all membership types (admin view)
 */
export const getAllMembershipTypes = async () => {
  const response = await axios.get(
    `${BASE_URL}/membership/admin/membership-types`,
    headerData()
  );
  return response.data;
};

/**
 * Update a membership type
 */
export const updateMembershipType = async (typeId, typeData) => {
  const response = await axios.put(
    `${BASE_URL}/membership/admin/membership-types/${typeId}`,
    typeData,
    headerData()
  );
  return response.data;
};

/**
 * Delete a membership type
 */
export const deleteMembershipType = async (typeId) => {
  const response = await axios.delete(
    `${BASE_URL}/membership/admin/membership-types/${typeId}`,
    headerData()
  );
  return response.data;
};
