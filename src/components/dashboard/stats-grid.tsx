import { Users, UserCheck, ClipboardCheck, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StatsData {
  totalStudents: number;
  totalTeachers: number;
  todayAttendance: number;
  pendingFees: { amount: number; count: number };
}

export function StatsGrid({ stats }: { stats: StatsData }) {
  const cards = [
    { label: "Students", value: stats.totalStudents, icon: Users },
    { label: "Teachers", value: stats.totalTeachers, icon: UserCheck },
    { label: "Present Today", value: stats.todayAttendance, icon: ClipboardCheck },
    {
      label: "Pending Fees",
      value: formatCurrency(Number(stats.pendingFees.amount ?? 0)),
      icon: CreditCard,
      subtitle: `${stats.pendingFees.count} invoices`,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold">{card.value}</p>
          {card.subtitle ? <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p> : null}
        </article>
      ))}
    </section>
  );
}
