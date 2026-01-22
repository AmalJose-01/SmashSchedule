import { createSlice } from "@reduxjs/toolkit";
import { getTournamentDetail } from "../../../utils/storageHandler";
const initialState = {
  tournamentData: getTournamentDetail() || {},
};

const tournamentSlice = createSlice({
  name: "tournament",
  initialState,
  reducers: {
    setTournamentData: (state, action) => {
      state.tournamentData = action.payload;
      localStorage.setItem("tournamentDetail", JSON.stringify(action.payload)); 
    },
    getTournamentData: (state) => {
      return state.tournamentData;
    },
    clearTournamentData: (state) => {
      state.tournamentData = {};
      localStorage.removeItem("tournamentDetail");
    },
  },
});

export const { setTournamentData } = tournamentSlice.actions;
export default tournamentSlice.reducer;