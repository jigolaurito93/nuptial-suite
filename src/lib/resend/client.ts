import { Resend } from "resend";
import { getResendApiKey } from "@/lib/env";

export function getResendClient() {
  return new Resend(getResendApiKey());
}
