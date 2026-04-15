import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { welcome } = await searchParams;

  // MVP stub values. Real data lands when the calendar poller + attendance
  // pipeline ship (see plan v2 Day 3+). Copy treats "no data yet" kindly.
  const minutesLate = 0;
  const dollarsForgone = minutesLate;

  return (
    <main className="flex-1 px-6 py-20">
      <div className="mx-auto max-w-prose">
        {welcome && (
          <div className="mb-8 rounded-xl border border-raised/40 bg-raised/10 px-5 py-4 text-raised">
            Welcome in. You're signed up as a <strong>Tracker</strong> — we'll start watching your
            meetings. No card, no cost.
          </div>
        )}

        <span className="mono text-xs tracking-widest text-fg-dim uppercase">Your jar</span>
        <h1 className="mt-2 text-3xl md:text-4xl">
          Hi{user.display_name ? `, ${user.display_name.split(" ")[0]}` : ""}.
        </h1>

        <p className="mono mt-6 text-sm text-fg-dim">
          Signed in as {user.email} · Tier: <span className="text-fg">{user.tier}</span>
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <span className="mono text-xs tracking-widest text-fg-dim uppercase">
              This month
            </span>
            <div className="mono mt-2 text-5xl font-bold text-fg">{minutesLate} min</div>
            <p className="mt-2 text-sm text-fg-muted">Total late minutes, across all tracked meetings.</p>
          </div>

          <div className="rounded-2xl border border-late/40 bg-late/5 p-6">
            <span className="mono text-xs tracking-widest text-late uppercase">
              Forgone donations
            </span>
            <div className="mono mt-2 text-5xl font-bold text-late">${dollarsForgone}</div>
            {user.tier === "tracker" ? (
              <p className="mt-2 text-sm text-fg-muted">
                That's what you'd have donated to TIACS this month if you were a Donator.{" "}
                <Link href="/upgrade" className="underline text-fg hover:text-late">
                  Upgrade →
                </Link>
              </p>
            ) : (
              <p className="mt-2 text-sm text-fg-muted">
                Your card charges for this amount at end of month. We send a heads-up email 48 hours before.
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-border bg-surface px-5 py-4">
          <p className="text-sm text-fg-muted">
            We're just getting started — your live meetings will appear here once the calendar
            poller picks them up. Zero meetings? Zero minutes. Zero dollars. You're winning.
          </p>
        </div>

        <form action="/api/auth/logout" method="post" className="mt-12">
          <button
            type="submit"
            className="mono text-sm text-fg-dim underline hover:text-late"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
