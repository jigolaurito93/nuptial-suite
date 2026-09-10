import { NextResponse } from "next/server";
import {
  createUnlockToken,
  getSitePassword,
  isSitePasswordEnabled,
  passwordsMatch,
  unlockCookieOptions,
  UNLOCK_COOKIE_NAME,
} from "@/lib/site-password";

export async function GET() {
  return NextResponse.json(
    { message: "Unlock the invitation with POST." },
    { status: 405 },
  );
}

export async function POST(request: Request) {
  if (!isSitePasswordEnabled()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const expected = getSitePassword();
  if (!expected) {
    return NextResponse.json(
      { message: "Invitation password is not configured." },
      { status: 503 },
    );
  }

  let password = "";
  try {
    const json = (await request.json()) as { password?: unknown };
    password = typeof json.password === "string" ? json.password.trim() : "";
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!password || !passwordsMatch(password, expected)) {
    return NextResponse.json(
      { message: "That password does not match. Please try again." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    UNLOCK_COOKIE_NAME,
    await createUnlockToken(),
    unlockCookieOptions(),
  );
  return response;
}
