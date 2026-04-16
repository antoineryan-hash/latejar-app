import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { fetchUserStats } from "@/lib/user-stats";
import { EmailPrefs } from "@/components/EmailPrefs";

export const dynamic = "force-dynamic";
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

  const stats = await fetchUserStats(user.id);
  const minutesLate = stats.minutes_this_month;
  const dollarsForgone = minutesLate;
  const firstName = user.display_name?.split(" ")[0];

  return (
    <main className="flex-1 px-6 py-20">
      <div className="mx-auto max-w-prose">
        {welcome && (
          <div className="mb-8 rounded-xl border border-raised/40 bg-raised/10 px-5 py-4 text-raised">
            Welcome in. You&apos;re signed up as a <strong>Tracker</strong> —
            we&apos;ll start watching your meetings. No card, no cost.
          </div>
        )}

        <span className="mono text-xs tracking-widest text-fg-dim uppercase">Your jar</span>
        <h1 className="mt-2 text-3xl md:text-4xl">
          Hi{firstName ? `, ${firstName}` : ""}.
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
            <p className="mt-2 text-sm text-fg-muted">
              {stats.sessions_this_month === 0
                ? "No tracked meetings yet this month."
                : `Across ${stats.sessions_this_month} meeting${stats.sessions_this_month === 1 ? "" : "s"}.`}
            </p>
          </div>

          <div className="rounded-2xl border border-late/40 bg-late/5 p-6">
            <span className="mono text-xs tracking-widest text-late uppercase">
              {user.tier === "donator" ? "Due this month" : "Forgone donations"}
            </span>
            <div className="mono mt-2 text-5xl font-bold text-late">${dollarsForgone}</div>
            {user.tier === "tracker" ? (
              <p className="mt-2 text-sm text-fg-muted">
                That&apos;s what you&apos;d donate to TIACS this month as a Donator.{" "}
                <Link href="/upgrade" className="underline text-fg hover:text-late">
                  Upgrade →
                </Link>
              </p>
            ) : (
              <p className="mt-2 text-sm text-fg-muted">
                We&apos;ll email you 48 hours before we charge your card.
              </p>
            )}
          </div>
        </div>

        {stats.minutes_lifetime > minutesLate && (
          <p className="mono mt-4 text-xs text-fg-dim">
            Lifetime: {stats.minutes_lifetime} min · ${stats.minutes_lifetime}
          </p>
        )}

        <div className="mt-10">
          <EmailPrefs
            initialCadence={user.nudge_cadence}
            initialTallyEnabled={user.monthly_tally_enabled}
          />
        </div>

        <div className="mt-8 rounded-xl border border-border bg-surface px-5 py-4">
          <p className="text-sm text-fg-muted">
            Your live meetings appear at{" "}
            <span className="mono text-fg">latejar.app/m/&lt;code&gt;</span> once
            we detect them on your calendar. We only look at events in the
            next 60 minutes where ≥2 Late Jar members are on the invite.
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
