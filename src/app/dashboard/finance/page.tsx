// src/app/dashboard/finance/page.tsx
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getFees, getFinanceSummary } from "@/server/actions/finance";
import { db } from "@/lib/db";
import { FinanceClient } from "@/components/finance/finance-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Finance" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string; term?: string }>;
}

export default async function FinancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const user = session?.user as { institutionId?: string; role?: string } | undefined;
  const institutionId = user?.institutionId;
  if (!institutionId) return null;

  const page = Number(params.page) || 1;
  const search = params.search || "";
  const status = params.status || "";
  const term = params.term || "";

  const [data, summary, students] = await Promise.all([
    getFees({ page, search, status, term }),
    getFinanceSummary(),
    db.student.findMany({
      where: { institutionId, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, studentId: true, classId: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 500,
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Suspense fallback={<TableSkeleton />}>
        <FinanceClient
          fees={data.fees}
          students={students}
          summary={summary}
          total={data.total}
          pages={data.pages}
          currentPage={page}
        />
      </Suspense>
    </div>
  );
}
