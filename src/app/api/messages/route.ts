import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type MessagePayload = {
  fullName: string;
  message: string;
  contactNumber?: string;
};

function isMessagePayload(value: unknown): value is MessagePayload {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;

  return (
    typeof body.fullName === "string" &&
    body.fullName.trim().length > 0 &&
    typeof body.message === "string" &&
    body.message.trim().length > 0 &&
    (body.contactNumber === undefined || typeof body.contactNumber === "string")
  );
}

function messageErrorStatus(message: string) {
  if (
    message.includes("Name is required") ||
    message.includes("Message is required")
  ) {
    return 400;
  }
  return 500;
}

function messageErrorMessage(message: string) {
  if (message.includes("Name is required")) {
    return "Please provide your name.";
  }
  if (message.includes("Message is required")) {
    return "Please write a message.";
  }
  return "Unable to send your note. Please try again.";
}

export async function GET() {
  return NextResponse.json(
    { message: "Submit a note with POST." },
    { status: 405 },
  );
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        message:
          "Notes are unavailable until Supabase environment variables are configured.",
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

  if (!isMessagePayload(json)) {
    return NextResponse.json(
      {
        message: "Provide a name and message. Phone number is optional.",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("submit_message", {
      p_full_name: json.fullName.trim(),
      p_message: json.message.trim(),
      p_contact_number: json.contactNumber?.trim() || null,
    });

    if (error) {
      return NextResponse.json(
        { message: messageErrorMessage(error.message) },
        { status: messageErrorStatus(error.message) },
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Unable to send your note. Please try again." },
      { status: 500 },
    );
  }
}
