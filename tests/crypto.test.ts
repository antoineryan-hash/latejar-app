import { beforeAll, describe, it, expect } from "vitest";

// A deterministic 32-byte base64url key for the test suite.
const TEST_KEY = "0123456789abcdefghijklmnopqrstuvwxyz012345A";

beforeAll(() => {
  process.env.TOKEN_ENC_KEY = TEST_KEY;
});

const { encrypt, decrypt } = await import("@/lib/crypto");

describe("crypto", () => {
  it("round-trips a simple string", () => {
    const ct = encrypt("hello world");
    expect(decrypt(ct)).toBe("hello world");
  });

  it("produces a different ciphertext every time (random IV)", () => {
    const a = encrypt("same");
    const b = encrypt("same");
    expect(a.toString("hex")).not.toBe(b.toString("hex"));
    expect(decrypt(a)).toBe("same");
    expect(decrypt(b)).toBe("same");
  });

  it("round-trips a realistic-length refresh token", () => {
    const token = "1//0g-" + "a".repeat(120); // shape of a Google refresh_token
    const ct = encrypt(token);
    expect(decrypt(ct)).toBe(token);
  });

  it("decrypt throws on tampered ciphertext", () => {
    const ct = encrypt("secret");
    // Flip a byte in the middle (not IV, not tag)
    ct[20] = ct[20] ^ 1;
    expect(() => decrypt(ct)).toThrow();
  });

  it("decrypt throws on too-short input", () => {
    expect(() => decrypt(Buffer.alloc(10))).toThrow();
  });
});
