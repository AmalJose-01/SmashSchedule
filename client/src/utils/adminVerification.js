// Unverified admin handling (server replies 403 with code ADMIN_NOT_VERIFIED
// on login and on any request made with an existing session).
import store from "../redux/store";
import { logOut } from "../redux/slices/userSlice";

export const ADMIN_NOT_VERIFIED_CODE = "ADMIN_NOT_VERIFIED";
export const ADMIN_SUPPORT_EMAIL = "info@webfluence.au";
const DEFAULT_MESSAGE = `Your admin account hasn't been verified yet. Please contact the admin at ${ADMIN_SUPPORT_EMAIL}.`;

export const isAdminNotVerifiedError = (error) =>
  error?.response?.status === 403 && error?.response?.data?.code === ADMIN_NOT_VERIFIED_CODE;

let handling = false; // several requests can fail at once — alert only once

// Show the alert, clear the session and send them to the home page.
export const forceLogoutUnverifiedAdmin = (message = DEFAULT_MESSAGE) => {
  if (handling) return;
  handling = true;
  window.alert(message || DEFAULT_MESSAGE);
  store.dispatch(logOut());
  window.location.href = "/";
};
