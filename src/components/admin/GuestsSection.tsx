"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  prefixChoiceFromValue,
  resolvedNamePrefix,
  type NamePrefixChoice,
} from "@/lib/guest-name";
import {
  mapGuestRow,
  mapHouseholdRow,
  rsvpStatusLabel,
  withUniqueInviteCode,
} from "@/lib/invite";
import { createClient } from "@/lib/supabase/client";
import type {
  GuestRow,
  GuestWithHousehold,
  Household,
  HouseholdRow,
  InviteRsvpStatus,
} from "@/types";

type FormMode = "create" | "edit";
type RsvpFilter = "all" | InviteRsvpStatus;
type KindFilter = "all" | "named" | "plus-one";

function guestCountLabel(visible: number, total: number, filtered: boolean) {
  if (!filtered) {
    return `${visible} ${visible === 1 ? "guest" : "guests"}`;
  }
  return `${visible} of ${total} ${total === 1 ? "guest" : "guests"}`;
}

export function GuestsSection() {
  const configured = hasSupabaseEnv();
  const [guests, setGuests] = useState<GuestWithHousehold[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(configured);
  const [errorMessage, setErrorMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const [namePrefix, setNamePrefix] = useState<NamePrefixChoice>(
    emptyNamePrefixChoice(),
  );
  const [householdId, setHouseholdId] = useState("");
  const [newHouseholdLabel, setNewHouseholdLabel] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<InviteRsvpStatus>("pending");
  const [mode, setMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [familyFilter, setFamilyFilter] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    let cancelled = false;

    void Promise.all([
      supabase
        .from("guests")
        .select("*, households(label, invite_code)")
        .order("created_at", { ascending: false }),
      supabase
        .from("households")
        .select("*")
        .order("label", { ascending: true }),
    ]).then(([guestResult, householdResult]) => {
      if (cancelled) return;

      if (guestResult.error || householdResult.error) {
        setErrorMessage("Unable to load guests. Sign in and try again.");
        setGuests([]);
        setHouseholds([]);
        setLoading(false);
        return;
      }

      const guestRows = (guestResult.data ?? []) as Array<
        GuestRow & {
          households: { label: string; invite_code: string } | null;
        }
      >;

      setGuests(
        guestRows.map((row) => ({
          ...mapGuestRow(row),
          householdLabel: row.households?.label ?? "Unknown household",
          householdInviteCode: row.households?.invite_code ?? "",
        })),
      );
      setHouseholds(
        ((householdResult.data ?? []) as HouseholdRow[]).map(mapHouseholdRow),
      );
      setErrorMessage("");
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [configured, reloadToken]);

  const familyNames = useMemo(() => {
    return [...new Set(guests.map((guest) => guest.householdLabel))].sort(
      (left, right) => left.localeCompare(right),
    );
  }, [guests]);

  const filtersActive =
    familyFilter.trim() !== "" || rsvpFilter !== "all" || kindFilter !== "all";

  const filteredGuests = useMemo(() => {
    const familyQuery = familyFilter.trim().toLowerCase();
    return guests.filter((guest) => {
      if (
        familyQuery &&
        !guest.householdLabel.toLowerCase().includes(familyQuery)
      ) {
        return false;
      }
      if (rsvpFilter !== "all" && guest.rsvpStatus !== rsvpFilter) {
        return false;
      }
      if (kindFilter === "named" && guest.isPlusOne) return false;
      if (kindFilter === "plus-one" && !guest.isPlusOne) return false;
      return true;
    });
  }, [familyFilter, guests, kindFilter, rsvpFilter]);

  function resetForm() {
    setFullName("");
    setNamePrefix(emptyNamePrefixChoice());
    setHouseholdId("");
    setNewHouseholdLabel("");
    setRsvpStatus("pending");
    setMode("create");
    setEditingId(null);
  }

  function reload() {
    setReloadToken((value) => value + 1);
  }

  function clearFilters() {
    setFamilyFilter("");
    setRsvpFilter("all");
    setKindFilter("all");
  }

  function startEdit(guest: GuestWithHousehold) {
    setMode("edit");
    setEditingId(guest.id);
    setFullName(guest.fullName);
    setNamePrefix(prefixChoiceFromValue(guest.namePrefix));
    setHouseholdId(guest.householdId);
    setNewHouseholdLabel("");
    setRsvpStatus(guest.rsvpStatus);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;

    const name = fullName.trim();
    if (!name) {
      setErrorMessage("Please enter a guest name.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      if (mode === "edit" && editingId) {
        const { error } = await supabase
          .from("guests")
          .update({
            full_name: name,
            name_prefix: resolvedNamePrefix(namePrefix),
            rsvp_status: rsvpStatus,
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        let targetHouseholdId = householdId;
        const createLabel = newHouseholdLabel.trim();

        if (!targetHouseholdId && !createLabel) {
          setErrorMessage("Pick a household or create a new one.");
          return;
        }

        if (!targetHouseholdId && createLabel) {
          let createdId: string | null = null;
          await withUniqueInviteCode(async (code) => {
            const { data, error } = await supabase
              .from("households")
              .insert({
                label: createLabel,
                plus_ones_allowed: 0,
                invite_code: code,
              })
              .select("id")
              .single();
            if (!error && data) createdId = data.id as string;
            return { error };
          });
          if (!createdId) throw new Error("Unable to create household.");
          targetHouseholdId = createdId;
        }

        const { error } = await supabase.from("guests").insert({
          household_id: targetHouseholdId,
          full_name: name,
          name_prefix: resolvedNamePrefix(namePrefix),
          is_plus_one: false,
          rsvp_status: rsvpStatus,
        });

        if (error) throw error;
      }

      resetForm();
      reload();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save this guest.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(guest: GuestWithHousehold) {
    if (!guest.isPlusOne) {
      const namedCount = guests.filter(
        (row) => row.householdId === guest.householdId && !row.isPlusOne,
      ).length;
      if (namedCount <= 1) {
        setErrorMessage(
          "This is the last named guest. Delete the household instead, or add another named guest first.",
        );
        return;
      }
    }

    if (
      !window.confirm(
        `Remove ${formatGuestDisplayName(guest.fullName, guest.namePrefix)} from the guest list?`,
      )
    ) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("guests").delete().eq("id", guest.id);
    if (error) {
      setErrorMessage("Unable to delete this guest.");
      return;
    }
    if (editingId === guest.id) resetForm();
    reload();
  }

  return (
    <section
      id="guests"
      className="scroll-mt-24 border-t border-zinc-200 dark:border-zinc-800"
    >
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <p className="text-sm tracking-wide text-zinc-500 uppercase">Guests</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Headcount
        </h2>
        <p className="mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
          Every person on the list, including plus-ones. You can still change
          RSVPs here after the public deadline.
        </p>

        {!configured ? (
          <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
            Connect Supabase to manage guests.
          </p>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mt-10 space-y-6">
              <GuestNameFields
                prefix={namePrefix}
                onPrefixChange={setNamePrefix}
                fullName={fullName}
                onFullNameChange={setFullName}
              />

              {mode === "create" ? (
                <>
                  <label className="block">
                    <span className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
                      Household
                    </span>
                    <select
                      value={householdId}
                      onChange={(event) => setHouseholdId(event.target.value)}
                      className={adminInputClassName}
                    >
                      <option value="">Create a new household</option>
                      {households.map((household) => (
                        <option key={household.id} value={household.id}>
                          {household.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!householdId ? (
                    <label className="block">
                      <span className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
                        New household label
                      </span>
                      <input
                        required
                        value={newHouseholdLabel}
                        onChange={(event) =>
                          setNewHouseholdLabel(event.target.value)
                        }
                        placeholder="The Santos Family"
                        className={adminInputClassName}
                      />
                    </label>
                  ) : null}
                </>
              ) : null}

              <label className="block">
                <span className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
                  RSVP
                </span>
                <select
                  value={rsvpStatus}
                  onChange={(event) =>
                    setRsvpStatus(event.target.value as InviteRsvpStatus)
                  }
                  className={adminInputClassName}
                >
                  <option value="pending">Pending</option>
                  <option value="attending">Attending</option>
                  <option value="declining">Declining</option>
                </select>
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className={adminPrimaryButtonClassName}
                >
                  {saving
                    ? "Saving…"
                    : mode === "edit"
                      ? "Save guest"
                      : "Add guest"}
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

            <div className="mt-12">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
                    Family name
                  </span>
                  <input
                    list="headcount-family-names"
                    value={familyFilter}
                    onChange={(event) => setFamilyFilter(event.target.value)}
                    placeholder="All families"
                    className={adminInputClassName}
                  />
                  <datalist id="headcount-family-names">
                    {familyNames.map((label) => (
                      <option key={label} value={label} />
                    ))}
                  </datalist>
                </label>
                <label className="block">
                  <span className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
                    RSVP
                  </span>
                  <select
                    value={rsvpFilter}
                    onChange={(event) =>
                      setRsvpFilter(event.target.value as RsvpFilter)
                    }
                    className={adminInputClassName}
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="attending">Attending</option>
                    <option value="declining">Declining</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
                    Guest type
                  </span>
                  <select
                    value={kindFilter}
                    onChange={(event) =>
                      setKindFilter(event.target.value as KindFilter)
                    }
                    className={adminInputClassName}
                  >
                    <option value="all">All guests</option>
                    <option value="named">Named guest</option>
                    <option value="plus-one">Plus-one</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-zinc-500">
                  {loading
                    ? "Counting guests…"
                    : guestCountLabel(
                        filteredGuests.length,
                        guests.length,
                        filtersActive,
                      )}
                </p>
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm underline underline-offset-4"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>

              <div className="mt-4 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {loading ? (
                  <p className="py-6 text-sm text-zinc-500">Loading guests…</p>
                ) : guests.length === 0 ? (
                  <p className="py-6 text-sm text-zinc-500">
                    No guests yet. Add a person above or create a household.
                  </p>
                ) : filteredGuests.length === 0 ? (
                  <p className="py-6 text-sm text-zinc-500">
                    No guests match these filters.
                  </p>
                ) : (
                  filteredGuests.map((guest) => (
                    <article key={guest.id} className="py-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-medium tracking-tight">
                            {formatGuestDisplayName(
                              guest.fullName,
                              guest.namePrefix,
                            )}
                          </h3>
                          <p className="mt-1 text-sm text-zinc-500">
                            {guest.householdLabel}
                            {" · "}
                            {guest.isPlusOne ? "Plus-one" : "Named guest"}
                            {" · "}
                            {rsvpStatusLabel(guest.rsvpStatus)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <button
                            type="button"
                            onClick={() => startEdit(guest)}
                            className="underline underline-offset-4"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDelete(guest)}
                            className="underline underline-offset-4"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
