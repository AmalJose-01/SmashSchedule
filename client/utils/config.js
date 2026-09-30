// utils/config.js
// API address: VITE_API_URL if set (the CI/CD build sets it), otherwise
// localhost for `npm run dev` and the Render API for production builds.
export const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3000/api/v1" : "https://smashschedule-1.onrender.com/api/v1");

export const googleAPIkey = import.meta.env.VITE_GOOGLE_API_KEY;
export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const stripe_Publishable_key = import.meta.env
  .VITE_STRIPE_PUBLISHABLE_KEY;
  