import { BASE_URL } from "../../../utils/config";
import { headerData } from "../../../utils/storageHandler";
import apiClient from "../api/axiosInstance";

export const getVenueListAPI = async (userId) => {
    try {
       const  response = await apiClient.get(`${BASE_URL},/admin/tournament/get-venue/${userId}`)
   return  response.data
    } catch (error) {
       throw error; 
    }
};

export const getCourtListByVenueAPI = async (userId,venueId) => {
    try {
       const  response = await apiClient.get(`${BASE_URL},/admin/tournament/get-court/${userId}/${venueId}`)
   return  response.data
    } catch (error) {
       throw error; 
    }
};