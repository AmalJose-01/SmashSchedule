import axios from "axios";
import { BASE_URL } from "../config";
import { store } from "../../redux/store";
import { logOut } from "../../redux/slices/userSlice";
import { toast } from "sonner";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // if cookies used
});

/**
 * RESPONSE INTERCEPTOR
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      toast.dismiss();
      toast.error(
        error?.response?.data?.message || "Session expired. Please login again."
      );

      // Redux logout
      store.dispatch(logOut());

      // Hard redirect (safe even outside React)
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
