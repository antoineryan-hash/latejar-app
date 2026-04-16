import { NextResponse } from "next/server";
import { sql } from "@/db";
import { stripeClient, webhookSecret } from "@/lib/stripe";

export const dynamic = "force-dynamic";
// Stripe signs webhooks with a raw body hash; don't let Next parse JSON.
export const runtime = "nodejs";

/**
 * POST /api/stripe/webhook
 *
 * Verifies Stripe signature, then handles the events we care about:
 * - payment_method.attached: store pm_id on user, flip tier='donator'
 * - payment_intent.succeeded: log; dedupe via nudges table
 * - payment_intent.payment_failed: log; email the user (TODO)
 *
 * Returns 200 quickly — Stripe retries 4xx. Unknown event types no-op
 * with 200 so Stripe doesn't hammer us.
 */
export async function POST(req: Request) {
  const stripe = stripeClient();
  const secret = webhookSecret();
  if (!stripe || !secret) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    return NextResponse.json(
      {
        error: "bad_signature",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "payment_method.attached": {
      const pm = event.data.object;
      const customerId =
        typeof pm.customer === "string" ? pm.customer : pm.customer?.id;
      if (customerId) {
        await sql`
          UPDATE users
          SET stripe_payment_method_id = ${pm.id},
              tier = 'donator'
          WHERE stripe_customer_id = ${customerId}
        `;
      }
      break;
    }

    case "payment_intent.succeeded": {
      // Ledger trail via nudges — kind='monthly_charge' + metadata.
      // Here we just touch the user's last_seen so we can see charge
      // activity per user. Full accounting (amount, fee, connect
      // transfer) lives in Stripe, not duplicated here.
      const pi = event.data.object;
      const userId = pi.metadata?.latejar_user_id;
      if (userId) {
        await sql`INSERT INTO nudges (user_id, kind) VALUES (${userId}, 'monthly_charge')`;
      }
      break;
    }

    case "payment_intent.payment_failed": {
      // TODO: email user with "card failed, please update" copy.
      // For now, log and let the next run retry.
      break;
    }

    default:
      // No-op for unhandled types (we only subscribe to a few anyway)
      break;
  }

  return NextResponse.json({ received: true });
}
