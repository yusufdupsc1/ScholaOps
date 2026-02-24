// src/app/dashboard/classes/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getClasses, getSubjects } from "@/server/actions/classes";
import { getTeachers } from "@/server/actions/teachers";
import { ClassesClient } from "@/components/classes/classes-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Classes & Subjects" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; tab?: string }>;
}

export default async function ClassesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const institutionId = (session?.user as { institutionId?: string } | undefined)?.institutionId;
  if (!institutionId) return null;

  const page = Number(params.page) || 1;
  const search = params.search || "";
  const tab = params.tab || "classes";

  const [classData, subjects, teachers] = await Promise.all([
    getClasses({ page, search }),
    getSubjects(),
    getTeachers({ limit: 200, status: "ACTIVE" }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <ClassesClient
          classes={classData.classes}
          subjects={subjects}
          teachers={teachers.teachers}
          total={classData.total}
          pages={classData.pages}
          currentPage={page}
          activeTab={tab}
        />
      </Suspense>
    </div>
  );
}
