// utils/config.js
const getBaseURL = () => {
  // Explicit env var takes priority
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Auto-detect based on Vercel URL
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("qa-next")) {
      return "https://qa-next.onrender.com/api/v1";
    }
    if (host.includes("smash-schedule.vercel.app")) {
      return "https://smashschedule-1.onrender.com/api/v1";
    }
  }

  // Default to localhost for local development
  return "http://localhost:3000/api/v1";
};

export const BASE_URL = getBaseURL();

export const googleAPIkey = import.meta.env.VITE_GOOGLE_API_KEY;
export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const stripe_Publishable_key = import.meta.env
  .VITE_STRIPE_PUBLISHABLE_KEY;
