import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { UpgradeCta } from "@/components/UpgradeCta";

export const dynamic = "force-dynamic";
export const metadata = { title: "Become a Donator" };

export default async function UpgradePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stripeReady = !!process.env.STRIPE_SECRET_KEY;
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;

  if (user.tier === "donator") {
    return (
      <main className="flex-1 px-6 py-20">
        <div className="mx-auto max-w-prose">
          <span className="mono text-xs tracking-widest text-raised uppercase">
            You&apos;re a Donator
          </span>
          <h1 className="mt-2 text-3xl md:text-4xl">
            Card on file. Charity picked.
          </h1>
          <p className="mt-4 text-fg-muted">
            Every minute you&apos;re late becomes $1 to TIACS at month&apos;s
            end. We email you 48 hours before every charge — you can pause
            from that email anytime.
          </p>
          <p className="mt-8">
            <Link
              href="/dashboard"
              className="underline text-fg hover:text-late"
            >
              ← Back to your jar
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <span className="mono text-xs tracking-widest text-fg-dim uppercase">
          Upgrade to Donator
        </span>
        <h1 className="mt-2 text-3xl md:text-5xl leading-tight">
          Turn your lateness into real money for TIACS.
        </h1>
        <p className="mt-6 text-lg text-fg-muted">
          You&apos;re already tracking. Donators go one step further: save a
          card, and at the end of every month we charge <strong>$1 per
          minute you were late</strong> and route it to{" "}
          <a
            href="https://tiacs.org"
            target="_blank"
            rel="noreferrer"
            className="underline text-fg hover:text-late"
          >
            TIACS
          </a>
          .
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Panel
            step="1"
            title="Save a card"
            body="One-time Stripe setup. We never charge on save — only at month-end."
          />
          <Panel
            step="2"
            title="Get a 48h heads-up"
            body="Before every monthly charge we email you the exact total and a pause button."
          />
          <Panel
            step="3"
            title="100% to TIACS"
            body="Your full donation hits TIACS. Our 10% platform fee is billed separately — never skimmed off the charity."
          />
        </div>

        <div className="mt-12 rounded-2xl border border-late/40 bg-late/5 p-6">
          <span className="mono text-xs tracking-widest text-late uppercase">
            Your charity
          </span>
          <h2 className="mt-2 text-2xl">TIACS — mental health for tradies</h2>
          <p className="mt-3 text-sm text-fg-muted">
            This is Our Truckies, Tradies &amp; Farmers free counselling line.
            Australian-registered DGR — donations over $2 are tax-deductible.
            We&apos;re launching with TIACS only; custom charity picking is on
            the roadmap.{" "}
            <a
              className="underline text-fg hover:text-late"
              href="mailto:hello@latejar.app?subject=Charity%20request"
            >
              Request a charity
            </a>
            .
          </p>
        </div>

        <div className="mt-10">
          <UpgradeCta stripeReady={stripeReady} publishableKey={publishableKey} />
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <details className="group">
            <summary className="cursor-pointer text-sm text-fg-muted hover:text-fg">
              What exactly happens to my money?
            </summary>
            <p className="mt-3 text-sm text-fg-muted">
              We use Stripe Connect. Your card is charged once a month for the
              exact minutes-late total. 100% of your donation lands in TIACS&apos;s
              Stripe account — we don&apos;t hold or touch the donation. Our
              platform fee is billed in a separate charge so the charity figure
              is never ambiguous.
            </p>
          </details>
          <details className="group mt-3">
            <summary className="cursor-pointer text-sm text-fg-muted hover:text-fg">
              Can I pause a month or cancel?
            </summary>
            <p className="mt-3 text-sm text-fg-muted">
              Yes. The 48h heads-up email has a one-click pause. You can also
              downgrade back to Tracker at any time from your dashboard — your
              history stays, you just stop getting charged.
            </p>
          </details>
          <details className="group mt-3">
            <summary className="cursor-pointer text-sm text-fg-muted hover:text-fg">
              Is this tax-deductible?
            </summary>
            <p className="mt-3 text-sm text-fg-muted">
              TIACS is an Australian DGR charity, so donations over $2 are
              tax-deductible for AU donors. Stripe issues a receipt per charge
              on TIACS&apos;s behalf. Talk to your accountant about your
              specific situation.
            </p>
          </details>
        </div>

        <p className="mt-12 text-center text-sm">
          <Link
            href="/dashboard"
            className="underline text-fg-muted hover:text-fg"
          >
            ← Not yet, take me back
          </Link>
        </p>
      </div>
    </main>
  );
}

function Panel({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <span className="mono text-xs text-fg-dim">Step {step}</span>
      <h3 className="mt-1 text-lg">{title}</h3>
      <p className="mt-2 text-sm text-fg-muted">{body}</p>
    </div>
  );
}
