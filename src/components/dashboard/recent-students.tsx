import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface StudentItem {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  createdAt: Date;
  class: { name: string } | null;
}

export function RecentStudents({ students }: { students: StudentItem[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Recent Students</h2>
        <Link className="text-sm text-muted-foreground hover:text-foreground" href="/dashboard/students">
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {students.length ? (
          students.map((student) => (
            <div key={student.id} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                <p className="text-xs text-muted-foreground">{student.studentId} {student.class?.name ? `• ${student.class.name}` : ""}</p>
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(student.createdAt)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No students found.</p>
        )}
      </div>
    </section>
  );
}
