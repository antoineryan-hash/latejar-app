import Link from "next/link";

export const metadata = {
  title: "Privacy policy",
  description: "How Late Jar handles your data during the waitlist phase.",
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
        <h1 className="mt-6 text-3xl md:text-4xl">Privacy policy (waitlist)</h1>
        <p className="mono mt-2 text-sm text-fg-dim">Last updated: 15 April 2026</p>

        <p className="mt-6 text-fg-muted">
          This policy covers{" "}
          <span className="text-fg">latejar.app</span> <strong>before the product launches</strong>.
          A separate, fuller policy will apply to the app itself once live.
        </p>

        <h2 className="mt-10 text-2xl">What we collect</h2>
        <p className="mt-3 text-fg-muted">When you join the waitlist:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-fg-muted">
          <li>Your email address</li>
          <li>Optional: workspace name, team size, role</li>
        </ul>
        <p className="mt-4 text-fg-muted">
          Automatically, via Cloudflare Web Analytics: IP address, browser type, referral page.
          No cookies, no cross-site tracking.
        </p>

        <h2 className="mt-10 text-2xl">Why we collect it</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-fg-muted">
          <li>To email you when Late Jar is ready for early access</li>
          <li>To understand where interest is coming from so we build the right thing</li>
        </ul>

        <h2 className="mt-10 text-2xl">Where it lives</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-fg-muted">
          <li>
            Email addresses:{" "}
            <a
              className="text-fg underline hover:text-late"
              href="https://resend.com"
              target="_blank"
              rel="noreferrer"
            >
              Resend
            </a>{" "}
            audiences, encrypted at rest
          </li>
          <li>Analytics: Cloudflare Web Analytics, anonymised, server-side aggregated</li>
          <li>We never sell, share, or trade your data. Ever.</li>
        </ul>

        <h2 className="mt-10 text-2xl">Your rights</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-fg-muted">
          <li>
            <strong>Access</strong>: email{" "}
            <a className="text-fg underline hover:text-late" href="mailto:hello@latejar.app">
              hello@latejar.app
            </a>{" "}
            to receive the data we hold on you
          </li>
          <li>
            <strong>Delete</strong>: same address — "please delete my data"
          </li>
          <li>
            <strong>Unsubscribe</strong>: one-click link at the bottom of every email
          </li>
        </ul>

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
          We'll post material changes here with a new date.
        </p>
      </div>
    </main>
  );
}
