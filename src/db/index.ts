import postgres from "postgres";

/**
 * Singleton Postgres connection to Neon.
 *
 * Usage:
 *   import { sql } from "@/db";
 *   const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
 *
 * The `postgres` package tagged-template API auto-escapes values — use it
 * directly; never string-concat SQL.
 */

declare global {
  // eslint-disable-next-line no-var
  var __latejarSql: ReturnType<typeof postgres> | undefined;
}

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return postgres(url, {
    // Neon requires SSL; this connection string carries ?sslmode=require.
    // `postgres` respects that automatically.
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Neon's pgbouncer doesn't support prepared statements
  });
}

export const sql = global.__latejarSql ?? create();

if (process.env.NODE_ENV !== "production") {
  global.__latejarSql = sql;
}
