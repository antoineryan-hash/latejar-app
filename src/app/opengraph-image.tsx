import { ImageResponse } from "next/og";

export const alt =
  "Late Jar — late jar for meetings, auto-donates to the cause your team picks";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#0a0a0b",
          color: "#fafafa",
          fontFamily: "system-ui",
          backgroundImage:
            "radial-gradient(ellipse 800px 400px at 50% -10%, rgba(239,68,68,0.18), transparent)",
        }}
      >
        {/* Top row: brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "28px",
            color: "#a1a1aa",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "999px",
              backgroundColor: "#ef4444",
              boxShadow: "0 0 24px 4px rgba(239,68,68,0.6)",
            }}
          />
          Late Jar
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "92px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#fafafa",
            }}
          >
            Late jar for meetings.
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "92px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#ef4444",
            }}
          >
            <span>Auto-donates to the cause</span>
            <span>your team picks.</span>
          </div>
        </div>

        {/* Bottom row: url + tagline */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: "26px",
            color: "#a1a1aa",
          }}
        >
          <div style={{ display: "flex", gap: "24px", color: "#71717a" }}>
            <span>$1 / minute late</span>
            <span style={{ color: "#27272a" }}>·</span>
            <span>10% platform fee</span>
            <span style={{ color: "#27272a" }}>·</span>
            <span>charity gets the rest</span>
          </div>
          <div
            style={{
              fontSize: "30px",
              color: "#fafafa",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            latejar.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
