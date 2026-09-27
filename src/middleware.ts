import { NextResponse } from "next/server";

/**
 * Keep middleware minimal on Vercel Edge.
 * Auth is enforced in the (app) layout via Supabase server client
 * to avoid MIDDLEWARE_INVOCATION_FAILED crashes.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
