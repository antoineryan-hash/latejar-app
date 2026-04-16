/**
 * Signed one-click unsubscribe tokens. HMAC-SHA256 over `user_id:kind`,
 * stateless (no DB row), so unsubscribe links in outbound email work
 * without adding a row per send.
 *
 * Secret: TOKEN_ENC_KEY reused (already a 32-byte base64url secret). We
 * domain-separate by prefixing the HMAC input so a stolen unsubscribe
 * token can't be reused as an encryption key or vice versa.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const DOMAIN = "latejar:unsub:v1";

function secret(): Buffer {
  const key = process.env.TOKEN_ENC_KEY;
  if (!key) throw new Error("TOKEN_ENC_KEY not set");
  return Buffer.from(key, "base64url");
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64url");
}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

export function signUnsubToken(userId: string, kind: string): string {
  const payload = `${DOMAIN}|${userId}|${kind}`;
  const mac = createHmac("sha256", secret()).update(payload).digest();
  return `${userId}.${kind}.${b64urlEncode(mac)}`;
}

export function verifyUnsubToken(
  token: string,
): { userId: string; kind: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, kind, macB64] = parts;
  if (!userId || !kind) return null;
  let provided: Buffer;
  try {
    provided = b64urlDecode(macB64);
  } catch {
    return null;
  }
  const expected = createHmac("sha256", secret())
    .update(`${DOMAIN}|${userId}|${kind}`)
    .digest();
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(provided, expected)) return null;
  return { userId, kind };
}
