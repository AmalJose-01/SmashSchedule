import { get } from "react-hook-form";
import { addVenueAPI, getAllVenuesAPI } from "../../services/admin/venueServices";
import { mapVenueResponse } from "../mapper/venueMapper";

export const venueRepository = {
  saveVenue: (venueData) => addVenueAPI(venueData),

// getVenues: async (userId) => getAllVenuesAPI(userId),



  getVenues: async (userId) => {
    try {
      const response = await getAllVenuesAPI(userId);
      console.log("getAllVenuesAPI response:", response.venues.map(mapVenueResponse));
      
      // Assuming response is an array of venues
      return response.venues.map(mapVenueResponse);
    } catch (error) {
      log("venueRepository getVenues error:", error);
     
      throw error;
    }
  },
};