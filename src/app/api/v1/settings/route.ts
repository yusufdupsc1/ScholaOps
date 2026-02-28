import { NextRequest } from "next/server";
import {
  getInstitutionSettings,
  updateInstitutionProfile,
  updateInstitutionSettings,
} from "@/server/actions/settings";
import {
  InstitutionProfileSchema,
  InstitutionSettingsSchema,
} from "@/lib/contracts/v1/settings";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, "settings", "read");
  if (auth.response) return auth.response;

  try {
    const result = await getInstitutionSettings();
    return apiOk(result);
  } catch (error) {
    logApiError("API_V1_SETTINGS_GET", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch settings");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, "settings", "update");
  if (auth.response) return auth.response;

  try {
    const body = (await req.json()) as { action?: string; payload?: unknown };
    const action = body.action ?? "profile";
    const payload = body.payload ?? body;

    if (action === "institution-settings") {
      const parsed = InstitutionSettingsSchema.parse(payload);
      const result = await updateInstitutionSettings(parsed);
      if (!result.success) {
        return apiError(400, "VALIDATION_ERROR", result.error);
      }
      return apiOk({ success: true }, { action });
    }

    const parsed = InstitutionProfileSchema.parse(payload);
    const result = await updateInstitutionProfile(parsed);
    if (!result.success) {
      return apiError(400, "VALIDATION_ERROR", result.error);
    }

    return apiOk({ success: true }, { action: "profile" });
  } catch (error) {
    logApiError("API_V1_SETTINGS_POST", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to update settings");
  }
}
