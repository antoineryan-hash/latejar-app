import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getCurrentUser } from "@/lib/session";

// When Donator charges go live (Stripe wired), this endpoint retires in favour
// of /api/stripe/setup-intent. Until then, it captures buyer-intent so we can
// email users on switch-on day.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId =
    process.env.RESEND_DONATOR_AUDIENCE_ID ?? process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.contacts.create({
      email: user.email,
      audienceId,
      firstName: user.display_name ?? undefined,
      lastName: "donator-intent",
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Duplicates etc. — idempotent-ish, don't surface noise to UI.
    return NextResponse.json({ ok: true });
  }
}
