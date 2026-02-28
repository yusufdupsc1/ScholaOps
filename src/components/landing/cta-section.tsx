import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6">
      <div className="rounded-[var(--radius-card)] bg-brand-600 p-6 text-white sm:p-10">
        <h2 className="text-2xl font-bold sm:text-3xl">Ready to modernize school operations?</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
          Start with a guided setup and move your institution from spreadsheets to
          role-aware workflows.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild className="rounded-full bg-white text-brand-600 hover:bg-white/90">
            <Link href="/auth/register" prefetch={false}>
              Start free trial
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/auth/login" prefetch={false}>
              Sign in
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
