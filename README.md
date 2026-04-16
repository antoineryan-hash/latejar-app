# Late Jar

> Late jar for meetings. Auto-donates to the cause your team picks.

Production: [latejar.app](https://latejar.app)
Design spec: [Phase 1.5 + Phase 1 extension v2 in `~/.claude/plans/compressed-toasting-bee.md`](../../.claude/plans/compressed-toasting-bee.md)
Operational runbook: [`docs/RUNBOOK.md`](docs/RUNBOOK.md)

## Stack

- **Frontend**: Next.js 16 (App Router) · React 19 · Tailwind 4 · TypeScript
- **DB**: Neon Postgres (free tier) via `postgres-js`
- **Auth**: Google OAuth (per-user, calendar.events.readonly scope)
- **Payments**: Stripe + Stripe Connect (Donator tier)
- **Email**: Resend (transactional + audience)
- **Hosting**: Railway (app) + Cloudflare (DNS, CDN, analytics)
- **Scheduling**: GitHub Actions cron hitting `/api/cron/*` every 5 min

## Dev

```bash
npm install
cp .env.example .env.local   # fill in
npm run db:migrate           # idempotent against Neon
npm run dev                  # http://localhost:3000
npm test                     # vitest
```

## Deploy

Push to `main` → Railway auto-deploys. Cron hits prod via `.github/workflows/cron-calendar-poll.yml`.

## Surface area

Routes of note:
- `/` — landing page with real UpScale-team stats
- `/dashboard` — signed-in user's jar + email prefs
- `/upgrade` — Tracker → Donator (Stripe SetupIntent)
- `/m/[code]` — live session (tap-to-arrive)
- `/privacy` — v2, covers OAuth + Neon + Stripe + nudges

Cron:
- `/api/cron/calendar-poll` — every 5 min, per-user events → session rows
- `/api/cron/monthly-tally` — first-of-month pre-filled TIACS link to Trackers
- `/api/cron/upgrade-nudge` — every-2-days ping to Trackers with recent lateness
- `/api/cron/monthly-charge` — off-session Stripe charges for Donators

See [`docs/RUNBOOK.md`](docs/RUNBOOK.md) for env vars, cron setup, and Stripe onboarding.
