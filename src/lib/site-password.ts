export const UNLOCK_COOKIE_NAME = "ns_guest_unlock";
export const UNLOCK_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

const UNLOCK_PAYLOAD = "nuptial-suite:guest:v1";

export function isSitePasswordEnabled() {
  const password = process.env.SITE_PASSWORD;
  if (!password) return false;

  const flag = process.env.SITE_PASSWORD_ENABLED?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;

  return process.env.NODE_ENV === "production";
}

export function getSitePassword() {
  return process.env.SITE_PASSWORD ?? "";
}

export function unlockCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UNLOCK_COOKIE_MAX_AGE,
  };
}

export async function createUnlockToken() {
  return hmacHex(getSitePassword(), UNLOCK_PAYLOAD);
}

export async function isUnlockTokenValid(token: string | undefined) {
  if (!token || !getSitePassword()) return false;
  const expected = await createUnlockToken();
  return timingSafeEqual(token, expected);
}

export function passwordsMatch(input: string, expected: string) {
  return timingSafeEqual(input, expected);
}

function timingSafeEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  const length = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }

  return mismatch === 0;
}

async function hmacHex(secret: string, value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value),
  );

  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
