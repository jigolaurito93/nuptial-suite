export const GUEST_PREFIX_OPTIONS = [
  "Mr.",
  "Ms.",
  "Mrs.",
  "Dr.",
  "Atty.",
  "Eng.",
] as const;

export type StandardGuestPrefix = (typeof GUEST_PREFIX_OPTIONS)[number];

export const CUSTOM_PREFIX_VALUE = "custom";

export type NamePrefixChoice = {
  selected: "" | StandardGuestPrefix | typeof CUSTOM_PREFIX_VALUE;
  custom: string;
};

export function emptyNamePrefixChoice(): NamePrefixChoice {
  return { selected: "", custom: "" };
}

export function normalizeNamePrefix(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function resolvedNamePrefix(choice: NamePrefixChoice): string | null {
  if (choice.selected === CUSTOM_PREFIX_VALUE) {
    return normalizeNamePrefix(choice.custom) || null;
  }
  return choice.selected || null;
}

export function prefixChoiceFromValue(
  value: string | null | undefined,
): NamePrefixChoice {
  const prefix = normalizeNamePrefix(value ?? "");
  if (!prefix) return emptyNamePrefixChoice();
  if ((GUEST_PREFIX_OPTIONS as readonly string[]).includes(prefix)) {
    return { selected: prefix as StandardGuestPrefix, custom: "" };
  }
  return { selected: CUSTOM_PREFIX_VALUE, custom: prefix };
}

export function formatGuestDisplayName(
  fullName: string,
  prefix?: string | null,
) {
  const name = fullName.trim();
  const honorific = normalizeNamePrefix(prefix ?? "");
  if (!honorific) return name;
  if (name.toLowerCase().startsWith(`${honorific.toLowerCase()} `)) {
    return name;
  }
  return `${honorific} ${name}`;
}
