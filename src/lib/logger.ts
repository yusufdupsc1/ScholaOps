type Primitive = string | number | boolean | null | undefined;

const REDACT_KEYS = [
  "password",
  "secret",
  "token",
  "authorization",
  "email",
  "phone",
  "transactionref",
  "receiptnumber",
] as const;

function shouldRedact(key: string): boolean {
  const normalized = key.toLowerCase();
  return REDACT_KEYS.some((sensitive) => normalized.includes(sensitive));
}

function redactString(value: string): string {
  if (!value) return value;
  if (value.length <= 6) return "***";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

export function redactPII<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    return redactString(value) as T;
  }

  if (typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactPII(item)) as T;
  }

  const out: Record<string, Primitive | object | Array<unknown>> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (shouldRedact(key) && typeof item === "string") {
      out[key] = redactString(item);
      continue;
    }
    out[key] = redactPII(item as never) as never;
  }

  return out as T;
}

export function logApiError(scope: string, error: unknown, context?: object) {
  const safeContext = context ? redactPII(context) : undefined;
  console.error(`[${scope}]`, {
    error: error instanceof Error ? error.message : String(error),
    context: safeContext,
  });
}
