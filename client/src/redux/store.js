import { configureStore } from "@reduxjs/toolkit"
import tournamentReducer  from "./slices/tournamentSlice"
import userReducer from "./slices/userSlice"

const store = configureStore({
  reducer: {
    tournament: tournamentReducer,
      user: userReducer,


  },
 
})

export default store