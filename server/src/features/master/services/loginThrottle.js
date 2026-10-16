// Tiny in-memory brute-force guard for /master/login:
// MAX_FAILS failed attempts per ip+email inside WINDOW_MS => 429 until it expires.
// (Per server instance — fine for a single Render service.)
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const attempts = new Map(); // key -> { count, first }

const keyOf = (ip, email) => `${ip}|${String(email || "").toLowerCase()}`;

const isBlocked = (ip, email) => {
  const rec = attempts.get(keyOf(ip, email));
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) {
    attempts.delete(keyOf(ip, email));
    return false;
  }
  return rec.count >= MAX_FAILS;
};

const recordFailure = (ip, email) => {
  const k = keyOf(ip, email);
  const rec = attempts.get(k);
  if (!rec || Date.now() - rec.first > WINDOW_MS) attempts.set(k, { count: 1, first: Date.now() });
  else rec.count += 1;
};

const clear = (ip, email) => attempts.delete(keyOf(ip, email));

module.exports = { isBlocked, recordFailure, clear };
