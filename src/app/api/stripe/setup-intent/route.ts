import { NextResponse } from "next/server";
import { sql } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { stripeClient } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/setup-intent
 *
 * Creates a Stripe Customer for the user (if missing) and returns a
 * SetupIntent client_secret so the client can mount Stripe Elements
 * and collect card details off-session.
 *
 * When the SetupIntent succeeds, Stripe fires payment_method.attached
 * → our webhook flips user.tier='donator' and stores
 * stripe_payment_method_id. So this endpoint alone doesn't upgrade
 * the user; the webhook does.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  // Fetch or create the Stripe customer
  const [row] = await sql<Array<{ stripe_customer_id: string | null }>>`
    SELECT stripe_customer_id FROM users WHERE id = ${user.id} LIMIT 1
  `;
  let customerId = row?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.display_name ?? undefined,
      metadata: { latejar_user_id: user.id },
    });
    customerId = customer.id;
    await sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${user.id}`;
  }

  const intent = await stripe.setupIntents.create({
    customer: customerId,
    usage: "off_session",
    // Restrict to cards for now; Link + BPay could be added later if
    // AU-specific rails are worth the extra complexity.
    payment_method_types: ["card"],
    metadata: { latejar_user_id: user.id },
  });

  return NextResponse.json({
    clientSecret: intent.client_secret,
    customerId,
  });
}
