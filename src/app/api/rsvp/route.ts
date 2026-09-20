import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { mapPublicInvite, normalizeInviteCode } from "@/lib/invite";
import { createClient } from "@/lib/supabase/server";
import type { LookupInviteRow, RsvpPayload, RsvpStatus } from "@/types";

const VALID_STATUSES: RsvpStatus[] = ["attending", "declining"];

function isRsvpPayload(value: unknown): value is RsvpPayload {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;

  if (typeof body.inviteCode !== "string" || !body.inviteCode.trim()) {
    return false;
  }

  if (
    typeof body.contactNumber !== "string" ||
    body.contactNumber.trim().length === 0
  ) {
    return false;
  }

  if (body.message !== undefined && typeof body.message !== "string") {
    return false;
  }

  if (body.plusOneNames !== undefined) {
    if (
      !Array.isArray(body.plusOneNames) ||
      !body.plusOneNames.every((name) => typeof name === "string")
    ) {
      return false;
    }
  }

  if (!Array.isArray(body.guestReplies) || body.guestReplies.length === 0) {
    return false;
  }

  return body.guestReplies.every((reply) => {
    if (!reply || typeof reply !== "object") return false;
    const row = reply as Record<string, unknown>;
    return (
      typeof row.id === "string" &&
      row.id.trim().length > 0 &&
      typeof row.status === "string" &&
      VALID_STATUSES.includes(row.status as RsvpStatus)
    );
  });
}

function rsvpErrorStatus(message: string) {
  if (message.includes("Invite not found")) return 404;
  if (message.includes("RSVP is closed")) return 403;
  if (
    message.includes("Too many plus-ones") ||
    message.includes("Invalid RSVP status") ||
    message.includes("Contact number is required") ||
    message.includes("Each named guest must have an RSVP") ||
    message.includes("Unknown guest")
  ) {
    return 400;
  }
  return 500;
}

function rsvpErrorMessage(message: string) {
  if (message.includes("Invite not found")) {
    return "This invitation link is not valid.";
  }
  if (message.includes("RSVP is closed")) {
    return "RSVP is closed. Please contact the couple if you need to make a change.";
  }
  if (message.includes("Too many plus-ones")) {
    return "You have listed more guests than this invitation allows.";
  }
  if (message.includes("Contact number is required")) {
    return "Please provide a contact number.";
  }
  if (message.includes("Each named guest must have an RSVP")) {
    return "Please choose attending or declining for each person on this invitation.";
  }
  if (message.includes("Unknown guest")) {
    return "This invitation could not be updated. Refresh the page and try again.";
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

  const body =
    json && typeof json === "object" ? (json as Record<string, unknown>) : null;
  const rawInviteCode =
    typeof body?.inviteCode === "string" ? body.inviteCode.trim() : "";

  if (!rawInviteCode) {
    return NextResponse.json(
      { message: "A personal invitation is required to RSVP." },
      { status: 403 },
    );
  }

  if (!isRsvpPayload(json)) {
    return NextResponse.json(
      {
        message:
          "Provide inviteCode, contactNumber, guestReplies, and an optional message.",
      },
      { status: 400 },
    );
  }

  const inviteCode = normalizeInviteCode(json.inviteCode);
  if (!inviteCode) {
    return NextResponse.json(
      { message: "This invitation link is not valid." },
      { status: 400 },
    );
  }

  const contactNumber = json.contactNumber.trim();
  const message = json.message?.trim() || null;
  const plusOneNames = (json.plusOneNames ?? [])
    .map((name) => name.trim())
    .filter(Boolean);
  const guestReplies = json.guestReplies.map((reply) => ({
    id: reply.id.trim(),
    status: reply.status,
  }));

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_invite_rsvp", {
      p_code: inviteCode,
      p_contact_number: contactNumber,
      p_message: message,
      p_guest_replies: guestReplies,
      p_plus_one_names: plusOneNames,
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
  } catch {
    return NextResponse.json(
      { message: "Unable to save RSVP. Please try again." },
      { status: 500 },
    );
  }
}
