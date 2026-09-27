import { NextResponse, type NextRequest } from "next/server";

/**
 * Keep middleware minimal on Vercel Edge.
 * Auth is enforced in the (app) layout via Supabase server client
 * to avoid MIDDLEWARE_INVOCATION_FAILED crashes.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
