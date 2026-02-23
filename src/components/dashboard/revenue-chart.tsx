import { formatCurrency } from "@/lib/utils";

interface RevenueRow {
  paidAt: Date;
  _sum: { amount: number | null };
}

export function RevenueChart({ data }: { data: RevenueRow[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-base font-semibold">Revenue (This Year)</h2>
      <div className="space-y-2">
        {data.length ? (
          data.map((row, idx) => (
            <div key={`${row.paidAt.toISOString()}-${idx}`} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
              <span>{row.paidAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <span className="font-medium">{formatCurrency(Number(row._sum.amount ?? 0))}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        )}
      </div>
    </section>
  );
}
