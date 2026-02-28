import { roleHighlights } from "@/components/landing/landing-data";

export function RoleModules() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
      <div className="rounded-[var(--radius-card)] border border-ui-border bg-surface p-5 shadow-card sm:p-7">
        <h2 className="text-2xl font-bold text-text">Built for Every School Role</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-text">
          Configure dashboards by responsibility so each user sees the right
          priorities first.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {roleHighlights.map((item) => (
            <article
              key={item.role}
              className="rounded-xl border border-ui-border bg-bg p-4"
            >
              <h3 className="text-base font-semibold text-text">{item.role}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-text">
                {item.outcome}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
