import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getLiveSession } from "@/lib/live-session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Session summary" };

export default async function ClosedSessionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await getCurrentUser();
  const state = await getLiveSession(code.toUpperCase(), user?.id ?? null);
  if (!state) notFound();

  const arrived = state.attendees.filter((a) => a.arrival_time);
  const missed = state.attendees.filter((a) => !a.arrival_time);
  const totalMinutesLate = arrived.reduce((acc, a) => acc + (a.minutes_late ?? 0), 0);
  const forgoneDollars = totalMinutesLate;

  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <span className="mono text-xs tracking-widest text-fg-dim uppercase">Session closed</span>
        <h1 className="mt-2 text-3xl md:text-4xl">
          {state.title || "Meeting"}
        </h1>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <span className="mono text-xs tracking-widest text-fg-dim uppercase">Total late</span>
            <div className="mono mt-2 text-5xl font-bold text-fg">{totalMinutesLate} min</div>
          </div>
          <div className="rounded-2xl border border-late/40 bg-late/5 p-6">
            <span className="mono text-xs tracking-widest text-late uppercase">
              Forgone donations
            </span>
            <div className="mono mt-2 text-5xl font-bold text-late">${forgoneDollars}</div>
            <p className="mt-2 text-sm text-fg-muted">
              That's what this meeting would've raised for TIACS if everyone were a Donator.
            </p>
          </div>
        </div>

        {arrived.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl">Who showed up</h2>
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {arrived.map((a) => (
                <li key={a.user_id} className="flex items-center justify-between px-5 py-4">
                  <span>{a.display_name ?? a.email}</span>
                  <span className="mono text-sm text-fg-muted">
                    {a.minutes_late === 0 ? "on time" : `+${a.minutes_late} min`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {missed.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl">No-shows</h2>
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {missed.map((a) => (
                <li key={a.user_id} className="px-5 py-4 text-fg-muted">
                  {a.display_name ?? a.email}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-12 text-center text-sm text-fg-muted">
          <Link href="/dashboard" className="underline text-fg hover:text-late">
            ← Back to your dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
