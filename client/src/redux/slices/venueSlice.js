import {createSlice} from "@reduxjs/toolkit";

const initialState = {
  venueData: {},
};

const venueSlice = createSlice({
  name: "venue",
  initialState,
  reducers: {
    setVenueData: (state, action) => {
      state.venueData = action.payload;
    },
    getVenueData: (state) => {
      return state.venueData;
    },
  },
});

export const {setVenueData, getVenueData} = venueSlice.actions;
export default venueSlice.reducer;