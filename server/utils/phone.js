// Contact number check: optional leading "+", then digits with optional
// spaces, dashes, dots or brackets; 8–15 digits in total (covers local and
// international numbers, e.g. "0412 345 678", "+61 412 345 678", "(03) 9123 4567").
const PHONE_CHARS = /^\+?[0-9\s\-().]+$/;

const isValidPhone = (value) => {
  const v = String(value ?? "").trim();
  if (!v) return true; // contact is optional
  if (!PHONE_CHARS.test(v)) return false;
  const digits = v.replace(/\D/g, "").length;
  return digits >= 8 && digits <= 15;
};

const INVALID_PHONE_MESSAGE = "Enter a valid contact number (8–15 digits, e.g. 0412 345 678 or +61 412 345 678)";

module.exports = { isValidPhone, INVALID_PHONE_MESSAGE };
