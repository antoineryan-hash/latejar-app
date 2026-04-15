import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="text-lg font-semibold">Late Jar</p>
          <p className="mt-1 text-sm text-fg-muted">
            Built by UpScale Business Coaching · Queensland, AU
          </p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm text-fg-muted">
          <Link className="transition-colors hover:text-late" href="/privacy">
            Privacy
          </Link>
          <a
            className="transition-colors hover:text-late"
            href="mailto:hello@latejar.app"
          >
            Contact
          </a>
          <a
            className="transition-colors hover:text-late"
            href="https://fundraise.tiacs.org/fundraisers/upscalegoldcoastmarathon2026"
            target="_blank"
            rel="noreferrer"
          >
            Donate
          </a>
        </nav>
      </div>
    </footer>
  );
}
