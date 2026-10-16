// "Support mode" marker for THIS browser tab only (sessionStorage), set by the
// hand-off page while a master is signed in as a club admin. userSlice.logOut
// clears it, so logging out / token expiry also ends the banner.
const KEY = "supportMode";

export const getSupportMode = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};

export const setSupportMode = (info) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...info, since: Date.now() }));
  } catch {
    /* storage unavailable */
  }
};

export const clearSupportMode = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
};
