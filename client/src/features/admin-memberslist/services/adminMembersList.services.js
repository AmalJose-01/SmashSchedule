import axios from "axios";
import { BASE_URL } from "../../../../utils/config.js";
import { headerData } from "../../../../utils/storageHandler.js";

export const getAllMembers = async (page = 1, limit = 10, search = "", status = "") => {
  const response = await axios.get(`${BASE_URL}/membership/admin/members`, {
    params: { page, limit, search, status },
    ...headerData(),
  });
  return response.data;
};

export const deleteMember = async (memberId) => {
  const response = await axios.delete(
    `${BASE_URL}/membership/admin/members/${memberId}`,
    headerData()
  );
  return response.data;
};

export const updateMember = async (memberId, data) => {
  const response = await axios.put(
    `${BASE_URL}/membership/admin/members/${memberId}`,
    data,
    headerData()
  );
  return response.data;
};
