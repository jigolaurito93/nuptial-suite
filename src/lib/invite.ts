import type { Invite, InviteRow, PublicInvite } from "@/types";

export const INVITE_COOKIE_NAME = "ns_invite_code";
export const INVITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;
export const INVITE_CODE_PATTERN = /^[a-z0-9]{8,24}$/;

export function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function normalizeInviteCode(
  value: string | string[] | undefined | null,
): string | null {
  if (value == null) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!INVITE_CODE_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function generateInviteCode() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function persistInviteCookie(code: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${INVITE_COOKIE_NAME}=${encodeURIComponent(code)};path=/;max-age=${INVITE_COOKIE_MAX_AGE};samesite=lax`;
}

export function clearInviteCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${INVITE_COOKIE_NAME}=;path=/;max-age=0;samesite=lax`;
}

export function mapInviteRow(row: InviteRow): Invite {
  return {
    id: row.id,
    inviteCode: row.invite_code,
    displayName: row.display_name,
    plusOnesAllowed: row.plus_ones_allowed,
    rsvpStatus: row.rsvp_status,
    contactNumber: row.contact_number,
    message: row.message,
    plusOneNames: row.plus_one_names ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPublicInvite(row: {
  display_name: string;
  plus_ones_allowed: number;
  rsvp_status: PublicInvite["rsvpStatus"];
  plus_one_names: string[] | null;
  contact_number: string | null;
}): PublicInvite {
  return {
    displayName: row.display_name,
    plusOnesAllowed: row.plus_ones_allowed,
    rsvpStatus: row.rsvp_status,
    plusOneNames: row.plus_one_names ?? [],
    contactNumber: row.contact_number,
  };
}

export function plusOneAllowanceCopy(
  allowed: number,
  displayName?: string,
): string {
  const name = displayName?.trim();
  if (allowed <= 0) {
    return name
      ? `This invitation is reserved for ${name} only. Additional guests cannot be accommodated.`
      : "This invitation is for you only. Additional guests cannot be accommodated.";
  }
  if (allowed === 1) {
    return name
      ? `${name}, you are welcome to bring one plus-one.`
      : "You are welcome to bring one plus-one.";
  }
  return name
    ? `${name}, you are welcome to bring up to ${allowed} guests.`
    : `You are welcome to bring up to ${allowed} guests.`;
}

export function inviteLink(origin: string, code: string) {
  return `${origin}/?invite=${code}`;
}
