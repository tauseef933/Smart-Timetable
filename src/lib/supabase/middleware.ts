import { NextResponse, type NextRequest } from "next/server";

/** @deprecated Auth is handled in (app)/layout — kept for compatibility. */
export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request });
}
