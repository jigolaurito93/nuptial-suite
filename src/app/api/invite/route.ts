import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { mapPublicInvite, normalizeInviteCode } from "@/lib/invite";
import { createClient } from "@/lib/supabase/server";
import type { LookupInviteRow } from "@/types";

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        message:
          "Invites are unavailable until Supabase environment variables are configured.",
      },
      { status: 503 },
    );
  }

  const code = normalizeInviteCode(
    new URL(request.url).searchParams.get("code"),
  );

  if (!code) {
    return NextResponse.json(
      { message: "Provide a valid invite code." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("lookup_invite", {
      p_code: code,
    });

    if (error) {
      return NextResponse.json(
        { message: "Unable to look up invitation." },
        { status: 500 },
      );
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      LookupInviteRow | undefined;

    if (!row) {
      return NextResponse.json(
        { message: "Invitation not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(mapPublicInvite(row));
  } catch {
    return NextResponse.json(
      { message: "Unable to look up invitation." },
      { status: 500 },
    );
  }
}
