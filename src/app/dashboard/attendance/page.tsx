// src/app/dashboard/attendance/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAttendanceSummary } from "@/server/actions/attendance";
import { AttendanceClient } from "@/components/attendance/attendance-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Attendance" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ classId?: string; date?: string }>;
}

export default async function AttendancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const institutionId = (session?.user as { institutionId?: string } | undefined)?.institutionId;
  if (!institutionId) return null;

  const today = new Date().toISOString().slice(0, 10);
  const date = params.date || today;
  const classId = params.classId || "";

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const [classes, summary] = await Promise.all([
    db.class.findMany({
      where: { institutionId, isActive: true },
      select: { id: true, name: true, grade: true, section: true },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
    getAttendanceSummary({
      classId: classId || undefined,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: today,
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <AttendanceClient
          classes={classes}
          selectedClassId={classId}
          selectedDate={date}
          summary={summary}
        />
      </Suspense>
    </div>
  );
}
