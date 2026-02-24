// middleware.ts
// Next.js middleware — Auth guard + RBAC + Institution routing

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/error",
  "/api/auth",
  "/api/health",
  "/terms",
  "/privacy",
];

const ADMIN_ROUTES = [
  "/dashboard/settings",
  "/dashboard/finance",
  "/dashboard/users",
];

const AUTH_SECRET = process.env.AUTH_SECRET || "development-secret-change-in-production";

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  institutionId: string;
  institutionSlug?: string;
  institutionName?: string;
}

function decodeSessionToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

function getTokenFromRequest(req: NextRequest): string | null {
  // Check Authorization header first (for API routes)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Check session cookies
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  return sessionToken || null;
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) {
    return NextResponse.next();
  }

  // Get session token
  const token = getTokenFromRequest(req);
  if (!token) {
    return handleUnauthorized(req);
  }

  // Decode token
  const payload = decodeSessionToken(token);
  if (!payload) {
    return handleUnauthorized(req);
  }

  // RBAC: Check admin routes
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(payload.role);

  if (isAdminRoute && !isAdmin) {
    // Redirect to dashboard if user lacks permission
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Multi-tenancy: Add institution context headers
  const response = NextResponse.next();
  response.headers.set("x-user-id", payload.id);
  response.headers.set("x-user-role", payload.role);
  response.headers.set("x-institution-id", payload.institutionId);
  response.headers.set("x-institution-slug", payload.institutionSlug || "");
  response.headers.set("x-institution-name", payload.institutionName || "");

  return response;
}

function handleUnauthorized(req: NextRequest): NextResponse {
  const loginUrl = new URL("/auth/login", req.url);
  loginUrl.searchParams.set("callbackUrl", encodeURIComponent(req.nextUrl.pathname));
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
