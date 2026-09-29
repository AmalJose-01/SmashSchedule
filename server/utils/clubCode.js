// Club code: a unique 8-character key players use to find a club (typed in
// or scanned from the club's QR code). Uses an unambiguous alphabet — no
// 0/O, 1/I/L — so it's easy to read out loud or copy by hand.
const crypto = require("crypto");

const CLUB_CODE_LENGTH = 8;
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const randomCode = () => {
  let code = "";
  for (let i = 0; i < CLUB_CODE_LENGTH; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
};

/**
 * Returns a code not used by any existing club. With 31^8 (~850 billion)
 * combinations a collision is astronomically unlikely, but we still check.
 */
const generateUniqueClubCode = async (ClubModel) => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const taken = await ClubModel.exists({ clubCode: code });
    if (!taken) return code;
  }
  throw new Error("Could not generate a unique club code");
};

const normaliseClubCode = (value) =>
  String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

const isClubCodeShape = (value) =>
  new RegExp(`^[${ALPHABET}]{${CLUB_CODE_LENGTH}}$`).test(normaliseClubCode(value));

/**
 * Ensures the admin has a club document with a code. Never replaces an
 * existing code (so printed/shared QR codes keep working). Returns the club.
 */
const ensureClubWithCode = async (ClubModel, adminId) => {
  const existing = await ClubModel.findOne({ adminId });
  if (existing?.clubCode) return existing;

  const clubCode = await generateUniqueClubCode(ClubModel);
  // Only set the code if it's still missing — safe if two requests race.
  return ClubModel.findOneAndUpdate(
    { adminId, $or: [{ clubCode: { $exists: false } }, { clubCode: null }, { clubCode: "" }] },
    { $set: { clubCode } }, // adminId comes from the filter on insert
    { new: true, upsert: !existing }
  ).then((club) => club || ClubModel.findOne({ adminId }));
};

module.exports = {
  CLUB_CODE_LENGTH,
  generateUniqueClubCode,
  normaliseClubCode,
  isClubCodeShape,
  ensureClubWithCode,
};
