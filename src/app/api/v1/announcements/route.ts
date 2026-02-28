import { NextRequest } from "next/server";
import {
  createAnnouncement,
  getAnnouncements,
} from "@/server/actions/announcements";
import { AnnouncementCreateSchema } from "@/lib/contracts/v1/announcements";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { parseListQuery, queryBool, queryString } from "@/lib/api/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, "announcements", "read");
  if (auth.response) return auth.response;

  try {
    const list = parseListQuery(req.nextUrl.searchParams);
    const priority = queryString(req.nextUrl.searchParams, "priority");
    const activeOnly = queryBool(req.nextUrl.searchParams, "activeOnly", false);

    const result = await getAnnouncements({
      page: list.page,
      limit: list.limit,
      search: list.q,
      priority,
      activeOnly,
    });

    return apiOk(result.announcements, {
      page: result.page,
      limit: list.limit,
      total: result.total,
      pages: result.pages,
      q: list.q,
      priority,
      activeOnly,
    });
  } catch (error) {
    logApiError("API_V1_ANNOUNCEMENTS_GET", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch announcements");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, "announcements", "create");
  if (auth.response) return auth.response;

  try {
    const payload = AnnouncementCreateSchema.parse(await req.json());
    const result = await createAnnouncement(payload);

    if (!result.success) {
      return apiError(400, "VALIDATION_ERROR", result.error);
    }

    return apiOk(result.data ?? null, undefined, { status: 201 });
  } catch (error) {
    logApiError("API_V1_ANNOUNCEMENTS_POST", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to create announcement");
  }
}
