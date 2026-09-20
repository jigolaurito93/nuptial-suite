export function authDisplayName(
  metadata: Record<string, unknown> | null | undefined,
  fallback: string,
) {
  if (!metadata) return fallback;
  for (const key of ["display_name", "full_name", "name"] as const) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}
