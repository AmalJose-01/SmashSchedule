import { createSlice } from "@reduxjs/toolkit";
import { getUser } from "../../../utils/storageHandler";

const initialUserDetail = {
  user: getUser() || null,
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
    logOut: (state) => {
      state.user = null;
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
});

export const { loginUser, logOut } = userSlice.actions;
export default userSlice.reducer;
