// src/config/api.js

const env = import.meta.env.MODE; // development | production
const branch = import.meta.env.VITE_BRANCH || "local";

let BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

if (env === "production") {
  if (branch === "qa") {
    BASE_URL = "https://main-qa.onrender.com";
  } else if (branch === "qanext") {
    BASE_URL = "https://qa-next.onrender.com";
  } else {
    BASE_URL = "https://api-prod-orvq.onrender.com";
  }
}

export default BASE_URL;