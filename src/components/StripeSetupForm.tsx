"use client";

import { useEffect, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

type Props = { publishableKey: string };

export function StripeSetupForm({ publishableKey }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStripePromise(loadStripe(publishableKey));
  }, [publishableKey]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/stripe/setup-intent", { method: "POST" });
        if (!res.ok) throw new Error(`SetupIntent failed (${res.status})`);
        const json = await res.json();
        if (!json.clientSecret)
          throw new Error("No client secret returned");
        setClientSecret(json.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start setup");
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-late/40 bg-late/5 px-5 py-4 text-sm text-late">
        Couldn&apos;t start card setup: {error}. Refresh to retry.
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="mono text-sm text-fg-dim">Loading secure card form…</div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#EF4444",
            colorBackground: "#141418",
            colorText: "#E8E8EA",
            colorDanger: "#EF4444",
            fontFamily: "Inter, system-ui, sans-serif",
            borderRadius: "10px",
          },
        },
      }}
    >
      <InnerForm />
    </Elements>
  );
}

function InnerForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErr(null);
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?welcome=donator`,
      },
    });
    if (error) {
      setErr(error.message ?? "Something went wrong");
      setSubmitting(false);
    }
    // On success Stripe redirects to return_url. No UI after this point.
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {err && <div className="mono text-sm text-late">{err}</div>}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="mono rounded-lg bg-late px-6 py-3 text-sm font-semibold text-fg shadow-[0_0_30px_-10px_rgba(239,68,68,0.6)] transition-colors hover:bg-late-deep disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save card & become a Donator"}
      </button>
      <p className="mono text-xs text-fg-dim">
        No charge now. First charge is end-of-month for your minutes late.
        We email you 48h before every charge — pause anytime from that email.
      </p>
    </form>
  );
}
