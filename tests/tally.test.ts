import { describe, expect, it } from "vitest";
import { previousMonthWindow } from "../src/lib/tally";
import { tiacsDonationLink } from "../src/lib/tiacs";

describe("previousMonthWindow", () => {
  it("on April 16 returns [March 1, April 1) UTC", () => {
    const { start, end, label } = previousMonthWindow(
      new Date("2026-04-16T10:30:00Z"),
    );
    expect(start.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(label).toBe("March 2026");
  });

  it("on Jan 3 returns the previous December window", () => {
    const { start, end, label } = previousMonthWindow(
      new Date("2027-01-03T00:00:00Z"),
    );
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(label).toBe("December 2026");
  });
});

describe("tiacsDonationLink", () => {
  it("pre-fills amount and utm params", () => {
    const url = new URL(tiacsDonationLink(47, "Late Jar — March 2026"));
    expect(url.searchParams.get("amount")).toBe("47");
    expect(url.searchParams.get("utm_source")).toBe("latejar");
    expect(url.searchParams.get("utm_campaign")).toBe("monthly_tally");
    expect(url.searchParams.get("message")).toBe("Late Jar — March 2026");
  });

  it("rounds + floors to ≥1 dollar", () => {
    const url = new URL(tiacsDonationLink(0.4));
    expect(url.searchParams.get("amount")).toBe("1");
  });
});
