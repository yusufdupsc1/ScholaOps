import { NextRequest } from "next/server";
import { createTeacher, getTeachers } from "@/server/actions/teachers";
import { TeacherCreateSchema } from "@/lib/contracts/v1/teachers";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { parseListQuery, queryString } from "@/lib/api/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, "teachers", "read");
  if (auth.response) return auth.response;

  try {
    const list = parseListQuery(req.nextUrl.searchParams);
    const status = queryString(req.nextUrl.searchParams, "status", "ACTIVE");

    const result = await getTeachers({
      page: list.page,
      limit: list.limit,
      search: list.q,
      status,
    });

    return apiOk(result.teachers, {
      page: result.page,
      limit: list.limit,
      total: result.total,
      pages: result.pages,
      q: list.q,
      status,
    });
  } catch (error) {
    logApiError("API_V1_TEACHERS_GET", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch teachers");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, "teachers", "create");
  if (auth.response) return auth.response;

  try {
    const payload = TeacherCreateSchema.parse(await req.json());
    const result = await createTeacher(payload);

    if (!result.success) {
      return apiError(400, "VALIDATION_ERROR", result.error);
    }

    return apiOk(result.data ?? null, undefined, { status: 201 });
  } catch (error) {
    logApiError("API_V1_TEACHERS_POST", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to create teacher");
  }
}
