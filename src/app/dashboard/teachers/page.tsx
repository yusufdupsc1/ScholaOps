// src/app/dashboard/teachers/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getTeachers } from "@/server/actions/teachers";
import { getSubjects } from "@/server/actions/classes";
import { TeachersClient } from "@/components/teachers/teachers-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Teachers" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function TeachersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const institutionId = (session?.user as { institutionId?: string } | undefined)?.institutionId;
  if (!institutionId) return null;

  const page = Number(params.page) || 1;
  const search = params.search || "";
  const status = params.status || "ACTIVE";

  const [data, subjects] = await Promise.all([
    getTeachers({ page, search, status }),
    getSubjects(),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <TeachersClient
          teachers={data.teachers}
          subjects={subjects}
          total={data.total}
          pages={data.pages}
          currentPage={page}
        />
      </Suspense>
    </div>
  );
}
