// utils/config.js
// API address: VITE_API_URL if set (the CI/CD build sets it), otherwise
// localhost for `npm run dev` and the Render API for production builds.
// Each site always talks to its own backend, decided by the address the app
// is opened on — so a wrong/missing build setting can never point dev or QA
// at production.
const API_BY_HOST = {
  "rallix.com.au": "https://smashschedule-1.onrender.com/api/v1",
  "www.rallix.com.au": "https://smashschedule-1.onrender.com/api/v1",
  "qa.rallix.com.au": "https://smashschedule-qa.onrender.com/api/v1",
  "dev.rallix.com.au": "https://devrallix.onrender.com/api/v1",
};
const hostApi = typeof window !== "undefined" ? API_BY_HOST[window.location.hostname] : undefined;

export const BASE_URL =
  hostApi ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3000/api/v1" : "https://smashschedule-1.onrender.com/api/v1");

export const googleAPIkey = import.meta.env.VITE_GOOGLE_API_KEY;
export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const stripe_Publishable_key = import.meta.env
  .VITE_STRIPE_PUBLISHABLE_KEY;
  