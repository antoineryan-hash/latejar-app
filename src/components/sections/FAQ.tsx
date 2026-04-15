import { FAQ as FAQ_ITEMS } from "@/content/faq";

export function FAQ() {
  return (
    <section className="border-b border-border px-6 py-20">
      <div className="mx-auto max-w-prose">
        <span className="mono text-xs tracking-widest text-fg-dim uppercase">
          Common questions
        </span>
        <h2 className="mt-2 text-3xl md:text-4xl">FAQ</h2>
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {FAQ_ITEMS.map((item, i) => (
            <li key={i}>
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-fg transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold">{item.q}</span>
                  <span
                    aria-hidden
                    className="mono text-lg text-fg-dim transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-fg-muted">{item.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
