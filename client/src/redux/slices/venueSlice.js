import {createSlice} from "@reduxjs/toolkit";

const initialState = {
  venueData: {},
};

const venueSlice = createSlice({
  
  
  name: "venue",
  initialState,
  reducers: {
    setVenueData: (state, action) => {
      console.log("setVenueData action:", action);
      state.venueData = action.payload;
    },
    getVenueData: (state) => {
      return state.venueData;
    },
    clearVenueData: (state) => {
      state.venueData = {};
    },
  },
});

export const {setVenueData, getVenueData, clearVenueData} = venueSlice.actions;
export default venueSlice.reducer;