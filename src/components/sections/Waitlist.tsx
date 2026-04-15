"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { WAITLIST } from "@/content/copy";

const Schema = z.object({
  email: z.string().email("Valid email required"),
  workspace: z.string().optional(),
});
type FormData = z.infer<typeof Schema>;

export function Waitlist() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(Schema) });

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus("success");
        reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="waitlist" className="border-b border-border px-6 py-20">
      <div className="mx-auto max-w-xl">
        <span className="mono text-xs tracking-widest text-fg-dim uppercase">
          Early access
        </span>
        <h2 className="mt-2 text-3xl md:text-4xl">{WAITLIST.heading}</h2>
        <p className="mt-4 text-fg-muted">{WAITLIST.body}</p>

        {status === "success" ? (
          <p
            role="status"
            className="mt-8 rounded-xl border border-raised bg-raised/10 px-5 py-4 text-raised"
          >
            {WAITLIST.successMessage}
          </p>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-3"
            noValidate
          >
            <label className="block">
              <span className="sr-only">Email</span>
              <input
                type="email"
                autoComplete="email"
                placeholder={WAITLIST.placeholderEmail}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-fg placeholder:text-fg-dim focus:border-late focus:outline-none focus:ring-2 focus:ring-late/30"
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-late-soft">
                  {errors.email.message}
                </p>
              )}
            </label>
            <label className="block">
              <span className="sr-only">Workspace name (optional)</span>
              <input
                type="text"
                autoComplete="organization"
                placeholder={WAITLIST.placeholderWorkspace}
                {...register("workspace")}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-fg placeholder:text-fg-dim focus:border-late focus:outline-none focus:ring-2 focus:ring-late/30"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-late px-5 py-3 font-semibold text-fg shadow-[0_0_30px_-10px_rgba(239,68,68,0.6)] transition-colors hover:bg-late-deep disabled:opacity-60"
            >
              {isSubmitting ? "..." : WAITLIST.submitLabel}
            </button>
            {status === "error" && (
              <p role="alert" className="text-sm text-late-soft">
                {WAITLIST.errorMessage}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
