import { NextRequest } from "next/server";
import { createEvent, getEvents } from "@/server/actions/events";
import { EventCreateSchema } from "@/lib/contracts/v1/events";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { parseListQuery, queryBool, queryString } from "@/lib/api/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, "events", "read");
  if (auth.response) return auth.response;

  try {
    const list = parseListQuery(req.nextUrl.searchParams);
    const type = queryString(req.nextUrl.searchParams, "type");
    const upcoming = queryBool(req.nextUrl.searchParams, "upcoming", false);

    const result = await getEvents({
      page: list.page,
      limit: list.limit,
      search: list.q,
      type,
      upcoming,
    });

    return apiOk(result.events, {
      page: result.page,
      limit: list.limit,
      total: result.total,
      pages: result.pages,
      q: list.q,
      type,
      upcoming,
    });
  } catch (error) {
    logApiError("API_V1_EVENTS_GET", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch events");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, "events", "create");
  if (auth.response) return auth.response;

  try {
    const payload = EventCreateSchema.parse(await req.json());
    const result = await createEvent(payload);

    if (!result.success) {
      return apiError(400, "VALIDATION_ERROR", result.error);
    }

    return apiOk(result.data ?? null, undefined, { status: 201 });
  } catch (error) {
    logApiError("API_V1_EVENTS_POST", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to create event");
  }
}
