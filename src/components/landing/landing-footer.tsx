import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-ui-border bg-surface/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-medium text-muted-text">
          © {new Date().getFullYear()} scholaOps. Built for school teams.
        </p>
        <nav className="flex items-center gap-5" aria-label="Footer">
          <Link href="/privacy" prefetch={false} className="text-muted-text transition-colors hover:text-text">
            Privacy
          </Link>
          <Link href="/terms" prefetch={false} className="text-muted-text transition-colors hover:text-text">
            Terms
          </Link>
          <Link href="/auth/login" prefetch={false} className="text-muted-text transition-colors hover:text-text">
            Portal
          </Link>
        </nav>
      </div>
    </footer>
  );
}
