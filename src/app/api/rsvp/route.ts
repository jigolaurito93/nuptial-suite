import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { RsvpPayload, RsvpStatus } from "@/types";

const VALID_STATUSES: RsvpStatus[] = ["attending", "declining"];

function isRsvpPayload(value: unknown): value is RsvpPayload {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return (
    typeof body.fullName === "string" &&
    body.fullName.trim().length > 0 &&
    typeof body.contactNumber === "string" &&
    body.contactNumber.trim().length > 0 &&
    typeof body.status === "string" &&
    VALID_STATUSES.includes(body.status as RsvpStatus) &&
    (body.message === undefined || typeof body.message === "string")
  );
}

export async function GET() {
  return NextResponse.json(
    { message: "Submit an RSVP with POST." },
    { status: 405 },
  );
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        message:
          "RSVP is unavailable until Supabase environment variables are configured.",
      },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!isRsvpPayload(json)) {
    return NextResponse.json(
      {
        message:
          "Provide fullName, contactNumber, status (attending|declining), and optional message.",
      },
      { status: 400 },
    );
  }

  const fullName = json.fullName.trim();
  const contactNumber = json.contactNumber.trim();
  const message = json.message?.trim() || null;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("rsvps").insert({
      full_name: fullName,
      contact_number: contactNumber,
      status: json.status,
      message,
    });

    if (error) {
      return NextResponse.json(
        { message: "Unable to save RSVP. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Unable to save RSVP. Please try again." },
      { status: 500 },
    );
  }
}
