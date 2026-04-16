/**
 * Monthly tally: aggregate each user's late minutes for a past month,
 * build a pre-filled TIACS donation link, send the email.
 *
 * Safe to retry: dedupes via `nudges` table (one 'monthly_tally' per
 * user per calendar month that we send in).
 */
import { Resend } from "resend";
import { sql } from "@/db";
import { tiacsDonationLink } from "@/lib/tiacs";
import { signUnsubToken } from "@/lib/unsubscribe-token";

const FROM =
  process.env.RESEND_FROM_ADDRESS ?? "Late Jar <hello@latejar.app>";
const APP_URL = process.env.APP_URL ?? "https://latejar.app";

export type TallyRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  tier: "tracker" | "donator";
  monthly_tally_enabled: boolean;
  total_minutes: number;
};

/**
 * Returns the UTC window [start, end) covering the most recent
 * completed calendar month at the given `now`.
 */
export function previousMonthWindow(now: Date): {
  start: Date;
  end: Date;
  label: string;
} {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const label = start.toLocaleString("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { start, end, label };
}

/**
 * Per-user lateness totals for [start, end). Only counts arrivals where
 * the person actually arrived (minutes_late NOT NULL).
 */
export async function fetchTally(start: Date, end: Date): Promise<TallyRow[]> {
  const rows = await sql<TallyRow[]>`
    SELECT u.id            AS user_id,
           u.email          AS email,
           u.display_name   AS display_name,
           u.tier           AS tier,
           u.monthly_tally_enabled AS monthly_tally_enabled,
           SUM(GREATEST(a.minutes_late, 0))::int AS total_minutes
    FROM users u
    JOIN arrivals a ON a.user_id = u.id AND a.arrival_time IS NOT NULL
    JOIN sessions s ON s.id = a.session_id
    WHERE s.scheduled_start >= ${start}
      AND s.scheduled_start <  ${end}
    GROUP BY u.id, u.email, u.display_name, u.tier, u.monthly_tally_enabled
    HAVING SUM(GREATEST(a.minutes_late, 0)) > 0
  `;
  return rows;
}

/**
 * Has this user already been sent a monthly_tally in the current calendar
 * month-of-send? Dedupe guard.
 */
export async function alreadyTalliedThisMonth(
  userId: string,
  now: Date,
): Promise<boolean> {
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const rows = await sql<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM nudges
      WHERE user_id = ${userId}
        AND kind = 'monthly_tally'
        AND sent_at >= ${monthStart}
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}

export function renderTallyHtml(args: {
  firstName: string;
  monthLabel: string;
  minutes: number;
  dollars: number;
  donationLink: string;
  upgradeLink: string;
  unsubLink: string;
}): string {
  const { firstName, monthLabel, minutes, dollars, donationLink, upgradeLink, unsubLink } = args;
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#0A0A0B;color:#E8E8EA;margin:0;padding:24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="padding-bottom:24px;">
      <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:2px;color:#8A8A90;text-transform:uppercase;">Late Jar · ${monthLabel}</div>
      <h1 style="font-size:28px;line-height:1.2;margin:8px 0 16px;color:#F5F5F7;">Hi ${firstName}, your ${monthLabel} jar is in.</h1>
      <p style="font-size:16px;line-height:1.6;color:#B8B8BD;margin:0 0 24px;">
        You were <strong style="color:#EF4444;">${minutes} minutes late</strong> across Late Jar meetings in ${monthLabel}. If you&rsquo;d been a Donator, that would&rsquo;ve been
        <strong style="color:#22C55E;">$${dollars} to TIACS</strong>.
      </p>
      <p style="font-size:16px;line-height:1.6;color:#B8B8BD;margin:0 0 32px;">Want to make it real right now? Here&rsquo;s a one-click link pre-filled with your amount:</p>
      <p style="margin:0 0 24px;">
        <a href="${donationLink}" style="display:inline-block;background:#EF4444;color:#F5F5F7;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Donate $${dollars} to TIACS &rarr;</a>
      </p>
      <p style="font-size:14px;line-height:1.6;color:#8A8A90;margin:0 0 8px;">Or, if you&rsquo;d rather we just handle it every month:</p>
      <p style="margin:0 0 32px;">
        <a href="${upgradeLink}" style="color:#F5F5F7;text-decoration:underline;font-size:14px;">Become a Donator &rarr;</a>
      </p>
      <hr style="border:none;border-top:1px solid #23232A;margin:24px 0;" />
      <p style="font-size:12px;color:#5A5A60;line-height:1.6;margin:0;">
        You&rsquo;re a Tracker on Late Jar. We send this tally once a month.
        <a href="${unsubLink}" style="color:#8A8A90;">Stop monthly tallies</a>.
      </p>
    </td></tr>
  </table>
</body></html>`;
}

export type TallySendResult = {
  user_id: string;
  sent: boolean;
  reason?: string;
};

export async function sendTallyForUser(
  row: TallyRow,
  monthLabel: string,
  now: Date = new Date(),
): Promise<TallySendResult> {
  if (!row.monthly_tally_enabled) {
    return { user_id: row.user_id, sent: false, reason: "opted_out" };
  }
  if (await alreadyTalliedThisMonth(row.user_id, now)) {
    return { user_id: row.user_id, sent: false, reason: "already_sent" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { user_id: row.user_id, sent: false, reason: "resend_not_configured" };
  }

  const firstName = row.display_name?.split(" ")[0] ?? "there";
  const dollars = row.total_minutes; // $1 per minute
  const donationLink = tiacsDonationLink(
    dollars,
    `Late Jar — ${monthLabel} — ${row.email}`,
  );
  const upgradeLink = `${APP_URL}/upgrade?utm_source=email&utm_campaign=monthly_tally`;
  const token = signUnsubToken(row.user_id, "monthly_tally");
  const unsubLink = `${APP_URL}/api/nudges/unsubscribe/monthly-tally?token=${token}`;

  const html = renderTallyHtml({
    firstName,
    monthLabel,
    minutes: row.total_minutes,
    dollars,
    donationLink,
    upgradeLink,
    unsubLink,
  });

  const subject = `Your ${monthLabel} late jar: $${dollars} for TIACS`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM,
      to: row.email,
      subject,
      html,
      headers: {
        // RFC 8058 one-click unsubscribe — keeps us out of the
        // promotions tab and honours modern spam-bot behaviour.
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

  await sql`INSERT INTO nudges (user_id, kind) VALUES (${row.user_id}, 'monthly_tally')`;
  return { user_id: row.user_id, sent: true };
}
