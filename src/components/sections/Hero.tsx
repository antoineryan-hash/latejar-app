import Link from "next/link";
import { HERO } from "@/content/copy";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.5 39.7 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C40.9 35.5 44 30.2 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border px-6 pt-24 pb-24 md:pt-32 md:pb-32">
      {/* soft red glow in the corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-late/10 blur-3xl"
      />
      <div className="mx-auto max-w-4xl text-center">
        <span className="mono inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs tracking-widest text-fg-muted uppercase">
          {HERO.eyebrow}
        </span>
        <h1 className="mt-6 text-balance text-4xl leading-[1.05] md:text-6xl lg:text-7xl">
          <span className="text-fg">{HERO.headline}</span>
          <br />
          <span className="text-late">{HERO.headlineAccent}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-fg-muted md:text-xl">
          {HERO.subhead}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
          <a
            href="/api/auth/google"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-late px-6 py-3 text-base font-semibold text-fg shadow-[0_0_40px_-10px_rgba(239,68,68,0.6)] transition-colors hover:bg-late-deep"
          >
            <GoogleIcon />
            {HERO.primaryCta}
          </a>
          <Link
            href="#live-jar"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-6 py-3 text-base font-semibold text-fg transition-colors hover:bg-surface-2"
          >
            {HERO.secondaryCta} ↓
          </Link>
        </div>
        <p className="mt-4 text-sm text-fg-dim">
          No card required. Free for Trackers forever. Calendar read-only access, nothing else.
        </p>
      </div>
    </section>
  );
}
