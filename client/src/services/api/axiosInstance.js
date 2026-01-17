import axios from "axios";
import { BASE_URL } from "../../../utils/config";
import { logOut } from "../../redux/slices/userSlice";
import { toast } from "sonner";
import { getAccessToken, headerData } from "../../../utils/storageHandler";
import store from "../../redux/store";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    // withCredentials: true, // if cookies used
});

axiosInstance.interceptors.request.use((config) => {
      const token = getAccessToken();

    if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {

        console.log("All error ", error);
        
        const status = error?.response?.status;

        if (status === 401) {
            console.log("Axios Interceptor - 401 Unauthorized");

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
