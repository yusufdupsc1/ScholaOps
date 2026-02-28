import { z } from "zod";

const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().trim().default(""),
  q: z.string().trim().default(""),
});

export function parseListQuery(params: URLSearchParams) {
  return ListQuerySchema.parse({
    page: params.get("page") ?? undefined,
    limit: params.get("limit") ?? undefined,
    sort: params.get("sort") ?? undefined,
    q: params.get("q") ?? undefined,
  });
}

export function queryString(
  params: URLSearchParams,
  key: string,
  fallback = "",
): string {
  return params.get(key)?.trim() ?? fallback;
}

export function queryBool(
  params: URLSearchParams,
  key: string,
  fallback = false,
): boolean {
  const raw = params.get(key);
  if (raw === null) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export function queryNumber(
  params: URLSearchParams,
  key: string,
  fallback: number,
): number {
  const raw = params.get(key);
  if (!raw) return fallback;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : fallback;
}
