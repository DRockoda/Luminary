import crypto from "node:crypto";
import { env } from "../env.js";

const ALGO = "aes-256-gcm";

function getServerKey(): Buffer {
  const hex = env.ENCRYPTION_SERVER_KEY;
  if (hex.length !== 64) {
    throw new Error("ENCRYPTION_SERVER_KEY must be 64 hex chars (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

export function encryptString(plaintext: string, key: Buffer = getServerKey()): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(".");
}

export function decryptString(payload: string, key: Buffer = getServerKey()): string {
  const [ivB64, tagB64, ctB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("Malformed ciphertext");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plaintext.toString("utf8");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateSalt(bytes = 16): string {
  return crypto.randomBytes(bytes).toString("hex");
}
