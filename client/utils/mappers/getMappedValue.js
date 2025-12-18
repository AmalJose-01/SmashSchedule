import { normalizeHeader } from "../normalizers/normalizeHeader";

export const getMappedValue = (row, aliases = []) => {
  const normalizedRow = Object.entries(row).reduce((acc, [key, value]) => {
    acc[normalizeHeader(key)] = value;
    return acc;
  }, {});

  for (const alias of aliases) {
    if (normalizedRow[alias]) {
      return normalizedRow[alias];
    }
  }
  return "";
};
