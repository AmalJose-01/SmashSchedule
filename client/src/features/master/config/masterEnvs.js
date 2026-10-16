// Environments the master console can manage. Each one is a separate backend
// (and database) with its own frontend; `appUrl` is where "Open as admin"
// sends you, so the club dashboard talks to the right API.
const ENVS = [
  { key: "prod", label: "Production", api: "https://smashschedule-1.onrender.com/api/v1", appUrl: "https://rallix.com.au" },
  { key: "qa", label: "QA", api: "https://smashschedule-qa.onrender.com/api/v1", appUrl: "https://qa.rallix.com.au" },
  { key: "dev", label: "Dev", api: "https://devrallix.onrender.com/api/v1", appUrl: "https://dev.rallix.com.au" },
];

// `npm run dev` also gets a Local environment (your own backend + Vite app).
if (import.meta.env.DEV) {
  ENVS.unshift({
    key: "local",
    label: "Local",
    api: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
    appUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
  });
}

export const MASTER_ENVS = ENVS;
export const getEnv = (key) => ENVS.find((e) => e.key === key) || null;
