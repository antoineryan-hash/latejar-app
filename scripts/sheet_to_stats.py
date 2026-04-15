#!/usr/bin/env python3
"""
Reads the UpScale Late Jar Google Sheet and produces stats.json for latejar.app.

Run daily via Railway cron. Uses a Google Sheets service account specified in
GOOGLE_APPLICATION_CREDENTIALS. Pure aggregation logic is separated from I/O
to keep the unit tests hermetic.

Expected Sheet columns (row 2 onward):
    A: ISO date (YYYY-MM-DD)
    B: person display name
    C: minutes late (integer)

Anonymises people in the output: rank-1 becomes "Team Member 1", rank-2
becomes "Team Member 2", etc. Names never leave the server.
"""

from __future__ import annotations

import json
import os
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

# ---------- pure logic (unit tested) ----------


def aggregate_rows(rows, *, today):
    """Return this-month totals + top-5 anonymised leaderboard from raw Sheet rows."""
    month_start = today.replace(day=1)
    by_person = defaultdict(int)
    month_minutes = 0
    for row in rows:
        if len(row) < 3:
            continue
        try:
            d = date.fromisoformat(row[0])
            minutes = int(row[2])
        except (ValueError, IndexError):
            continue
        if d < month_start or d > today:
            continue
        by_person[row[1]] += minutes
        month_minutes += minutes

    ranked = sorted(by_person.items(), key=lambda kv: kv[1], reverse=True)
    leaderboard = [
        {"handle": f"Team Member {i + 1}", "dollars": minutes}
        for i, (_, minutes) in enumerate(ranked[:5])
    ]
    return {
        "month_total_minutes": month_minutes,
        "month_total_dollars": month_minutes,
        "leaderboard": leaderboard,
    }


def build_sparkline(rows, *, today, days=30):
    start = today - timedelta(days=days - 1)
    daily = defaultdict(int)
    for row in rows:
        if len(row) < 3:
            continue
        try:
            d = date.fromisoformat(row[0])
            minutes = int(row[2])
        except (ValueError, IndexError):
            continue
        if start <= d <= today:
            daily[d] += minutes
    return [daily[start + timedelta(days=i)] for i in range(days)]


def lifetime_dollars(rows):
    total = 0
    for row in rows:
        if len(row) < 3:
            continue
        try:
            total += int(row[2])
        except (ValueError, IndexError):
            continue
    return total


def make_stats(rows, *, today, launch_date):
    agg = aggregate_rows(rows, today=today)
    return {
        "generated_at": datetime.now(timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
        "launch_date": launch_date,
        "month_total_minutes": agg["month_total_minutes"],
        "month_total_dollars": agg["month_total_dollars"],
        "lifetime_total_dollars": lifetime_dollars(rows),
        "sparkline_30d": build_sparkline(rows, today=today),
        "leaderboard": agg["leaderboard"],
    }


# ---------- I/O (integration; not unit tested) ----------


def fetch_rows_from_sheet(sheet_id, sheet_range):
    from googleapiclient.discovery import build
    from google.oauth2 import service_account

    creds_path = os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
    creds = service_account.Credentials.from_service_account_file(
        creds_path,
        scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"],
    )
    service = build("sheets", "v4", credentials=creds)
    resp = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=sheet_id, range=sheet_range)
        .execute()
    )
    return resp.get("values", [])


def main():
    sheet_id = os.environ["STATS_SHEET_ID"]
    sheet_range = os.environ.get("STATS_SHEET_RANGE", "LateJar!A2:C")
    launch_date = os.environ.get("LAUNCH_DATE", "2026-05-01")
    out_path = Path(os.environ.get("STATS_OUT_PATH", "stats.json"))

    rows = fetch_rows_from_sheet(sheet_id, sheet_range)
    stats = make_stats(rows, today=date.today(), launch_date=launch_date)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(stats, indent=2))
    print(
        f"Wrote {out_path} — {stats['month_total_minutes']} min this month, "
        f"${stats['lifetime_total_dollars']} lifetime",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
