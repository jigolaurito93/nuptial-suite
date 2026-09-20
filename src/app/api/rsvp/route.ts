import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { mapPublicInvite, normalizeInviteCode } from "@/lib/invite";
import { createClient } from "@/lib/supabase/server";
import type { InviteRsvpStatus, RsvpPayload, RsvpStatus } from "@/types";

const VALID_STATUSES: RsvpStatus[] = ["attending", "declining"];

type LookupInviteRow = {
  display_name: string;
  plus_ones_allowed: number;
  rsvp_status: InviteRsvpStatus;
  plus_one_names: string[] | null;
  contact_number: string | null;
};

function isRsvpPayload(value: unknown): value is RsvpPayload {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  const inviteCode =
    typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";
  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim() : "";

  if (!inviteCode && !fullName) return false;

  if (body.plusOneNames !== undefined) {
    if (
      !Array.isArray(body.plusOneNames) ||
      !body.plusOneNames.every((name) => typeof name === "string")
    ) {
      return false;
    }
  }

  return (
    typeof body.contactNumber === "string" &&
    body.contactNumber.trim().length > 0 &&
    typeof body.status === "string" &&
    VALID_STATUSES.includes(body.status as RsvpStatus) &&
    (body.message === undefined || typeof body.message === "string") &&
    (body.inviteCode === undefined || typeof body.inviteCode === "string") &&
    (body.fullName === undefined || typeof body.fullName === "string")
  );
}

function rsvpErrorStatus(message: string) {
  if (message.includes("Invite not found")) return 404;
  if (
    message.includes("Too many plus-ones") ||
    message.includes("Invalid RSVP status") ||
    message.includes("Contact number is required")
  ) {
    return 400;
  }
  return 500;
}

function rsvpErrorMessage(message: string) {
  if (message.includes("Invite not found")) {
    return "This invitation link is not valid.";
  }
  if (message.includes("Too many plus-ones")) {
    return "You have listed more guests than this invitation allows.";
  }
  if (message.includes("Contact number is required")) {
    return "Please provide a contact number.";
  }
  if (message.includes("Invalid RSVP status")) {
    return "Please choose attending or declining.";
  }
  return "Unable to save RSVP. Please try again.";
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
          "Provide contactNumber, status (attending|declining), optional message, and either inviteCode or fullName.",
      },
      { status: 400 },
    );
  }

  const inviteCode = normalizeInviteCode(json.inviteCode);
  const contactNumber = json.contactNumber.trim();
  const message = json.message?.trim() || null;
  const plusOneNames = (json.plusOneNames ?? [])
    .map((name) => name.trim())
    .filter(Boolean);

  if (json.inviteCode && !inviteCode) {
    return NextResponse.json(
      { message: "This invitation link is not valid." },
      { status: 400 },
    );
  }

  if (!inviteCode && plusOneNames.length > 0) {
    return NextResponse.json(
      { message: "Plus-ones can only be added with a personal invitation." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();

    if (inviteCode) {
      const { data, error } = await supabase.rpc("submit_invite_rsvp", {
        p_code: inviteCode,
        p_status: json.status,
        p_contact_number: contactNumber,
        p_message: message,
        p_plus_one_names: json.status === "declining" ? [] : plusOneNames,
      });

      if (error) {
        const status = rsvpErrorStatus(error.message);
        return NextResponse.json(
          { message: rsvpErrorMessage(error.message) },
          { status },
        );
      }

      const row = (Array.isArray(data) ? data[0] : data) as
        LookupInviteRow | undefined;

      return NextResponse.json(
        { ok: true, invite: row ? mapPublicInvite(row) : undefined },
        { status: 201 },
      );
    }

    const fullName = json.fullName?.trim() ?? "";
    if (!fullName) {
      return NextResponse.json(
        { message: "Provide a full name." },
        { status: 400 },
      );
    }

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
