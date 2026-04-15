import Link from "next/link";
import { HERO } from "@/content/copy";

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
          <Link
            href="#waitlist"
            className="inline-flex items-center justify-center rounded-lg bg-late px-6 py-3 text-base font-semibold text-fg shadow-[0_0_40px_-10px_rgba(239,68,68,0.6)] transition-colors hover:bg-late-deep"
          >
            {HERO.primaryCta}
          </Link>
          <Link
            href="#live-jar"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-6 py-3 text-base font-semibold text-fg transition-colors hover:bg-surface-2"
          >
            {HERO.secondaryCta} ↓
          </Link>
        </div>
      </div>
    </section>
  );
}
