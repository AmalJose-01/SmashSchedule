// Admin accounts must be approved (isVerified: true in the adminusers
// collection) before they can use the app. Player accounts are unaffected.
const ADMIN_SUPPORT_EMAIL = "info@webfluence.au";
const ADMIN_NOT_VERIFIED_CODE = "ADMIN_NOT_VERIFIED";
const ADMIN_NOT_VERIFIED_MESSAGE =
  `Your admin account hasn't been verified yet. Please contact the admin at ${ADMIN_SUPPORT_EMAIL}.`;

const isUnverifiedAdmin = (user) => user?.accountType === "admin" && user?.isVerified !== true;

const sendAdminNotVerified = (res) =>
  res.status(403).json({ code: ADMIN_NOT_VERIFIED_CODE, message: ADMIN_NOT_VERIFIED_MESSAGE });

module.exports = { isUnverifiedAdmin, sendAdminNotVerified, ADMIN_NOT_VERIFIED_CODE, ADMIN_NOT_VERIFIED_MESSAGE };
