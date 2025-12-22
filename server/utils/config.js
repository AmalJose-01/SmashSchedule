
require("dotenv").config();


 const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://smash-schedule.vercel.app"
    : "http://localhost:5173";

    module.exports = BASE_URL