// src/app/dashboard/timetable/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getWeeklyTimetable } from "@/server/actions/timetable";
import { db } from "@/lib/db";
import { TimetableClient } from "@/components/timetable/timetable-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Timetable" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ classId?: string }>;
}

export default async function TimetablePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const institutionId = (
    session?.user as { institutionId?: string } | undefined
  )?.institutionId;

  if (!institutionId) return null;

  const [classes, timetable] = await Promise.all([
    db.class.findMany({
      where: { institutionId, isActive: true },
      select: { id: true, name: true, grade: true, section: true },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
    getWeeklyTimetable(params.classId),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <TimetableClient
          classes={classes}
          timetable={timetable}
          selectedClassId={params.classId || ""}
        />
      </Suspense>
    </div>
  );
}
