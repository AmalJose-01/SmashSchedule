import axios from "axios";
import { getEnvToken, setEnvResult } from "./masterSession";

// Plain axios (not the app's axiosInstance): the master console talks to a
// different API per environment and must never trigger the club-admin 401
// logout/redirect.
const client = (env, token) =>
  axios.create({
    baseURL: env.api,
    timeout: 30000, // Render free instances can take a while to wake up
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

export const errorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.message ||
  (err?.response?.status === 404 ? "The master console isn't deployed on this server yet." : null) ||
  (err?.code === "ECONNABORTED" ? "Server took too long to respond (it may be waking up)" : err?.message) ||
  fallback;

export const masterLoginAPI = async (env, { email, password }) =>
  (await client(env).post("/master/login", { email, password })).data;

// Authenticated call for one environment; a 401 marks that env's session expired.
const authed = async (env, fn) => {
  const token = getEnvToken(env.key);
  if (!token) throw new Error("Not signed in to this environment");
  try {
    return await fn(client(env, token));
  } catch (err) {
    if (err?.response?.status === 401) setEnvResult(env.key, { status: "expired", error: "Session expired" });
    throw err;
  }
};

export const fetchClubsAPI = (env, params) =>
  authed(env, async (c) => (await c.get("/master/clubs", { params })).data);

export const fetchClubDetailAPI = (env, adminId) =>
  authed(env, async (c) => (await c.get(`/master/clubs/${adminId}`)).data);

export const impersonateAPI = (env, adminId) =>
  authed(env, async (c) => (await c.post(`/master/clubs/${adminId}/impersonate`)).data);

// Used by the hand-off page (club-admin token, the app's own backend).
export const getUserDetailWithToken = async (baseURL, token) =>
  (await axios.get(`${baseURL}/admin/getUserDetail`, { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 })).data;
