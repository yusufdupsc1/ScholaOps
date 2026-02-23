import { formatDate } from "@/lib/utils";

interface EventItem {
  id: string;
  title: string;
  startDate: Date;
  type: string;
}

export function UpcomingEvents({ events }: { events: EventItem[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-base font-semibold">Upcoming Events</h2>
      <div className="space-y-2">
        {events.length ? (
          events.map((event) => (
            <div key={event.id} className="rounded-md border border-border/70 px-3 py-2">
              <p className="text-sm font-medium">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {event.type} • {formatDate(event.startDate)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
        )}
      </div>
    </section>
  );
}
