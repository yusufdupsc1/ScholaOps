import Link from "next/link";

const actions = [
  { label: "Add Student", href: "/dashboard/students" },
  { label: "Take Attendance", href: "/dashboard/attendance" },
  { label: "Create Announcement", href: "/dashboard/announcements" },
  { label: "Record Payment", href: "/dashboard/finance" },
];

export function QuickActions() {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-base font-semibold">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-2">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
