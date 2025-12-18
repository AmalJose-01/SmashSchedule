export const normalizeHeader = (header = "") =>
  header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // remove spaces, :, _, etc
    .trim();
