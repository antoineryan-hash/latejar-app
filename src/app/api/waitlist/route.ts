import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const Schema = z.object({
  email: z.string().email(),
  workspace: z.string().optional(),
});

// Route handlers are dynamic by default in Next 16 — env reads at request time.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    return NextResponse.json(
      { error: "server_not_configured" },
      { status: 500 },
    );
  }

  try {
    const resend = new Resend(apiKey);
    await resend.contacts.create({
      email: parsed.data.email,
      audienceId,
      firstName: parsed.data.workspace,
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "resend_failed" }, { status: 500 });
  }
}
