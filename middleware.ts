// middleware.ts
// Next.js middleware — lightweight auth guard for dashboard routes

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/auth/login", "/auth/error", "/api/auth"];

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) {
    return NextResponse.next();
  }

  const isProtected = pathname.startsWith("/dashboard");
  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSessionToken =
    Boolean(req.cookies.get("authjs.session-token")?.value) ||
    Boolean(req.cookies.get("__Secure-authjs.session-token")?.value) ||
    Boolean(req.cookies.get("next-auth.session-token")?.value) ||
    Boolean(req.cookies.get("__Secure-next-auth.session-token")?.value);

  if (!hasSessionToken) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
