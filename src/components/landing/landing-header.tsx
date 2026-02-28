import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold tracking-tight sm:text-base">scholaOps</span>
        </Link>

        <nav aria-label="Marketing" className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
          <a href="#testimonials" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Reviews
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/auth/login" prefetch={false}>
              Log in
            </Link>
          </Button>
          <Button asChild className="rounded-full bg-brand-600 px-5 text-white hover:bg-brand-600/90">
            <Link href="/auth/register" prefetch={false}>
              Start trial
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
