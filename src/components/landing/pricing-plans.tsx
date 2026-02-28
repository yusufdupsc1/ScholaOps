import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pricingTiers } from "@/components/landing/landing-data";

export function PricingPlans() {
  return (
    <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h2 className="text-2xl font-bold text-text sm:text-3xl">Simple School Pricing</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-text sm:text-base">
        Start with a pilot and scale when your institution is ready.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {pricingTiers.map((tier) => (
          <article
            key={tier.name}
            className={[
              "rounded-[var(--radius-card)] border p-5 shadow-card",
              tier.highlighted
                ? "border-brand-600 bg-brand-50"
                : "border-ui-border bg-surface",
            ].join(" ")}
          >
            <h3 className="text-lg font-semibold text-text">{tier.name}</h3>
            <p className="mt-2 text-3xl font-bold tabular-nums text-text">{tier.price}</p>
            <p className="text-xs text-muted-text">{tier.cadence}</p>

            <ul className="mt-4 space-y-2">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-text">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              className={[
                "mt-5 w-full rounded-full",
                tier.highlighted ? "bg-brand-600 text-white hover:bg-brand-600/90" : "",
              ].join(" ")}
              variant={tier.highlighted ? "default" : "outline"}
            >
              <Link href={tier.href} prefetch={false}>
                {tier.cta}
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
