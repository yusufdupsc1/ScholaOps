import { NextResponse } from "next/server";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiEnvelope<T> {
  data: T | null;
  meta?: Record<string, unknown>;
  error: ApiErrorBody | null;
}

export function apiOk<T>(
  data: T,
  meta?: Record<string, unknown>,
  init?: ResponseInit,
) {
  const body: ApiEnvelope<T> = {
    data,
    meta,
    error: null,
  };
  return NextResponse.json(body, init);
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  const body: ApiEnvelope<null> = {
    data: null,
    error: { code, message, details },
  };
  return NextResponse.json(body, { status });
}

export function apiUnauthorized(message = "Authentication required") {
  return apiError(401, "UNAUTHORIZED", message);
}

export function apiForbidden(message = "Insufficient permissions") {
  return apiError(403, "FORBIDDEN", message);
}
