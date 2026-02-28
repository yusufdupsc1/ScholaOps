import { testimonialItems } from "@/components/landing/landing-data";

export function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h2 className="text-2xl font-bold text-text sm:text-3xl">What Schools Say</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {testimonialItems.map((item) => (
          <figure
            key={item.author}
            className="rounded-[var(--radius-card)] border border-ui-border bg-surface p-5 shadow-card"
          >
            <blockquote className="text-sm leading-relaxed text-text">
              &ldquo;{item.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4 border-t border-ui-border pt-3">
              <p className="text-sm font-semibold text-text">{item.author}</p>
              <p className="text-xs text-muted-text">{item.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
