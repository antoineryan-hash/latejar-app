import { CHARITY } from "@/content/copy";

export function Charity() {
  return (
    <section className="border-b border-border px-6 py-20">
      <div className="mx-auto max-w-prose">
        <span className="mono text-xs tracking-widest text-fg-dim uppercase">
          The money
        </span>
        <h2 className="mt-2 text-3xl md:text-4xl">{CHARITY.heading}</h2>
        <p className="mt-6 text-fg-muted">{CHARITY.body}</p>
        <div className="mt-6 rounded-2xl border border-warn/40 bg-warn/5 p-5">
          <p className="text-sm text-fg-muted">{CHARITY.tiacsAbout}</p>
        </div>
        <a
          href={CHARITY.tiacsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-raised px-5 py-3 font-semibold text-bg transition-colors hover:bg-raised-soft"
        >
          {CHARITY.tiacsCtaLabel} →
        </a>
      </div>
    </section>
  );
}
