/**
 * AES-256-GCM encrypt/decrypt using TOKEN_ENC_KEY.
 *
 * Stores: [12-byte IV][ciphertext][16-byte auth tag]
 * all as one Buffer, base64url-encoded at the DB boundary.
 *
 * Uses Node's crypto (available in Next.js server runtime).
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function getKey(): Buffer {
  const keyStr = process.env.TOKEN_ENC_KEY;
  if (!keyStr) throw new Error("TOKEN_ENC_KEY not set");
  // base64url → buffer (replace chars back to standard b64)
  const b64 = keyStr.replace(/-/g, "+").replace(/_/g, "/");
  const buf = Buffer.from(b64, "base64");
  if (buf.length !== 32) {
    throw new Error(`TOKEN_ENC_KEY must decode to 32 bytes, got ${buf.length}`);
  }
  return buf;
}

export function encrypt(plaintext: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // [iv | ciphertext | tag]
  return Buffer.concat([iv, ct, tag]);
}

export function decrypt(blob: Buffer): string {
  if (blob.length < 28) throw new Error("ciphertext too short");
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(blob.length - 16);
  const ct = blob.subarray(12, blob.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}
