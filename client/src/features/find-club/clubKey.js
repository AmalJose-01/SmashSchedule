// Club keys are 8 chars from an unambiguous alphabet (no 0/O, 1/I/L) —
// kept in sync with server/utils/clubCode.js.
export const CLUB_KEY_LENGTH = 8;
const KEY_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;

export const normaliseClubKey = (value) =>
  String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

export const isValidClubKey = (value) => KEY_RE.test(normaliseClubKey(value));

/**
 * A scanned QR is normally the club's share link
 * (…/club-search?code=XXXXXXXX), but accept a bare key too.
 */
export const extractClubKey = (text) => {
  const raw = String(text || "").trim();
  try {
    const url = new URL(raw);
    const code = url.searchParams.get("code");
    if (code && isValidClubKey(code)) return normaliseClubKey(code);
  } catch {
    /* not a URL */
  }
  return isValidClubKey(raw) ? normaliseClubKey(raw) : null;
};
