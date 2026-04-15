import { HOW_IT_WORKS } from "@/content/copy";

export function HowItWorks() {
  return (
    <section className="border-b border-border px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl md:text-4xl">How it works</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-fg-muted">
          Zero setup on every meeting. Configure once, we handle the rest.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <div
              key={step.step}
              className="group relative rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-late/50 hover:bg-surface-2"
            >
              <div className="mono text-sm tracking-widest text-late">
                {step.step}
              </div>
              <h3 className="mt-3 text-xl">{step.title}</h3>
              <p className="mt-2 text-fg-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
