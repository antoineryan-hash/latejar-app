# Late Jar Runbook

Operational doc. Lives next to the code so it drifts less.

## Environments

| Env | Where | What's live |
|---|---|---|
| Local | `npm run dev` + `.env.local` | full app, local Neon branch OK |
| Prod | [latejar.app](https://latejar.app) on Railway | everything |

## Required env vars

### Always required (prod)

| Var | Where it goes | Notes |
|---|---|---|
| `DATABASE_URL` | Railway env + `.env.local` | Neon connection string. Requires `?sslmode=require`. |
| `APP_URL` | Railway | `https://latejar.app`. Used for absolute links in emails. |
| `TOKEN_ENC_KEY` | Railway + GH secret | 32 random bytes, base64url. Encrypts OAuth refresh tokens + signs unsubscribe tokens. |
| `GOOGLE_OAUTH_CLIENT_ID` | Railway | From GCP project `late-jar-*` OAuth client |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Railway | Same OAuth client |
| `RESEND_API_KEY` | Railway | Full-access key. Waitlist, monthly tally, upgrade nudge. |
| `RESEND_AUDIENCE_ID` | Railway | Waitlist audience |
| `CRON_SECRET` | Railway + **GitHub repo secret** | Shared between app and the `cron-calendar-poll` workflow |

### Optional / conditional

| Var | When | Notes |
|---|---|---|
| `RESEND_FROM_ADDRESS` | Always | Defaults to `Late Jar <hello@latejar.app>` |
| `RESEND_DONATOR_AUDIENCE_ID` | If segmenting | Falls back to `RESEND_AUDIENCE_ID` if unset |
| `STATS_TEAM_DOMAIN` | Always | Which email domain's stats show on `/`. Default `up-scale.me`. |
| `STRIPE_SECRET_KEY` | Stripe gate | Unlocks real SetupIntent on `/upgrade`. Without it, CTA captures buyer-intent. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe gate | Needed together with secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe gate | For `/api/stripe/webhook` signature verification |
| `STRIPE_CHARITY_ACCOUNT_ID` | Before first charge | Stripe Connect destination for TIACS |
| `LATEJAR_PLATFORM_FEE_PERCENT` | Optional | Default `10` (percent of each charge kept as platform fee) |
| `TIACS_FUNDRAISER_URL` | Optional | Defaults to the Gold Coast Marathon 2026 fundraiser |

## First-time setup

### 1. Google Workspace / GCP

1. Go to [GCP Console](https://console.cloud.google.com/), select the Late Jar project.
2. OAuth consent screen: `external`, scopes `openid`, `email`, `profile`, `.../auth/calendar.events.readonly`.
3. Create OAuth 2.0 Web client. Authorised redirect: `https://latejar.app/api/auth/callback`.
4. Copy client ID + secret into Railway.
5. Until we have ≥100 users, leave the app in "Testing" mode. Add test users as needed.

### 2. Neon

1. Create Neon project. Copy pooled connection string into `DATABASE_URL`.
2. Run `npm run db:migrate` locally (or from Railway's "Run command"). Idempotent.

### 3. Cron (GitHub Actions)

The workflow file lives at `.github/workflows/cron-calendar-poll.yml`. It needs the `CRON_SECRET` repo secret. Set it with:

```bash
gh secret set CRON_SECRET --body "<same value as Railway>"
```

5-min schedule. Workflow hits all four cron endpoints per tick; each is self-gating via dedupe queries so most ticks are no-ops.

### 4. Stripe (later)

1. Create Stripe account (AU). Enable Connect in test mode first.
2. Add env vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
3. Register webhook endpoint `https://latejar.app/api/stripe/webhook` listening to:
   - `payment_method.attached`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Onboard TIACS as a Stripe Connect Standard account. Store their account ID as `STRIPE_CHARITY_ACCOUNT_ID`. Until this is set, `/api/cron/monthly-charge` returns `charity_account_missing` per user and no money moves.
5. Flip to live mode once the flow is tested end-to-end with test cards.

### 5. DNS

Cloudflare Registrar owns `latejar.app`. DNS uses Cloudflare → Railway custom domain (proxied). Cloudflare Web Analytics is auto-injected at the edge (no code).

## Verifying a deploy

Smoke-test in order:

```bash
CRON_SECRET=$(op read "op://Private/.../CRON_SECRET")   # or pull from Railway
curl -sS -X POST https://latejar.app/api/cron/calendar-poll -H "X-Cron-Secret: $CRON_SECRET"
curl -sS -X POST https://latejar.app/api/cron/monthly-tally -H "X-Cron-Secret: $CRON_SECRET"
curl -sS -X POST https://latejar.app/api/cron/upgrade-nudge -H "X-Cron-Secret: $CRON_SECRET"
curl -sS -X POST https://latejar.app/api/cron/monthly-charge -H "X-Cron-Secret: $CRON_SECRET"
```

Each returns JSON. `calendar-poll` should show `users_polled ≥ 1`.

## Incident playbook

- **No sessions creating**: check `calendar-poll` returns `events_seen > 0`. Verify ≥2 Late Jar members share an event. Refresh token may be revoked — user needs to re-sign-in.
- **Emails not sending**: check Resend dashboard for the API key. The monthly-tally endpoint returns `resend_not_configured` if env var missing.
- **Charge failed**: Stripe dashboard → Payments → failed PaymentIntent. Most failures are `authentication_required` (needs user intervention). Webhook handler logs; build a notify-user flow later.
- **Unsubscribe tokens rejected**: `TOKEN_ENC_KEY` changed in env → old tokens invalid. Rotating this invalidates all outbound email unsubscribe links. Avoid.

## Data model quick ref

- `users` — one per signed-in person. Encrypted Google refresh token.
- `user_sessions` — server-side opaque session cookies. 30-day rolling.
- `sessions` — one per live meeting (calendar event ID ↔ 4-char shortcode).
- `arrivals` — one per (user_or_guest, session). Source: `tap` | `meet` | `retroactive`.
- `nudges` — email-send ledger. Dedupe key is `(user_id, kind, date_trunc('month', sent_at))`.

Full schema: `src/db/schema.sql` (idempotent migration).
