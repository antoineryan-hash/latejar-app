import { FOUNDER_NOTE } from "@/content/copy";

export function FounderNote() {
  return (
    <section className="border-b border-border px-6 py-20">
      <div className="mx-auto max-w-prose">
        <span className="mono text-xs tracking-widest text-fg-dim uppercase">
          Founder note
        </span>
        <h2 className="mt-2 text-3xl md:text-4xl">Why we built this</h2>
        <div className="mt-6 space-y-4 text-fg-muted">
          {FOUNDER_NOTE.split("\n\n").map((p, i) => (
            <p key={i} className="text-pretty">
              {p}
            </p>
          ))}
        </div>
        <p className="mt-8 mono text-sm text-fg-dim">
          — Antoine, UpScale Business Coaching
        </p>
      </div>
    </section>
  );
}
