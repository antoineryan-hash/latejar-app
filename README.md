# Late Jar

> Late jar for meetings. Auto-donates to the cause your team picks.

Landing page for `latejar.app`. See [`docs/plans/2026-04-15-landing-page.md`](docs/plans/2026-04-15-landing-page.md) for the build plan. Design direction lives in the Phase 1.5 section of [`~/.claude/plans/compressed-toasting-bee.md`](../../.claude/plans/compressed-toasting-bee.md).

## Stack

- Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui
- Deployed on Railway · DNS + Web Analytics via Cloudflare · Waitlist via Resend
- Python stats pipeline reads UpScale's Google Sheet, writes `stats.json` daily

## Dev

```bash
npm install
cp .env.example .env.local   # fill in Resend keys
npm run dev                   # http://localhost:3000
npm test                      # vitest
```

## Deploy

Pushes to `main` auto-deploy on Railway. DNS is at Cloudflare pointing to the Railway custom domain.
