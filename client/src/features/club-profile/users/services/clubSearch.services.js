import apiClient from "../../../../services/api/axiosInstance.js";
import { BASE_URL } from "../../../../../utils/config.js";

export const searchClubs = async ({ q, lat, lng, radius } = {}) => {
  const params = {};
  if (q) params.q = q;
  if (lat) params.lat = lat;
  if (lng) params.lng = lng;
  if (radius) params.radius = radius;
  const response = await apiClient.get(`/club/search`, { params });
  return response.data;
};

export const getClubById = async (clubId) => {
  const response = await apiClient.get(`/club/${clubId}`);
  return response.data;
};
