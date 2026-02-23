export function StudentsHeader({ total }: { total: number }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Students</h1>
      <p className="text-sm text-muted-foreground">{total} total records</p>
    </div>
  );
}
