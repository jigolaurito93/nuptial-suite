"use client";

import { useEffect, useState, type FormEvent } from "react";
import { GuestNameFields } from "@/components/admin/GuestNameFields";
import {
  adminInputClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "@/components/admin/formStyles";
import { hasSupabaseEnv } from "@/lib/env";
import {
  emptyNamePrefixChoice,
  formatGuestDisplayName,
  resolvedNamePrefix,
  type NamePrefixChoice,
} from "@/lib/guest-name";
import {
  householdStatus,
  inviteLink,
  mapGuestRow,
  mapHouseholdRow,
  rsvpStatusLabel,
  withUniqueInviteCode,
} from "@/lib/invite";
import { createClient } from "@/lib/supabase/client";
import type { Guest, GuestRow, Household, HouseholdRow } from "@/types";

type HouseholdWithGuests = Household & { guests: Guest[] };

type NamedGuestDraft = {
  prefix: NamePrefixChoice;
  name: string;
};

type FormMode = "create" | "edit";

function emptyNamedGuestDraft(): NamedGuestDraft {
  return { prefix: emptyNamePrefixChoice(), name: "" };
}

function plusOnesCopy(allowed: number) {
  if (allowed === 0) return "No plus-ones";
  if (allowed === 1) return "1 plus-one allowed";
  return `${allowed} plus-ones allowed`;
}

export function HouseholdsSection() {
  const configured = hasSupabaseEnv();
  const [households, setHouseholds] = useState<HouseholdWithGuests[]>([]);
  const [loading, setLoading] = useState(configured);
  const [errorMessage, setErrorMessage] = useState("");
  const [label, setLabel] = useState("");
  const [plusOnesAllowed, setPlusOnesAllowed] = useState(0);
  const [namedGuests, setNamedGuests] = useState<NamedGuestDraft[]>([
    emptyNamedGuestDraft(),
  ]);
  const [mode, setMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addGuestHouseholdId, setAddGuestHouseholdId] = useState<string | null>(
    null,
  );
  const [addGuestName, setAddGuestName] = useState("");
  const [addGuestPrefix, setAddGuestPrefix] = useState(emptyNamePrefixChoice());
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    let cancelled = false;

    void supabase
      .from("households")
      .select("*, guests(*)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setErrorMessage("Unable to load households. Sign in and try again.");
          setHouseholds([]);
          setLoading(false);
          return;
        }

        const rows = (data ?? []) as Array<
          HouseholdRow & { guests: GuestRow[] | null }
        >;
        setHouseholds(
          rows.map((row) => ({
            ...mapHouseholdRow(row),
            guests: (row.guests ?? []).map(mapGuestRow),
          })),
        );
        setErrorMessage("");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [configured, reloadToken]);

  function resetForm() {
    setLabel("");
    setPlusOnesAllowed(0);
    setNamedGuests([emptyNamedGuestDraft()]);
    setMode("create");
    setEditingId(null);
  }

  function reload() {
    setReloadToken((value) => value + 1);
  }

  function startEdit(household: HouseholdWithGuests) {
    setMode("edit");
    setEditingId(household.id);
    setLabel(household.label);
    setPlusOnesAllowed(household.plusOnesAllowed);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;

    const nextLabel = label.trim();
    if (!nextLabel) {
      setErrorMessage("Please enter a household label.");
      return;
    }

    const allowed = Number.isFinite(plusOnesAllowed)
      ? Math.max(0, Math.floor(plusOnesAllowed))
      : 0;
    const names = namedGuests
      .map((guest) => ({
        fullName: guest.name.trim(),
        namePrefix: resolvedNamePrefix(guest.prefix),
      }))
      .filter((guest) => guest.fullName);

    if (mode === "create" && names.length === 0) {
      setErrorMessage("Add at least one named guest.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      if (mode === "edit" && editingId) {
        const household = households.find((row) => row.id === editingId);
        const plusOneCount =
          household?.guests.filter((guest) => guest.isPlusOne).length ?? 0;
        if (allowed < plusOneCount) {
          setErrorMessage(
            `This household already has ${plusOneCount} plus-one${plusOneCount === 1 ? "" : "s"}. Remove extra plus-ones from Guests before lowering the allowance.`,
          );
          return;
        }

        const { error } = await supabase
          .from("households")
          .update({
            label: nextLabel,
            plus_ones_allowed: allowed,
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        let householdId: string | null = null;

        await withUniqueInviteCode(async (code) => {
          const { data, error } = await supabase
            .from("households")
            .insert({
              label: nextLabel,
              plus_ones_allowed: allowed,
              invite_code: code,
            })
            .select("id")
            .single();

          if (!error && data) householdId = data.id as string;
          return { error };
        });

        if (!householdId) {
          throw new Error("Unable to create household.");
        }

        const { error: guestError } = await supabase.from("guests").insert(
          names.map((guest) => ({
            household_id: householdId,
            full_name: guest.fullName,
            name_prefix: guest.namePrefix,
            is_plus_one: false,
          })),
        );

        if (guestError) {
          await supabase.from("households").delete().eq("id", householdId);
          throw guestError;
        }
      }

      resetForm();
      reload();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save this household.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onAddNamedGuest(household: HouseholdWithGuests) {
    const name = addGuestName.trim();
    if (!name) {
      setErrorMessage("Enter a name for the guest.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("guests").insert({
      household_id: household.id,
      full_name: name,
      name_prefix: resolvedNamePrefix(addGuestPrefix),
      is_plus_one: false,
    });

    if (error) {
      setErrorMessage("Unable to add this guest.");
      return;
    }

    setAddGuestHouseholdId(null);
    setAddGuestName("");
    setAddGuestPrefix(emptyNamePrefixChoice());
    reload();
  }

  async function onDelete(household: HouseholdWithGuests) {
    if (
      !window.confirm(
        `Delete ${household.label}? This removes every guest on this invitation.`,
      )
    ) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("households")
      .delete()
      .eq("id", household.id);
    if (error) {
      setErrorMessage("Unable to delete this household.");
      return;
    }
    if (editingId === household.id) resetForm();
    reload();
  }

  async function onCopyLink(household: HouseholdWithGuests) {
    const url = inviteLink(window.location.origin, household.inviteCode);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(household.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === household.id ? null : current));
      }, 2000);
    } catch {
      setErrorMessage("Unable to copy the invite link.");
    }
  }

  async function onRegenerate(household: HouseholdWithGuests) {
    if (
      !window.confirm(
        `Regenerate the link for ${household.label}? The current link will stop working.`,
      )
    ) {
      return;
    }

    try {
      const supabase = createClient();
      await withUniqueInviteCode(async (code) => {
        const { error } = await supabase
          .from("households")
          .update({ invite_code: code })
          .eq("id", household.id);
        return { error };
      });
      reload();
    } catch {
      setErrorMessage("Unable to regenerate this link.");
    }
  }

  return (
    <section
      id="households"
      className="scroll-mt-24 border-t border-zinc-200 dark:border-zinc-800"
    >
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <p className="text-sm tracking-wide text-zinc-500 uppercase">
          Households
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Invitation cards
        </h2>
        <p className="mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
          One household is one forever link. Named family members belong here;
          plus-ones are extra unnamed seats.
        </p>

        {!configured ? (
          <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
            Connect Supabase to manage households.
          </p>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mt-10 space-y-6">
              <label className="block">
                <span className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
                  Household label
                </span>
                <input
                  required
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="The Santos Family"
                  className={adminInputClassName}
                />
              </label>

              <label className="block">
                <span className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
                  Plus-ones allowed
                </span>
                <input
                  required
                  type="number"
                  min={0}
                  max={10}
                  value={plusOnesAllowed}
                  onChange={(event) =>
                    setPlusOnesAllowed(Number(event.target.value))
                  }
                  className={adminInputClassName}
                />
              </label>

              {mode === "create" ? (
                <fieldset className="space-y-6">
                  <legend className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
                    Named guests
                  </legend>
                  {namedGuests.map((guest, index) => (
                    <GuestNameFields
                      key={index}
                      prefix={guest.prefix}
                      onPrefixChange={(prefix) => {
                        const next = [...namedGuests];
                        next[index] = { ...next[index], prefix };
                        setNamedGuests(next);
                      }}
                      fullName={guest.name}
                      onFullNameChange={(name) => {
                        const next = [...namedGuests];
                        next[index] = { ...next[index], name };
                        setNamedGuests(next);
                      }}
                      nameRequired={index === 0}
                      namePlaceholder="Full name"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setNamedGuests((current) => [
                        ...current,
                        emptyNamedGuestDraft(),
                      ])
                    }
                    className="text-sm underline underline-offset-4"
                  >
                    Add another named guest
                  </button>
                </fieldset>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className={adminPrimaryButtonClassName}
                >
                  {saving
                    ? "Saving…"
                    : mode === "edit"
                      ? "Save household"
                      : "Add household"}
                </button>
                {mode === "edit" ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className={adminSecondaryButtonClassName}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            {errorMessage ? (
              <p className="mt-6 text-sm text-red-700" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-12 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {loading ? (
                <p className="py-6 text-sm text-zinc-500">
                  Loading households…
                </p>
              ) : households.length === 0 ? (
                <p className="py-6 text-sm text-zinc-500">
                  No households yet. Add a family above to create their link.
                </p>
              ) : (
                households.map((household) => {
                  const named = household.guests.filter(
                    (guest) => !guest.isPlusOne,
                  );
                  const plusOnes = household.guests.filter(
                    (guest) => guest.isPlusOne,
                  );
                  return (
                    <article key={household.id} className="py-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-medium tracking-tight">
                            {household.label}
                          </h3>
                          <p className="mt-1 text-sm text-zinc-500">
                            {rsvpStatusLabel(householdStatus(household.guests))}
                            {" · "}
                            {plusOnesCopy(household.plusOnesAllowed)}
                          </p>
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {named
                              .map((guest) =>
                                formatGuestDisplayName(
                                  guest.fullName,
                                  guest.namePrefix,
                                ),
                              )
                              .join(", ") || "No named guests"}
                          </p>
                          {plusOnes.length > 0 ? (
                            <p className="mt-1 text-sm text-zinc-500">
                              Plus-ones:{" "}
                              {plusOnes
                                .map((guest) =>
                                  formatGuestDisplayName(
                                    guest.fullName,
                                    guest.namePrefix,
                                  ),
                                )
                                .join(", ")}
                            </p>
                          ) : null}
                          {household.contactNumber ? (
                            <p className="mt-1 text-sm text-zinc-500">
                              {household.contactNumber}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <button
                            type="button"
                            onClick={() => void onCopyLink(household)}
                            className="underline underline-offset-4"
                          >
                            {copiedId === household.id ? "Copied" : "Copy link"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void onRegenerate(household)}
                            className="underline underline-offset-4"
                          >
                            Regenerate link
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(household)}
                            className="underline underline-offset-4"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddGuestHouseholdId(household.id);
                              setAddGuestName("");
                              setAddGuestPrefix(emptyNamePrefixChoice());
                            }}
                            className="underline underline-offset-4"
                          >
                            Add guest
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDelete(household)}
                            className="underline underline-offset-4"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {addGuestHouseholdId === household.id ? (
                        <form
                          className="mt-4 space-y-4"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void onAddNamedGuest(household);
                          }}
                        >
                          <GuestNameFields
                            compact
                            prefix={addGuestPrefix}
                            onPrefixChange={setAddGuestPrefix}
                            fullName={addGuestName}
                            onFullNameChange={setAddGuestName}
                            namePlaceholder="Named guest"
                          />
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="submit"
                              className={adminPrimaryButtonClassName}
                            >
                              Save guest
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddGuestHouseholdId(null);
                                setAddGuestName("");
                                setAddGuestPrefix(emptyNamePrefixChoice());
                              }}
                              className={adminSecondaryButtonClassName}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
