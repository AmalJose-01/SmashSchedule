import apiClient from "../../../services/api/axiosInstance.js";

export const getMyClubs = async () => (await apiClient.get(`/user-detail/clubs`)).data;
export const addMyClub = async (clubId) => (await apiClient.post(`/user-detail/clubs`, { clubId })).data;
export const setClubFavourite = async ({ clubId, isFavourite }) =>
  (await apiClient.patch(`/user-detail/clubs/${clubId}`, { isFavourite })).data;
export const removeMyClub = async (clubId) => (await apiClient.delete(`/user-detail/clubs/${clubId}`)).data;
export const getClubEvents = async (clubId) => (await apiClient.get(`/club/${clubId}/events`)).data;
