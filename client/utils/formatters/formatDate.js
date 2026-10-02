// src/utils/formatters/formatDate.js
// export const formatDate = (dateStr) => {
//   if (!dateStr) return null;
//   const [day, month, year] = dateStr.split("/");
//   return `${year}-${month}-${day}`;
// };
export const formatDate = (value) => {
  if (!value) return null;

  // Excel serial number
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return date.toISOString().split("T")[0];
  }

  // Already ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
    return value;
  }

  // DD/MM/YYYY or D/M/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split("/");
    // Pad single digits with leading 0
    const day = dd.padStart(2, "0");
    const month = mm.padStart(2, "0");
    return `${yyyy}-${month}-${day}`;
  }

  // Fallback
  const date = new Date(value);
  if (!isNaN(date)) {
    return date.toISOString().split("T")[0];
  }

  return null;
};

