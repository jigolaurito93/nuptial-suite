"use client";

import { adminInputClassName, adminLabelClassName } from "@/components/admin/formStyles";
import {
  CUSTOM_PREFIX_VALUE,
  GUEST_PREFIX_OPTIONS,
  type NamePrefixChoice,
} from "@/lib/guest-name";

type GuestNameFieldsProps = {
  prefix: NamePrefixChoice;
  onPrefixChange: (value: NamePrefixChoice) => void;
  fullName: string;
  onFullNameChange: (value: string) => void;
  nameRequired?: boolean;
  compact?: boolean;
  namePlaceholder?: string;
};

export function GuestNameFields({
  prefix,
  onPrefixChange,
  fullName,
  onFullNameChange,
  nameRequired = true,
  compact = false,
  namePlaceholder = "Full name",
}: GuestNameFieldsProps) {
  const inputClassName = compact
    ? `${adminInputClassName} mt-0`
    : adminInputClassName;

  return (
    <div className="space-y-3">
      {prefix.selected === CUSTOM_PREFIX_VALUE ? (
        <label className={compact ? "block max-w-xs" : "block"}>
          <span className={adminLabelClassName}>
            Custom prefix
          </span>
          <input
            value={prefix.custom}
            onChange={(event) =>
              onPrefixChange({ ...prefix, custom: event.target.value })
            }
            placeholder="Hon."
            className={inputClassName}
          />
        </label>
      ) : null}

      <div className="flex min-w-0 flex-wrap gap-3 sm:flex-nowrap">
        <label className="block w-full shrink-0 sm:w-36">
          <span className={adminLabelClassName}>
            Prefix
          </span>
          <select
            value={prefix.selected}
            onChange={(event) =>
              onPrefixChange({
                ...prefix,
                selected: event.target.value as NamePrefixChoice["selected"],
              })
            }
            className={inputClassName}
          >
            <option value="">None</option>
            {GUEST_PREFIX_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={CUSTOM_PREFIX_VALUE}>Custom</option>
          </select>
        </label>

        <label className="block min-w-0 flex-1">
          <span className={adminLabelClassName}>
            Full name
          </span>
          <input
            required={nameRequired}
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
            placeholder={namePlaceholder}
            className={inputClassName}
          />
        </label>
      </div>
    </div>
  );
}
