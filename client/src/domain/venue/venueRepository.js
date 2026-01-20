import { get } from "react-hook-form";
import { addVenueAPI, deleteVenueAPI, getAllVenuesAPI, getVenueDetailByIdAPI } from "../../services/admin/venueServices";
import { mapVenueDetailResponse, mapVenueResponse } from "../mapper/venueMapper";

export const venueRepository = {
  saveVenue: (venueData) => addVenueAPI(venueData),

// getVenues: async (userId) => getAllVenuesAPI(userId),



  getVenues: async (userId) => {
    try {
      const response = await getAllVenuesAPI(userId);
      console.log("getAllVenuesAPI response:", response);
      

const venueArray = response?.venues || [];  
if (!venueArray.length) {
        return [];
      }
    return venueArray.map(mapVenueResponse);

    } catch (error) {
      log("venueRepository getVenues error:", error);
     
      throw error;
    }
  },

  deleteVenue: (venueId) => deleteVenueAPI(venueId),

  getVenueById: async (venueId, userId) => {
     const response = await getVenueDetailByIdAPI(venueId, userId);
 




    return mapVenueDetailResponse(response);
  },

};