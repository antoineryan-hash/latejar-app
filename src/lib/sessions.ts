/**
 * Session (live meeting) upsert + shortcode generation.
 *
 * Sessions map 1:1 to Google Calendar events where ≥2 Late Jar users
 * are invitees. The shortcode is the user-facing URL slug for /m/[code].
 */
import { randomBytes } from "node:crypto";
import { sql } from "@/db";

const SHORTCODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L
const SHORTCODE_LEN = 4;

export function generateShortcode(): string {
  const buf = randomBytes(SHORTCODE_LEN);
  let out = "";
  for (let i = 0; i < SHORTCODE_LEN; i++) {
    out += SHORTCODE_ALPHABET[buf[i] % SHORTCODE_ALPHABET.length];
  }
  return out;
}

export type UpsertSessionInput = {
  calendar_event_id: string;
  title: string | null;
  scheduled_start: Date;
  scheduled_end: Date | null;
};

/**
 * Upsert a session by calendar_event_id. Returns the session row.
 * On conflict, keeps the existing shortcode + title (caller can Update
 * title separately if needed).
 */
export async function upsertSession(
  input: UpsertSessionInput,
): Promise<{ id: string; shortcode: string; is_new: boolean }> {
  const existing = await sql<
    Array<{ id: string; shortcode: string }>
  >`SELECT id, shortcode FROM sessions WHERE calendar_event_id = ${input.calendar_event_id} LIMIT 1`;

  if (existing.length > 0) {
    // Update scheduled_start/end in case the event was rescheduled.
    await sql`
      UPDATE sessions
      SET scheduled_start = ${input.scheduled_start},
          scheduled_end = ${input.scheduled_end},
          title = COALESCE(${input.title}, title)
      WHERE id = ${existing[0].id}
    `;
    return { id: existing[0].id, shortcode: existing[0].shortcode, is_new: false };
  }

  // Collision-safe insert: try up to 10 shortcodes
  for (let attempt = 0; attempt < 10; attempt++) {
    const shortcode = generateShortcode();
    try {
      const rows = await sql<
        Array<{ id: string; shortcode: string }>
      >`
        INSERT INTO sessions (shortcode, calendar_event_id, title, scheduled_start, scheduled_end)
        VALUES (${shortcode}, ${input.calendar_event_id}, ${input.title}, ${input.scheduled_start}, ${input.scheduled_end})
        RETURNING id, shortcode
      `;
      return { id: rows[0].id, shortcode: rows[0].shortcode, is_new: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Unique constraint violation on either shortcode or calendar_event_id
      if (!message.includes("duplicate key")) throw err;
      // Retry: either shortcode clash (unlikely 1 in 1M for 4 chars) OR
      // another cron instance just won the race on calendar_event_id.
      // Re-run SELECT to grab the existing row.
      const raceRow = await sql<
        Array<{ id: string; shortcode: string }>
      >`SELECT id, shortcode FROM sessions WHERE calendar_event_id = ${input.calendar_event_id} LIMIT 1`;
      if (raceRow.length > 0) {
        return { id: raceRow[0].id, shortcode: raceRow[0].shortcode, is_new: false };
      }
    }
  }
  throw new Error("Could not generate a unique shortcode after 10 attempts");
}

/** Find sessions that should have closed already but haven't. */
export async function autoCloseExpired(): Promise<number> {
  // scheduled_end + 30 min, or scheduled_start + 2 hours if no end.
  const rows = await sql<Array<{ id: string }>>`
    UPDATE sessions
    SET closed_at = now()
    WHERE closed_at IS NULL
      AND COALESCE(scheduled_end, scheduled_start + interval '2 hours') + interval '30 minutes' < now()
    RETURNING id
  `;
  return rows.length;
}
