import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  UNLOCK_COOKIE_NAME,
  isSitePasswordEnabled,
  isUnlockTokenValid,
} from "@/lib/site-password";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return updateSession(request);
  }

  if (
    isSitePasswordEnabled() &&
    pathname.startsWith("/api/") &&
    pathname !== "/api/unlock"
  ) {
    const token = request.cookies.get(UNLOCK_COOKIE_NAME)?.value;
    if (!(await isUnlockTokenValid(token))) {
      return NextResponse.json(
        { message: "Invitation is locked." },
        { status: 401 },
      );
    }
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/:path*"],
};
