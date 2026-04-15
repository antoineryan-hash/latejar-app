"""Unit tests for the stats aggregator. Run: python -m pytest scripts/ -v"""

from datetime import date
from sheet_to_stats import (
    aggregate_rows,
    build_sparkline,
    lifetime_dollars,
    make_stats,
)


def test_aggregate_only_counts_current_month():
    rows = [
        ["2026-05-01", "Antoine", "3"],
        ["2026-05-03", "Antoine", "5"],
        ["2026-04-30", "Antoine", "10"],  # previous month, excluded
        ["2026-05-02", "Mitch", "7"],
    ]
    today = date(2026, 5, 15)
    result = aggregate_rows(rows, today=today)
    assert result["month_total_minutes"] == 15
    assert result["month_total_dollars"] == 15


def test_aggregate_ranks_and_anonymises():
    rows = [
        ["2026-05-01", "Antoine", "3"],
        ["2026-05-03", "Antoine", "5"],
        ["2026-05-02", "Mitch", "7"],
    ]
    today = date(2026, 5, 15)
    result = aggregate_rows(rows, today=today)
    lb = {r["handle"]: r["dollars"] for r in result["leaderboard"]}
    assert lb["Team Member 1"] == 8  # Antoine (3+5)
    assert lb["Team Member 2"] == 7  # Mitch
    # No real names leaked
    for entry in result["leaderboard"]:
        assert entry["handle"].startswith("Team Member ")


def test_aggregate_handles_malformed_rows():
    rows = [
        ["not-a-date", "X", "5"],
        ["2026-05-01", "Y", "not-a-number"],
        ["2026-05-02"],  # too short
        ["2026-05-03", "Z", "4"],
    ]
    today = date(2026, 5, 15)
    result = aggregate_rows(rows, today=today)
    assert result["month_total_minutes"] == 4


def test_sparkline_has_correct_length_and_bucketing():
    rows = [
        ["2026-05-14", "A", "2"],
        ["2026-05-15", "A", "3"],
        ["2026-05-15", "B", "1"],
        ["2026-04-10", "C", "100"],  # outside 30-day window
    ]
    today = date(2026, 5, 15)
    spark = build_sparkline(rows, today=today)
    assert len(spark) == 30
    # Last value (today) should sum both "2026-05-15" rows
    assert spark[-1] == 4
    # Day before today: one row of 2
    assert spark[-2] == 2


def test_lifetime_sums_all_valid_rows_regardless_of_date():
    rows = [
        ["2025-01-01", "X", "10"],
        ["2026-04-15", "Y", "7"],
        ["bad-date", "Z", "3"],  # date is bad but minutes parse fine
    ]
    assert lifetime_dollars(rows) == 20


def test_make_stats_produces_full_schema():
    rows = [["2026-05-10", "Antoine", "4"]]
    stats = make_stats(rows, today=date(2026, 5, 15), launch_date="2026-05-01")
    required = {
        "generated_at",
        "launch_date",
        "month_total_minutes",
        "month_total_dollars",
        "lifetime_total_dollars",
        "sparkline_30d",
        "leaderboard",
    }
    assert required.issubset(stats.keys())
    assert len(stats["sparkline_30d"]) == 30
    assert stats["launch_date"] == "2026-05-01"
    assert stats["month_total_minutes"] == 4
