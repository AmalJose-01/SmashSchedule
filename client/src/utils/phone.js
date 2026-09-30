// Kept in sync with server/utils/phone.js.
const PHONE_CHARS = /^\+?[0-9\s\-().]+$/;

export const isValidPhone = (value) => {
  const v = String(value ?? "").trim();
  if (!v) return true; // contact is optional
  if (!PHONE_CHARS.test(v)) return false;
  const digits = v.replace(/\D/g, "").length;
  return digits >= 8 && digits <= 15;
};

export const INVALID_PHONE_MESSAGE = "Enter a valid contact number (8–15 digits, e.g. 0412 345 678 or +61 412 345 678)";
