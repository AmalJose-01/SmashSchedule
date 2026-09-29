// Remembers where a logged-out user was headed (e.g. a scanned club QR
// link like /user/find-club?code=XXXXXXXX) so login can send them back.
const KEY = "redirectAfterLogin";

export const rememberRedirect = (path) => {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    /* storage unavailable */
  }
};

// Returns the saved path for this role (only same-app, role-matching paths)
// and clears it.
export const takeRedirect = (accountType) => {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!path || !path.startsWith("/")) return null;
    if (accountType === "user" && path.startsWith("/user/")) return path;
    return null;
  } catch {
    return null;
  }
};
