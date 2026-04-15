import { fetchStats, formatLaunchDate } from "@/lib/stats";
import { Sparkline } from "@/components/Sparkline";
import { LIVE_JAR } from "@/content/copy";

export async function LiveJar() {
  const stats = await fetchStats();
  const hasData = stats.lifetime_total_dollars > 0 || stats.month_total_minutes > 0;

  return (
    <section
      id="live-jar"
      className="border-b border-border px-6 py-20"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="mono text-xs tracking-widest text-fg-dim uppercase">
              Live
            </span>
            <h2 className="mt-1 text-3xl md:text-4xl">{LIVE_JAR.heading}</h2>
          </div>
          <span className="mono hidden text-xs text-fg-dim md:inline">
            updated daily
          </span>
        </div>

        {hasData ? (
          <p className="mt-4 max-w-3xl text-fg-muted">
            Since we flipped this on{" "}
            <span className="text-fg">{formatLaunchDate(stats.launch_date)}</span>
            , the UpScale team has been late{" "}
            <span className="mono font-semibold text-late">
              {stats.month_total_minutes} minutes
            </span>{" "}
            this month and forfeited{" "}
            <span className="mono font-semibold text-raised">
              ${stats.month_total_dollars}
            </span>{" "}
            to <a className="text-fg underline hover:text-late" href="https://tiacs.org" target="_blank" rel="noreferrer">TIACS</a>.
          </p>
        ) : (
          <p className="mt-4 max-w-3xl text-fg-muted">
            {LIVE_JAR.emptyState}
          </p>
        )}

        {/* main card: lifetime counter + sparkline */}
        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-baseline justify-between">
              <span className="mono text-xs tracking-widest text-fg-dim uppercase">
                Last 30 days
              </span>
              <span className="mono text-xs text-fg-dim">
                ${stats.lifetime_total_dollars} lifetime
              </span>
            </div>
            <Sparkline
              data={stats.sparkline_30d}
              className="mt-6 text-late"
            />
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-border bg-surface p-6 md:min-w-[220px]">
            <span className="mono text-xs tracking-widest text-fg-dim uppercase">
              This month
            </span>
            <span className="mono mt-2 text-5xl font-bold text-raised">
              ${stats.month_total_dollars}
            </span>
            <span className="mono mt-1 text-sm text-fg-muted">
              from {stats.month_total_minutes} min late
            </span>
          </div>
        </div>

        {/* leaderboard */}
        {stats.leaderboard.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl">{LIVE_JAR.leaderboardTitle}</h3>
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {stats.leaderboard.map((row, i) => (
                <li
                  key={row.handle}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="mono w-6 text-sm text-fg-dim">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-fg">{row.handle}</span>
                  </div>
                  <span className="mono text-late">${row.dollars}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
