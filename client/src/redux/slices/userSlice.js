import { createSlice } from "@reduxjs/toolkit";
import {
  getAccessToken,
  getRefreshToken,
  getUser,
} from "../../../utils/storageHandler";


const initialUserDetail = {
  user: getUser() || null,
  accessToken: getAccessToken() || null,
  refreshToken: getRefreshToken() || null,
};

const userSlice = createSlice({
  name: "user",
  initialState: initialUserDetail,

  reducers: {
    loginUser: (state, action) => {
      console.log("action.payload", action.payload);

      state.user = action.payload.user
        ? { ...state.user, ...action.payload.user }
        : state.user ?? getUser();

      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
    },
    updateUser: (state, action) => {
      console.log("action.payload", action.payload);

      state.user = action.payload.user
        ? { ...state.user, ...action.payload.user }
        : state.user ?? getUser();

      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logOut: (state) => {
      state.user = null;
      localStorage.removeItem("user");
      localStorage.removeItem("tournamentDetail");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
    clearUser: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
  },
});

export const { loginUser, logOut, clearUser,updateUser } = userSlice.actions;
export default userSlice.reducer;
