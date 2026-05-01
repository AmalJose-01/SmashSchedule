const env = process.env.VERCEL_ENV || "development";
const branch = process.env.VERCEL_GIT_COMMIT_REF || "local";

let BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

if (env === "production") {
  BASE_URL = "https://api-prod-orvq.onrender.com";
}

if (env === "preview") {
  if (branch === "qa") {
    BASE_URL = "https://main-qa.onrender.com";
  } else if (branch === "qanext") {
    BASE_URL = "https://qa-next.onrender.com";
  }
}

export default BASE_URL;`   `