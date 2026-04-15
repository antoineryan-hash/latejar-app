-- Late Jar schema v1 (auth-v2 track)
-- Run via: npm run db:migrate
-- Safe to re-run (all IDEMPOTENT).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- users: one row per signed-in person, across all tenants
CREATE TABLE IF NOT EXISTS users (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                     TEXT UNIQUE NOT NULL,
  google_sub                TEXT UNIQUE NOT NULL,   -- Google's immutable user id
  display_name              TEXT,
  tier                      TEXT NOT NULL DEFAULT 'tracker',  -- 'tracker' | 'donator'
  timezone                  TEXT NOT NULL DEFAULT 'Australia/Brisbane',
  google_refresh_token_enc  BYTEA NOT NULL,         -- encrypted at rest (see src/lib/crypto.ts)
  stripe_payment_method_id  TEXT,
  charity_choice            TEXT DEFAULT 'tiacs',
  nudge_cadence             TEXT NOT NULL DEFAULT '2d',  -- '2d' | '1w' | 'never'
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at              TIMESTAMPTZ,
  CONSTRAINT users_tier_check CHECK (tier IN ('tracker', 'donator')),
  CONSTRAINT users_cadence_check CHECK (nudge_cadence IN ('2d', '1w', 'never'))
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_tier_idx  ON users (tier);

-- user_sessions: server-side session tokens (opaque, not JWT)
CREATE TABLE IF NOT EXISTS user_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT UNIQUE NOT NULL,  -- SHA-256 of the cookie value
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON user_sessions (expires_at);

-- sessions: one row per live meeting (tap-to-arrive "room")
CREATE TABLE IF NOT EXISTS sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcode         TEXT UNIQUE NOT NULL,        -- 4-char user-facing code
  calendar_event_id TEXT NOT NULL,               -- de-dup across users' calendars
  title             TEXT,
  scheduled_start   TIMESTAMPTZ NOT NULL,
  scheduled_end     TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (calendar_event_id)
);

CREATE INDEX IF NOT EXISTS sessions_scheduled_start_idx ON sessions (scheduled_start);
CREATE INDEX IF NOT EXISTS sessions_closed_at_idx ON sessions (closed_at);

-- Later additions (idempotent). Keeps forward-migration on live data safe.
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS invited_user_ids UUID[] NOT NULL DEFAULT '{}';

-- arrivals: one row per (user_or_guest, session) pair
CREATE TABLE IF NOT EXISTS arrivals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_email    TEXT,           -- only set if not a signed-in user
  guest_name     TEXT,
  arrival_time   TIMESTAMPTZ,    -- NULL = didn't arrive
  minutes_late   INTEGER,
  source         TEXT NOT NULL,  -- 'tap' | 'meet' | 'retroactive'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT arrivals_source_check CHECK (source IN ('tap', 'meet', 'retroactive')),
  CONSTRAINT arrivals_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_email IS NULL) OR
    (user_id IS NULL AND guest_email IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS arrivals_session_user_idx  ON arrivals (session_id, user_id)    WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS arrivals_session_guest_idx ON arrivals (session_id, guest_email) WHERE guest_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS arrivals_user_id_idx ON arrivals (user_id);

-- nudges: track upgrade-email sends for frequency capping
CREATE TABLE IF NOT EXISTS nudges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind       TEXT NOT NULL,  -- 'upgrade' | 'monthly_tally' | 'session_close_guest' | 'charge_heads_up'
  CONSTRAINT nudges_kind_check CHECK (kind IN ('upgrade', 'monthly_tally', 'session_close_guest', 'charge_heads_up'))
);

CREATE INDEX IF NOT EXISTS nudges_user_sent_idx ON nudges (user_id, sent_at DESC);
