const crypto = require("crypto");

// AES-256-GCM helpers for encrypting per-admin secrets (e.g. each admin's own
// Square Application Secret) before storing them in MongoDB. This is a
// platform-level infra secret (ENCRYPTION_KEY) — distinct from any tenant's
// own Square credentials — and is fine to keep in server env vars since it
// never identifies or belongs to a specific customer.
const ALGO = "aes-256-gcm";

const getKey = () => {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY is missing or invalid. Set a 64-character hex string (32 bytes) in your .env."
    );
  }
  return Buffer.from(keyHex, "hex");
};

// Returns a single string: "ivHex:authTagHex:cipherTextHex" for easy storage.
const encrypt = (plainText) => {
  if (plainText === null || plainText === undefined) return null;
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

const decrypt = (payload) => {
  if (!payload) return null;
  const key = getKey();
  const [ivHex, authTagHex, dataHex] = payload.split(":");
  if (!ivHex || !authTagHex || !dataHex) return null;
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
};

// e.g. "sandbox-sq0idb-TcBY6j..." -> "sandbox-...9A" for safe display
const maskSecret = (value, visible = 4) => {
  if (!value) return null;
  if (value.length <= visible * 2) return "•".repeat(value.length);
  return `${value.slice(0, visible)}••••${value.slice(-visible)}`;
};

module.exports = { encrypt, decrypt, maskSecret };
