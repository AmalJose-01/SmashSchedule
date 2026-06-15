const env = process.env.NODE_ENV; // development | production
const branch = process.env.VITE_BRANCH;

let BASE_URL = process.env.VITE_API_URL || "http://localhost:5000";

if (env === "production") {
  if (branch === "qa") {
    BASE_URL = "https://main-qa.onrender.com";
  } else if (branch === "qanext") {
    BASE_URL = "https://qa-next.onrender.com";
  } else if (!branch) {
    BASE_URL = process.env.VITE_API_URL || BASE_URL;
  } else {
    BASE_URL = "https://api-prod-orvq.onrender.com";
  }
}

module.exports = BASE_URL;