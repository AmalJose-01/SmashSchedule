import { BASE_URL } from "../../../utils/config";
import { headerData } from "../../../utils/storageHandler";
import axios from "axios";
   import { mapVenueResponse } from "../../domain/mapper/venueMapper";


export const addVenueAPI = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/venue/create-venue`, data, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getAllVenuesAPI = async (userId) => {
        try {
    const response = await axios.get(`${BASE_URL}/venue/get-venues/${userId}`, headerData());
   console.log("getAll response:",response.data);
   

    return response.data;
     } catch (error) {
        log("getAllVenuesAPI error:", error);
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
        const response = await axios.delete(`${BASE_URL}/venue/delete-venue/${venueId}`, headerData());
        return response.data;
    } catch (error) {
        throw error;
    }
};

