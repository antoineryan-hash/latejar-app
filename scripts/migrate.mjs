#!/usr/bin/env node
/**
 * Runs src/db/schema.sql against DATABASE_URL. Idempotent.
 * Called via `npm run db:migrate`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, "..", "src", "db", "schema.sql");

// Read .env.local for local dev (Next only loads it for Next commands)
const envPath = resolve(__dirname, "..", ".env.local");
try {
  const envText = readFileSync(envPath, "utf8");
  for (const line of envText.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
    if (m) process.env[m[1]] ??= m[2];
  }
} catch {
  // no .env.local — assume env is set externally
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sqlText = readFileSync(schemaPath, "utf8");

const sql = postgres(url, { prepare: false });

try {
  console.log(`Running schema.sql (${sqlText.length} chars) against Neon…`);
  await sql.unsafe(sqlText);
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log("Tables in public schema:");
  for (const row of tables) console.log(`  - ${row.table_name}`);
  console.log("Migration complete.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
