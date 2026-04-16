import Link from "next/link";

export const metadata = {
  title: "Privacy policy",
  description:
    "How Late Jar handles your Google account, calendar data, arrivals, and payment details.",
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 px-6 py-20">
      <div className="mx-auto max-w-prose">
        <Link
          href="/"
          className="mono text-sm text-fg-dim transition-colors hover:text-late"
        >
          ← Back
        </Link>
        <h1 className="mt-6 text-3xl md:text-4xl">Privacy policy</h1>
        <p className="mono mt-2 text-sm text-fg-dim">Last updated: 16 April 2026</p>

        <p className="mt-6 text-fg-muted">
          We keep this short on purpose. If something here doesn&apos;t read straight, email us at{" "}
          <a className="text-fg underline hover:text-late" href="mailto:hello@latejar.app">
            hello@latejar.app
          </a>{" "}
          and we&apos;ll fix it.
        </p>

        <h2 className="mt-10 text-2xl">What we collect</h2>
        <h3 className="mt-5 text-lg text-fg">When you sign in with Google</h3>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-fg-muted">
          <li>Your Google account email, name, profile picture</li>
          <li>
            A Google OAuth <em>refresh token</em>, encrypted at rest with
            AES-256-GCM before it touches our database
          </li>
          <li>
            Read-only access to your calendar events — <span className="text-fg">only for the
              next 60 minutes</span>, only events with at least two Late Jar members on the invite.
            No titles, bodies, attachments, or transcripts are stored beyond the event summary.
          </li>
        </ul>

        <h3 className="mt-5 text-lg text-fg">When you tap &ldquo;I&apos;m here&rdquo;</h3>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-fg-muted">
          <li>The timestamp of your tap</li>
          <li>Which calendar event you tapped in for</li>
          <li>Computed &ldquo;minutes late&rdquo; (scheduled start vs your tap time)</li>
        </ul>

        <h3 className="mt-5 text-lg text-fg">When you become a Donator (coming soon)</h3>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-fg-muted">
          <li>
            A Stripe payment-method token — the card details themselves live with{" "}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noreferrer"
              className="text-fg underline hover:text-late"
            >
              Stripe
            </a>
            , never on our servers. Our PCI scope is SAQ-A.
          </li>
          <li>Your chosen charity (currently TIACS only)</li>
        </ul>

        <h3 className="mt-5 text-lg text-fg">Everything else</h3>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-fg-muted">
          <li>
            Privacy-respecting analytics via Cloudflare Web Analytics: aggregated IP,
            browser type, referral page. No cookies. No cross-site tracking.
          </li>
          <li>
            Emails we send you (monthly tally, upgrade nudges). You can unsubscribe
            from either — one-click, from the email.
          </li>
        </ul>

        <h2 className="mt-10 text-2xl">Where it lives</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-fg-muted">
          <li>
            Account + meeting data:{" "}
            <a
              href="https://neon.tech"
              target="_blank"
              rel="noreferrer"
              className="text-fg underline hover:text-late"
            >
              Neon
            </a>{" "}
            Postgres, encrypted at rest, SSL in transit
          </li>
          <li>Emails: Resend (transactional + audience)</li>
          <li>Payment methods (when live): Stripe</li>
          <li>Analytics: Cloudflare Web Analytics, aggregated</li>
          <li>We never sell, share, or trade your data. Full stop.</li>
        </ul>

        <h2 className="mt-10 text-2xl">How long we keep it</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-fg-muted">
          <li>Arrivals + sessions: kept until you ask us to delete them</li>
          <li>
            OAuth refresh tokens: deleted the second you sign out via{" "}
            <a href="https://myaccount.google.com/permissions" className="text-fg underline hover:text-late" target="_blank" rel="noreferrer">
              Google&apos;s connected-apps page
            </a>
            , or when you ask us to delete your account
          </li>
          <li>Session cookies: 30 days, rolling on use</li>
        </ul>

        <h2 className="mt-10 text-2xl">Your rights</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-fg-muted">
          <li>
            <strong>Access</strong>: email{" "}
            <a className="text-fg underline hover:text-late" href="mailto:hello@latejar.app">
              hello@latejar.app
            </a>{" "}
            for a dump of the data we hold on you
          </li>
          <li>
            <strong>Delete</strong>: same address — one email, we nuke your account,
            arrivals, tokens, and Stripe customer. Confirmation back inside 7 days.
          </li>
          <li>
            <strong>Revoke Google access</strong>: do it any time at{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noreferrer"
              className="text-fg underline hover:text-late"
            >
              myaccount.google.com/permissions
            </a>
            . Our stored refresh token immediately stops working.
          </li>
          <li>
            <strong>Unsubscribe</strong>: one-click link in every email we send
          </li>
        </ul>

        <h2 className="mt-10 text-2xl">Meeting non-members</h2>
        <p className="mt-3 text-fg-muted">
          If a Late Jar member adds a guest (someone who wasn&apos;t signed in) to a session
          they attended, that guest gets <em>one</em> email from us explaining what Late Jar is.
          That&apos;s it — we never add non-members to marketing or recurring sends without them
          explicitly signing up. Every email has an unsubscribe link.
        </p>

        <h2 className="mt-10 text-2xl">Australian Privacy Principles</h2>
        <p className="mt-3 text-fg-muted">
          We operate under the Australian Privacy Act 1988. Queries about APP compliance or
          to raise a concern, write to us at the address below. We aim to respond within 30
          days.
        </p>

        <h2 className="mt-10 text-2xl">Contact</h2>
        <p className="mt-3 text-fg-muted">
          Antoine Ryan —{" "}
          <a className="text-fg underline hover:text-late" href="mailto:hello@latejar.app">
            hello@latejar.app
          </a>{" "}
          — Queensland, Australia
        </p>

        <h2 className="mt-10 text-2xl">Changes</h2>
        <p className="mt-3 text-fg-muted">
          We&apos;ll post material changes here with a new date, and email signed-in users
          before any change that affects how your data is used.
        </p>
      </div>
    </main>
  );
}
