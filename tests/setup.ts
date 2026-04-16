// Stub env so modules that read env at import time don't throw.
// Real keys are injected in Railway / GitHub Actions; tests never run
// against a live DB.
process.env.DATABASE_URL ??=
  "postgres://user:pass@localhost:5432/stub";
process.env.TOKEN_ENC_KEY ??= Buffer.alloc(32, 42).toString("base64url");
process.env.APP_URL ??= "https://latejar.app";
