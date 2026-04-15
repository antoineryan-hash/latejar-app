"use client";

import { useState } from "react";

type Props = { stripeReady: boolean };

export function UpgradeCta({ stripeReady }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  async function handleInterest() {
    setState("loading");
    try {
      const res = await fetch("/api/upgrade-interest", { method: "POST" });
      if (!res.ok) throw new Error("bad status");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (stripeReady) {
    // Real Stripe SetupIntent flow — lands when STRIPE_SECRET_KEY is set.
    // For now stubbed; the button keeps its place so swap is one file.
    return (
      <button
        disabled
        className="mono rounded-lg bg-late px-6 py-3 text-sm font-semibold text-fg opacity-60"
      >
        Stripe setup (coming any minute)
      </button>
    );
  }

  if (state === "done") {
    return (
      <div className="rounded-xl border border-raised/40 bg-raised/10 px-5 py-4 text-sm text-raised">
        ✓ Noted. We&apos;ll email you the second Donator charges go live.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <button
        onClick={handleInterest}
        disabled={state === "loading"}
        className="mono rounded-lg bg-late px-6 py-3 text-sm font-semibold text-fg shadow-[0_0_30px_-10px_rgba(239,68,68,0.6)] transition-colors hover:bg-late-deep disabled:opacity-60"
      >
        {state === "loading" ? "…" : "Email me when charges go live"}
      </button>
      {state === "error" && (
        <span className="mono text-xs text-late">
          Something broke — try again in a sec.
        </span>
      )}
      <span className="mono text-xs text-fg-dim">
        Card-saving + monthly charge ships end of this week.
      </span>
    </div>
  );
}
