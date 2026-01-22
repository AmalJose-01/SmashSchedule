import { configureStore } from "@reduxjs/toolkit"
import tournamentReducer  from "./slices/tournamentSlice"
import userReducer from "./slices/userSlice"
import venueReducer from "./slices/venueSlice"

const store = configureStore({
  reducer: {
    tournament: tournamentReducer,
      user: userReducer,
      venue: venueReducer,


  },
 
})

export default store