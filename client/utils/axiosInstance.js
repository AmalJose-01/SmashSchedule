import axios from "axios";
import { BASE_URL } from "./config.js";
import store from "../src/redux/store.js";
import { logOut } from "../src/redux/slices/userSlice.js";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logOut());
      // Clear membership-related localStorage keys
      localStorage.removeItem("memberId");
      localStorage.removeItem("selectedClubId");
      localStorage.removeItem("selectedClubName");
      localStorage.removeItem("clubAdminId");
      window.location.href = "/user/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
