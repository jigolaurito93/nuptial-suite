import type {
  Guest,
  GuestRow,
  Household,
  HouseholdRow,
  HouseholdRsvpStatus,
  InviteRsvpStatus,
  LookupInviteRow,
  PublicGuest,
  PublicInvite,
  WellWish,
  WellWishRow,
} from "@/types";

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

const RSVP_STATUSES: InviteRsvpStatus[] = [
  "pending",
  "attending",
  "declining",
];

function isInviteRsvpStatus(value: unknown): value is InviteRsvpStatus {
  return (
    typeof value === "string" &&
    RSVP_STATUSES.includes(value as InviteRsvpStatus)
  );
}

function mapPublicGuest(row: {
  id: unknown;
  full_name: unknown;
  is_plus_one: unknown;
  rsvp_status: unknown;
}): PublicGuest | null {
  if (typeof row.id !== "string" || typeof row.full_name !== "string") {
    return null;
  }
  if (!isInviteRsvpStatus(row.rsvp_status)) return null;

  return {
    id: row.id,
    fullName: row.full_name,
    isPlusOne: Boolean(row.is_plus_one),
    rsvpStatus: row.rsvp_status,
  };
}

function parseLookupGuests(value: unknown): PublicGuest[] {
  const rows = Array.isArray(value) ? value : [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const guest = mapPublicGuest(row as {
      id: unknown;
      full_name: unknown;
      is_plus_one: unknown;
      rsvp_status: unknown;
    });
    return guest ? [guest] : [];
  });
}

export function mapPublicInvite(row: LookupInviteRow): PublicInvite {
  return {
    label: row.label,
    plusOnesAllowed: row.plus_ones_allowed,
    contactNumber: row.contact_number,
    message: row.message,
    rsvpOpen: Boolean(row.rsvp_open),
    guests: parseLookupGuests(row.guests),
  };
}

export function mapHouseholdRow(row: HouseholdRow): Household {
  return {
    id: row.id,
    inviteCode: row.invite_code,
    label: row.label,
    plusOnesAllowed: row.plus_ones_allowed,
    contactNumber: row.contact_number,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapGuestRow(row: GuestRow): Guest {
  return {
    id: row.id,
    householdId: row.household_id,
    fullName: row.full_name,
    isPlusOne: row.is_plus_one,
    rsvpStatus: row.rsvp_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWellWishRow(row: WellWishRow): WellWish {
  return {
    id: row.id,
    fullName: row.full_name,
    message: row.message,
    contactNumber: row.contact_number,
    createdAt: row.created_at,
  };
}

export function householdStatus(
  guests: { rsvpStatus: InviteRsvpStatus }[],
): HouseholdRsvpStatus {
  if (guests.length === 0) return "pending";

  const statuses = new Set(guests.map((guest) => guest.rsvpStatus));
  if (statuses.size === 1) {
    return guests[0].rsvpStatus;
  }

  return "mixed";
}

export function plusOneAllowanceCopy(allowed: number, label?: string): string {
  const name = label?.trim();
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

export function rsvpStatusLabel(
  status: InviteRsvpStatus | HouseholdRsvpStatus,
) {
  if (status === "attending") return "Attending";
  if (status === "declining") return "Declining";
  if (status === "mixed") return "Mixed";
  return "Pending";
}

export async function withUniqueInviteCode(
  run: (
    code: string,
  ) => Promise<{ error: { message: string; code?: string } | null }>,
) {
  let lastError: { message: string; code?: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await run(generateInviteCode());
    if (!error) return;
    lastError = error;
    if (error.code !== "23505") break;
  }

  throw new Error(
    lastError?.message ?? "Unable to create a unique invite code.",
  );
}
