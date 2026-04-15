import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Resend SDK before importing the route under test.
// Use a class so `new Resend(apiKey)` constructs correctly in vitest 4.
const mockContactsCreate = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    contacts = { create: mockContactsCreate };
  },
}));

// Ensure env is set so the route doesn't short-circuit to 500 "server_not_configured"
beforeEach(() => {
  process.env.RESEND_API_KEY = "test_key";
  process.env.RESEND_AUDIENCE_ID = "test_audience";
  mockContactsCreate.mockReset();
});

const { POST } = await import("@/app/api/waitlist/route");

function makeReq(body: unknown) {
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/waitlist", () => {
  it("rejects missing email with 400", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("rejects malformed email with 400", async () => {
    const res = await POST(makeReq({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("creates Resend contact and returns 200 on valid email", async () => {
    mockContactsCreate.mockResolvedValueOnce({ data: { id: "x" } });
    const res = await POST(
      makeReq({ email: "user@example.com", workspace: "Acme" }),
    );
    expect(res.status).toBe(200);
    expect(mockContactsCreate).toHaveBeenCalledWith({
      email: "user@example.com",
      audienceId: "test_audience",
      firstName: "Acme",
    });
  });

  it("returns 500 if Resend errors", async () => {
    mockContactsCreate.mockRejectedValueOnce(new Error("Resend down"));
    const res = await POST(makeReq({ email: "user@example.com" }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when env vars are not configured", async () => {
    delete process.env.RESEND_API_KEY;
    const res = await POST(makeReq({ email: "user@example.com" }));
    expect(res.status).toBe(500);
  });
});
