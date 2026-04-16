/**
 * Upgrade nudge: Trackers with recent lateness get a prod every 2 days
 * (or weekly, if they dialled it down). Honours `nudge_cadence='never'`.
 */
import { Resend } from "resend";
import { sql } from "@/db";
import { signUnsubToken } from "@/lib/unsubscribe-token";

const FROM =
  process.env.RESEND_FROM_ADDRESS ?? "Late Jar <hello@latejar.app>";
const APP_URL = process.env.APP_URL ?? "https://latejar.app";

export type NudgeCandidate = {
  user_id: string;
  email: string;
  display_name: string | null;
  nudge_cadence: "2d" | "1w" | "never";
  minutes_last_7d: number;
};

const CADENCE_DAYS: Record<"2d" | "1w", number> = { "2d": 2, "1w": 7 };

/**
 * Trackers with ≥1 late minute in the last 7 days who haven't been
 * upgrade-nudged within their cadence. Excludes Donators and users
 * whose cadence is 'never'.
 */
export async function fetchNudgeCandidates(
  now: Date = new Date(),
): Promise<NudgeCandidate[]> {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  // One query with a correlated subquery for last-nudge check.
  // Returns only users where last-nudge is older than their cadence.
  const rows = await sql<NudgeCandidate[]>`
    WITH late_7d AS (
      SELECT a.user_id,
             SUM(GREATEST(a.minutes_late, 0))::int AS minutes_last_7d
      FROM arrivals a
      JOIN sessions s ON s.id = a.session_id
      WHERE a.user_id IS NOT NULL
        AND a.arrival_time IS NOT NULL
        AND s.scheduled_start >= ${sevenDaysAgo}
      GROUP BY a.user_id
      HAVING SUM(GREATEST(a.minutes_late, 0)) > 0
    ),
    last_nudge AS (
      SELECT user_id, MAX(sent_at) AS last_sent
      FROM nudges
      WHERE kind = 'upgrade'
      GROUP BY user_id
    )
    SELECT u.id            AS user_id,
           u.email         AS email,
           u.display_name  AS display_name,
           u.nudge_cadence AS nudge_cadence,
           l.minutes_last_7d AS minutes_last_7d
    FROM users u
    JOIN late_7d l ON l.user_id = u.id
    LEFT JOIN last_nudge n ON n.user_id = u.id
    WHERE u.tier = 'tracker'
      AND u.nudge_cadence <> 'never'
      AND (
        n.last_sent IS NULL OR
        (u.nudge_cadence = '2d' AND n.last_sent < ${now}::timestamptz - interval '2 days') OR
        (u.nudge_cadence = '1w' AND n.last_sent < ${now}::timestamptz - interval '7 days')
      )
  `;
  return rows;
}

export function renderNudgeHtml(args: {
  firstName: string;
  minutes: number;
  dollars: number;
  upgradeLink: string;
  unsubLink: string;
}): string {
  const { firstName, minutes, dollars, upgradeLink, unsubLink } = args;
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#0A0A0B;color:#E8E8EA;margin:0;padding:24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding-bottom:24px;">
      <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:2px;color:#8A8A90;text-transform:uppercase;">Late Jar · last 7 days</div>
      <h1 style="font-size:26px;line-height:1.2;margin:8px 0 16px;color:#F5F5F7;">Hey ${firstName}, ${minutes} min over the last week.</h1>
      <p style="font-size:16px;line-height:1.6;color:#B8B8BD;margin:0 0 24px;">
        That&rsquo;d be <strong style="color:#22C55E;">$${dollars} to TIACS</strong> if you were a Donator.
        We keep tracking either way — but you&rsquo;re leaving a lot of real good on the table.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${upgradeLink}" style="display:inline-block;background:#EF4444;color:#F5F5F7;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Become a Donator &rarr;</a>
      </p>
      <hr style="border:none;border-top:1px solid #23232A;margin:24px 0;" />
      <p style="font-size:12px;color:#5A5A60;line-height:1.6;margin:0;">
        Too frequent? <a href="${APP_URL}/dashboard" style="color:#8A8A90;">Switch to weekly in your dashboard</a>, or <a href="${unsubLink}" style="color:#8A8A90;">turn nudges off entirely</a>.
      </p>
    </td></tr>
  </table>
</body></html>`;
}

export type NudgeSendResult = {
  user_id: string;
  sent: boolean;
  reason?: string;
};

export async function sendNudgeForUser(
  row: NudgeCandidate,
): Promise<NudgeSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { user_id: row.user_id, sent: false, reason: "resend_not_configured" };
  }
  if (row.nudge_cadence === "never") {
    return { user_id: row.user_id, sent: false, reason: "opted_out" };
  }
  if (!(row.nudge_cadence in CADENCE_DAYS)) {
    return { user_id: row.user_id, sent: false, reason: "bad_cadence" };
  }

  const firstName = row.display_name?.split(" ")[0] ?? "there";
  const dollars = row.minutes_last_7d;
  const upgradeLink = `${APP_URL}/upgrade?utm_source=email&utm_campaign=upgrade_nudge`;
  const token = signUnsubToken(row.user_id, "upgrade");
  const unsubLink = `${APP_URL}/api/nudges/unsubscribe/upgrade?token=${token}`;

  const html = renderNudgeHtml({
    firstName,
    minutes: row.minutes_last_7d,
    dollars,
    upgradeLink,
    unsubLink,
  });

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM,
      to: row.email,
      subject: `${row.minutes_last_7d} min late this week → $${dollars} for TIACS?`,
      html,
      headers: {
        "List-Unsubscribe": `<${unsubLink}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
  } catch (err) {
    return {
      user_id: row.user_id,
      sent: false,
      reason: err instanceof Error ? err.message : "resend_error",
    };
  }

  await sql`INSERT INTO nudges (user_id, kind) VALUES (${row.user_id}, 'upgrade')`;
  return { user_id: row.user_id, sent: true };
}
