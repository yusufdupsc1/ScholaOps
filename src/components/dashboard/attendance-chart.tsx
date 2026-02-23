import { formatDate } from "@/lib/utils";

interface AttendanceRow {
  date: Date;
  status: string;
  _count: number;
}

export function AttendanceChart({ data }: { data: AttendanceRow[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-base font-semibold">Attendance (Last 30 Days)</h2>
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="pb-2">Date</th>
              <th className="pb-2">Status</th>
              <th className="pb-2 text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.length ? (
              data.map((row, idx) => (
                <tr key={`${row.date.toISOString()}-${row.status}-${idx}`} className="border-t border-border/60">
                  <td className="py-2">{formatDate(row.date)}</td>
                  <td className="py-2">{row.status}</td>
                  <td className="py-2 text-right">{row._count}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-3 text-muted-foreground" colSpan={3}>
                  No attendance data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
