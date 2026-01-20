import { BASE_URL } from "../../../utils/config";
import { headerData } from "../../../utils/storageHandler";
import axios from "axios";
import apiClient from "../api/axiosInstance";


export const addVenueAPI = async (data) => {
    try {
        const response = await apiClient.post(`${BASE_URL}/venue/create-venue`, data, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getAllVenuesAPI = async (userId) => {
        try {
    const response = await apiClient.get(`${BASE_URL}/venue/get-venues/${userId}`, headerData());
   

      return response.data || [];
     } catch (error) {
   console.log("getAll response:",error);
    if (error?.response?.status === 404) {
      return []; // fallback protection
    }
        throw error;
    }
};

export const getVenueDetailByIdAPI = async (venueId, userId) => {
    try {
        const response = await apiClient.get(`${BASE_URL}/venue/get-venue-detail/${venueId}/${userId}`, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};



export const addCourtAPI = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/venue/add-court`, data, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};


export const updateVenueAPI = async (data) => {
    const response = await axios.put("/venue/update-venue", data, headerData());
    return response.data;
};

export const deleteVenueAPI = async (venueId) => {
    try {
        const response = await apiClient.delete(`${BASE_URL}/venue/delete-venue/${venueId}`, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

