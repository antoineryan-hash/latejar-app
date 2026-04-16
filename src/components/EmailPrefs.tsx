"use client";

import { useState } from "react";

type Props = {
  initialCadence: "2d" | "1w" | "never";
  initialTallyEnabled: boolean;
};

export function EmailPrefs({ initialCadence, initialTallyEnabled }: Props) {
  const [cadence, setCadence] = useState<Props["initialCadence"]>(
    initialCadence,
  );
  const [tallyEnabled, setTallyEnabled] = useState(initialTallyEnabled);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function save(nextFields: {
    nudge_cadence?: Props["initialCadence"];
    monthly_tally_enabled?: boolean;
  }) {
    setState("saving");
    try {
      const res = await fetch("/api/me/prefs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(nextFields),
      });
      if (!res.ok) throw new Error("bad status");
      setState("saved");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("error");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <span className="mono text-xs tracking-widest text-fg-dim uppercase">
        Email preferences
      </span>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-fg">Upgrade nudges</div>
          <div className="mono text-xs text-fg-dim">
            Reminder emails if you&apos;ve been late in the last week.
          </div>
        </div>
        <select
          value={cadence}
          onChange={(e) => {
            const v = e.target.value as Props["initialCadence"];
            setCadence(v);
            save({ nudge_cadence: v });
          }}
          className="mono rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg"
        >
          <option value="2d">Every 2 days</option>
          <option value="1w">Weekly</option>
          <option value="never">Never</option>
        </select>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
        <div>
          <div className="text-sm text-fg">Monthly tally</div>
          <div className="mono text-xs text-fg-dim">
            First of each month: your lateness total + pre-filled TIACS link.
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={tallyEnabled}
            onChange={(e) => {
              const v = e.target.checked;
              setTallyEnabled(v);
              save({ monthly_tally_enabled: v });
            }}
            className="h-4 w-4 accent-late"
          />
          <span className="mono text-xs text-fg-dim">
            {tallyEnabled ? "on" : "off"}
          </span>
        </label>
      </div>

      {state !== "idle" && (
        <div className="mono mt-4 text-xs text-fg-dim">
          {state === "saving" && "Saving…"}
          {state === "saved" && "✓ Saved"}
          {state === "error" && (
            <span className="text-late">Couldn&apos;t save — try again.</span>
          )}
        </div>
      )}
    </div>
  );
}
