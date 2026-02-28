import { trustStats } from "@/components/landing/landing-data";

export function TrustStrip() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid gap-3 rounded-[var(--radius-card)] border border-ui-border bg-surface p-4 sm:grid-cols-3 sm:p-5">
        {trustStats.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-bg px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-text">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-text">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
