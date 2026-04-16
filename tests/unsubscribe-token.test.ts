import { beforeAll, describe, expect, it } from "vitest";

// TOKEN_ENC_KEY must be set before the module is imported. 32-byte key,
// base64url-encoded. Same format the app uses in .env.local.
beforeAll(() => {
  process.env.TOKEN_ENC_KEY = Buffer.alloc(32, 42).toString("base64url");
});

describe("unsubscribe-token", () => {
  it("round-trips a (userId, kind) pair", async () => {
    const { signUnsubToken, verifyUnsubToken } = await import(
      "../src/lib/unsubscribe-token"
    );
    const t = signUnsubToken("user-abc", "monthly_tally");
    const parsed = verifyUnsubToken(t);
    expect(parsed).toEqual({ userId: "user-abc", kind: "monthly_tally" });
  });

  it("rejects a tampered MAC", async () => {
    const { signUnsubToken, verifyUnsubToken } = await import(
      "../src/lib/unsubscribe-token"
    );
    const t = signUnsubToken("u", "k");
    const parts = t.split(".");
    const tampered = `${parts[0]}.${parts[1]}.AAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
    expect(verifyUnsubToken(tampered)).toBeNull();
  });

  it("rejects a swapped userId with the original MAC", async () => {
    const { signUnsubToken, verifyUnsubToken } = await import(
      "../src/lib/unsubscribe-token"
    );
    const t = signUnsubToken("u1", "monthly_tally");
    const parts = t.split(".");
    const swapped = `u2.${parts[1]}.${parts[2]}`;
    expect(verifyUnsubToken(swapped)).toBeNull();
  });

  it("rejects a swapped kind", async () => {
    const { signUnsubToken, verifyUnsubToken } = await import(
      "../src/lib/unsubscribe-token"
    );
    const t = signUnsubToken("u1", "monthly_tally");
    const parts = t.split(".");
    const swapped = `${parts[0]}.some_other_kind.${parts[2]}`;
    expect(verifyUnsubToken(swapped)).toBeNull();
  });

  it("rejects garbage input", async () => {
    const { verifyUnsubToken } = await import("../src/lib/unsubscribe-token");
    expect(verifyUnsubToken("totally-not-a-token")).toBeNull();
    expect(verifyUnsubToken("")).toBeNull();
    expect(verifyUnsubToken("a.b")).toBeNull();
  });
});
