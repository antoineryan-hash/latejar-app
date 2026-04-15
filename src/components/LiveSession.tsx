"use client";

import { useEffect, useState, useTransition } from "react";
import type { LiveSessionState, Attendee } from "@/lib/live-session";

type Props = { initial: LiveSessionState };

export function LiveSession({ initial }: Props) {
  const [state, setState] = useState(initial);
  const [now, setNow] = useState(new Date().toISOString());
  const [isPending, startTransition] = useTransition();

  // Poll every 2s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/m/${initial.shortcode}/state`, {
          cache: "no-store",
        });
        if (res.ok) setState(await res.json());
      } catch {
        // ignore; next tick will retry
      }
    }, 2000);
    return () => clearInterval(id);
  }, [initial.shortcode]);

  // 1-Hz local clock for the ticker (no polling required)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toISOString()), 1000);
    return () => clearInterval(id);
  }, []);

  const selfRow = state.attendees.find((a) => a.user_id === state.self_user_id);
  const isInvited = !!selfRow;
  const startTime = new Date(state.scheduled_start);
  const elapsedMs = new Date(now).getTime() - startTime.getTime();
  const hasStarted = elapsedMs >= 0;
  const ticker = formatDuration(Math.abs(elapsedMs));

  async function handleTap() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/m/${state.shortcode}/tap`, {
          method: "POST",
        });
        if (res.ok) {
          const nextState = await fetch(`/api/m/${state.shortcode}/state`, {
            cache: "no-store",
          });
          if (nextState.ok) setState(await nextState.json());
        }
      } catch {
        // ignore
      }
    });
  }

  async function handleClose() {
    if (!confirm("Close this session? Un-tapped people will count as 'didn't attend'.")) return;
    const res = await fetch(`/api/m/${state.shortcode}/close`, { method: "POST" });
    if (res.ok) {
      window.location.href = `/m/${state.shortcode}/closed`;
    }
  }

  const closed = !!state.closed_at;

  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <span className="mono text-xs tracking-widest text-fg-dim uppercase">
            {closed ? "Session closed" : hasStarted ? "Live" : "Starting soon"}
          </span>
          <h1 className="mt-2 text-3xl md:text-4xl">
            {state.title || "Meeting"}
          </h1>
          <p className="mono mt-4 text-lg text-fg-muted">
            {closed
              ? "Closed"
              : hasStarted
                ? `+${ticker} since ${formatTime(startTime)} start`
                : `${ticker} until ${formatTime(startTime)} start`}
          </p>
          <p className="mono mt-1 text-xs text-fg-dim">
            Shortcode: <span className="text-fg">{state.shortcode}</span>
          </p>
        </header>

        {!isInvited && state.self_user_id && (
          <div className="mb-6 rounded-xl border border-warn/40 bg-warn/10 px-5 py-4 text-sm text-fg-muted">
            You're not on the calendar invite for this meeting — you can watch the list fill up
            but you can't tap yourself in here.
          </div>
        )}

        {!state.self_user_id && (
          <div className="mb-6 rounded-xl border border-border bg-surface px-5 py-4 text-sm text-fg-muted">
            You're not signed in — you can see the room but can't tap. <a className="underline text-fg hover:text-late" href="/login">Sign in with Google</a>.
          </div>
        )}

        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {state.attendees.map((a) => (
            <AttendeeRow
              key={a.user_id}
              a={a}
              isSelf={a.user_id === state.self_user_id}
              canTap={!closed && a.user_id === state.self_user_id && !a.arrival_time}
              pending={isPending && a.user_id === state.self_user_id}
              onTap={handleTap}
            />
          ))}
          {state.attendees.length === 0 && (
            <li className="px-5 py-6 text-sm text-fg-muted">
              No Late Jar members are on the invite for this event yet.
            </li>
          )}
        </ul>

        {!closed && state.self_user_id && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleClose}
              className="mono text-sm text-fg-dim underline hover:text-late"
            >
              Close session
            </button>
          </div>
        )}

        {closed && (
          <p className="mt-8 text-center text-sm text-fg-muted">
            This session has closed.{" "}
            <a className="underline text-fg hover:text-late" href={`/m/${state.shortcode}/closed`}>
              See the summary →
            </a>
          </p>
        )}
      </div>
    </section>
  );
}

function AttendeeRow({
  a,
  isSelf,
  canTap,
  pending,
  onTap,
}: {
  a: Attendee;
  isSelf: boolean;
  canTap: boolean;
  pending: boolean;
  onTap: () => void;
}) {
  const arrived = !!a.arrival_time;
  const name = a.display_name ?? a.email;
  const tint = arrived
    ? a.tier === "donator"
      ? "bg-raised/10 border-l-2 border-raised"
      : "bg-fg/5 border-l-2 border-fg-dim"
    : "";

  return (
    <li className={`flex items-center justify-between px-5 py-4 ${tint}`}>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-fg">{name}</span>
          {isSelf && <span className="mono text-xs text-fg-dim">(you)</span>}
          {a.tier === "donator" && (
            <span className="mono text-xs text-raised">$</span>
          )}
        </div>
        <div className="mono mt-1 text-xs text-fg-dim">
          {arrived ? (
            <>
              here · {a.minutes_late === 0 ? "on time" : `+${a.minutes_late} min`}
              {a.source && a.source !== "tap" && ` · ${a.source}`}
            </>
          ) : (
            "not here yet"
          )}
        </div>
      </div>
      {canTap ? (
        <button
          disabled={pending}
          onClick={onTap}
          className="rounded-lg bg-late px-4 py-2 text-sm font-semibold text-fg shadow-[0_0_30px_-10px_rgba(239,68,68,0.6)] transition-colors hover:bg-late-deep disabled:opacity-60"
        >
          {pending ? "…" : "I'm here"}
        </button>
      ) : arrived && isSelf ? (
        <span className="mono text-xs text-raised">✓ tapped</span>
      ) : null}
    </li>
  );
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
}
