import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Email sending via Resend is not implemented yet." },
    { status: 501 },
  );
}
