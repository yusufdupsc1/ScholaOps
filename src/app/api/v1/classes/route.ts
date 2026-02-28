import { NextRequest } from "next/server";
import { createClass, getClasses } from "@/server/actions/classes";
import { ClassCreateSchema } from "@/lib/contracts/v1/classes";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { parseListQuery, queryString } from "@/lib/api/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, "classes", "read");
  if (auth.response) return auth.response;

  try {
    const list = parseListQuery(req.nextUrl.searchParams);
    const academicYear = queryString(req.nextUrl.searchParams, "academicYear");

    const result = await getClasses({
      page: list.page,
      limit: list.limit,
      search: list.q,
      academicYear,
    });

    return apiOk(result.classes, {
      page: result.page,
      limit: list.limit,
      total: result.total,
      pages: result.pages,
      q: list.q,
      academicYear,
    });
  } catch (error) {
    logApiError("API_V1_CLASSES_GET", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch classes");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, "classes", "create");
  if (auth.response) return auth.response;

  try {
    const payload = ClassCreateSchema.parse(await req.json());
    const result = await createClass(payload);

    if (!result.success) {
      return apiError(400, "VALIDATION_ERROR", result.error);
    }

    return apiOk(result.data ?? null, undefined, { status: 201 });
  } catch (error) {
    logApiError("API_V1_CLASSES_POST", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to create class");
  }
}
