import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  title: "Sign in",
};

const ERROR_COPY: Record<string, string> = {
  bad_state: "That sign-in link is stale — please try again.",
  missing_params: "Google didn't return the expected response. Try again.",
  unverified_email: "Your Google email isn't verified. Check your inbox.",
  oauth_failed: "Something went wrong. Please try again in a moment.",
  access_denied: "You cancelled the sign-in. No problem — try again anytime.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { error } = await searchParams;
  const errorMsg = error ? ERROR_COPY[error] ?? "Sign-in failed — try again." : null;

  return (
    <main className="flex-1 px-6 py-20">
      <div className="mx-auto max-w-md text-center">
        <Link href="/" className="mono text-sm text-fg-dim hover:text-late">
          ← Back
        </Link>

        <h1 className="mt-10 text-3xl md:text-4xl">Sign in to Late Jar</h1>
        <p className="mt-4 text-fg-muted">
          We'll read your Google Calendar to spot late arrivals to meetings — and nothing else.
          Free forever for Trackers; upgrade to Donator anytime to route lateness into donations.
        </p>

        {errorMsg && (
          <p className="mt-6 rounded-lg border border-late/40 bg-late/10 px-4 py-3 text-late">
            {errorMsg}
          </p>
        )}

        <a
          href="/api/auth/google"
          className="mt-10 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-late px-6 py-3 font-semibold text-fg shadow-[0_0_40px_-10px_rgba(239,68,68,0.6)] transition-colors hover:bg-late-deep"
        >
          <GoogleIcon />
          Sign in with Google
        </a>

        <p className="mt-6 text-sm text-fg-dim">
          By signing in you agree to our{" "}
          <Link className="underline hover:text-fg" href="/privacy">
            privacy policy
          </Link>
          . You can delete all your data with one click from your dashboard at any time.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.5 39.7 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C40.9 35.5 44 30.2 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}
