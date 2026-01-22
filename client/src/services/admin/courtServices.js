import { BASE_URL } from "../../../utils/config";
import { headerData } from "../../../utils/storageHandler";
import apiClient from "../api/axiosInstance";

export const addCourtAPI = async (data) => {
    try {
        const response = await apiClient.post(`${BASE_URL}/court/add-court`, data, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};
export const deleteCourtAPI = async (courtID) => {
    try{
        const response = await apiClient.delete(`${BASE_URL}/court/delete-court/${courtID}`,headerData());
        return response.data;
    }catch(error){
        throw error;
    }
}