import Link from "next/link";
import { Button } from "@/components/ui/button";

export function StudentsHeader({ total }: { total: number }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Students</h1>
        <p className="text-sm text-muted-foreground">{total} total records</p>
      </div>
      <Link href="/dashboard/students/reports">
        <Button type="button" variant="outline">Ready-Made Reports</Button>
      </Link>
    </div>
  );
}
