// src/app/dashboard/analytics/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAttendanceSummary, getAttendanceTrend } from "@/server/actions/attendance";
import { getGradeDistribution } from "@/server/actions/grades";
import { getFinanceSummary } from "@/server/actions/finance";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { ChartSkeleton } from "@/components/ui/skeletons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  const institutionId = (session?.user as { institutionId?: string } | undefined)?.institutionId;
  if (!institutionId) return null;

  const today = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const [attendanceSummary, attendanceTrend, gradeDistribution, financeSummary, studentStats, teacherStats] =
    await Promise.all([
      getAttendanceSummary({
        startDate: startDate.toISOString().slice(0, 10),
        endDate: today.toISOString().slice(0, 10),
      }),
      getAttendanceTrend({ days: 30 }),
      getGradeDistribution(),
      getFinanceSummary(),
      db.student.groupBy({
        by: ["status"],
        where: { institutionId },
        _count: true,
      }),
      db.teacher.groupBy({
        by: ["status"],
        where: { institutionId },
        _count: true,
      }),
    ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<ChartSkeleton />}>
        <AnalyticsClient
          attendanceSummary={attendanceSummary}
          attendanceTrend={attendanceTrend}
          gradeDistribution={gradeDistribution}
          financeSummary={financeSummary}
          studentStats={studentStats}
          teacherStats={teacherStats}
        />
      </Suspense>
    </div>
  );
}
