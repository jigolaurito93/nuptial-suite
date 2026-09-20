"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminModal } from "@/components/admin/AdminModal";
import { GuestNameFields } from "@/components/admin/GuestNameFields";
import {
  adminCompactButtonActiveClassName,
  adminCompactButtonClassName,
  adminCompactSelectClassName,
  adminErrorClassName,
  adminInputClassName,
  adminItemTitleClassName,
  adminLabelClassName,
  adminLinkClassName,
  adminListClassName,
  adminMutedTextClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
  adminSectionClassName,
  adminSectionInnerClassName,
} from "@/components/admin/formStyles";
import { AdminSectionHeading } from "@/components/admin/AdminSectionHeading";
import { hasSupabaseEnv } from "@/lib/env";
import {
  emptyNamePrefixChoice,
  formatGuestDisplayName,
  prefixChoiceFromValue,
  resolvedNamePrefix,
  type NamePrefixChoice,
} from "@/lib/guest-name";
import {
  buildHeadcountPeople,
  headcountSummary,
  mapGuestRow,
  mapHouseholdRow,
  rsvpStatusLabel,
  withUniqueInviteCode,
} from "@/lib/invite";
import { createClient } from "@/lib/supabase/client";
import type {
  GuestRow,
  GuestWithHousehold,
  HeadcountPerson,
  Household,
  HouseholdRow,
  InviteRsvpStatus,
} from "@/types";

type FormMode = "create" | "edit";
type RsvpFilter = "all" | InviteRsvpStatus;
type KindFilter = "all" | "named" | "plus-one";
type PageSize = 10 | 25 | 50 | "all";

const PAGE_SIZE_OPTIONS: { value: PageSize; label: string }[] = [
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: "all", label: "All" },
];

const compactSelectClassName = adminCompactSelectClassName;

function guestCountLabel(visible: number, total: number, filtered: boolean) {
  if (!filtered) {
    return `${visible} ${visible === 1 ? "guest" : "guests"}`;
  }
  return `${visible} of ${total} ${total === 1 ? "guest" : "guests"}`;
}

function pageCountFor(size: PageSize, total: number) {
  if (size === "all" || total === 0) return 1;
  return Math.max(1, Math.ceil(total / size));
}

function pageRangeLabel(page: number, size: PageSize, total: number) {
  if (total === 0) return "";
  if (size === "all") {
    return `Showing ${total} ${total === 1 ? "guest" : "guests"}`;
  }
  const start = (page - 1) * size + 1;
  const end = Math.min(page * size, total);
  return `Showing ${start}–${end} of ${total}`;
}

function HeadcountPager({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={adminCompactButtonClassName}
      >
        Previous
      </button>
      <label className={`flex items-center gap-2 ${adminMutedTextClassName}`}>
        <span className={adminLabelClassName}>Page</span>
        <select
          value={page}
          onChange={(event) => onPageChange(Number(event.target.value))}
          className={compactSelectClassName}
        >
          {Array.from({ length: pageCount }, (_, index) => (
            <option key={index + 1} value={index + 1}>
              Page {index + 1}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className={adminCompactButtonClassName}
      >
        Next
      </button>
    </div>
  );
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
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [familyFilter, setFamilyFilter] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);

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
    const labels = new Set([
      ...guests.map((guest) => guest.householdLabel),
      ...households.map((household) => household.label),
    ]);
    return [...labels].sort((left, right) => left.localeCompare(right));
  }, [guests, households]);

  const headcountPeople = useMemo(
    () => buildHeadcountPeople(guests, households),
    [guests, households],
  );

  const summary = useMemo(
    () => headcountSummary(headcountPeople),
    [headcountPeople],
  );

  const filtersActive =
    familyFilter.trim() !== "" || rsvpFilter !== "all" || kindFilter !== "all";

  const filteredGuests = useMemo(() => {
    const familyQuery = familyFilter.trim().toLowerCase();
    return headcountPeople.filter((guest) => {
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
  }, [familyFilter, headcountPeople, kindFilter, rsvpFilter]);

  const pageCount = pageCountFor(pageSize, filteredGuests.length);
  const currentPage = Math.min(page, pageCount);
  const showPager = pageSize !== "all" && pageCount > 1;
  const pagedGuests = useMemo(() => {
    if (pageSize === "all") return filteredGuests;
    const start = (currentPage - 1) * pageSize;
    return filteredGuests.slice(start, start + pageSize);
  }, [currentPage, filteredGuests, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [familyFilter, rsvpFilter, kindFilter, pageSize]);

  function resetForm() {
    setFullName("");
    setNamePrefix(emptyNamePrefixChoice());
    setHouseholdId("");
    setNewHouseholdLabel("");
    setRsvpStatus("pending");
    setMode("create");
    setEditingId(null);
    setFormOpen(false);
  }

  function reload() {
    setReloadToken((value) => value + 1);
  }

  function clearFilters() {
    setFamilyFilter("");
    setRsvpFilter("all");
    setKindFilter("all");
  }

  function onPageSizeChange(size: PageSize) {
    setPageSize(size);
    setPage(1);
  }

  function openCreate() {
    setErrorMessage("");
    setFullName("");
    setNamePrefix(emptyNamePrefixChoice());
    setHouseholdId("");
    setNewHouseholdLabel("");
    setRsvpStatus("pending");
    setMode("create");
    setEditingId(null);
    setFormOpen(true);
  }

  function startEdit(guest: HeadcountPerson) {
    if (guest.isPlaceholder) return;
    setErrorMessage("");
    setMode("edit");
    setEditingId(guest.id);
    setFullName(guest.fullName);
    setNamePrefix(prefixChoiceFromValue(guest.namePrefix));
    setHouseholdId(guest.householdId);
    setNewHouseholdLabel("");
    setRsvpStatus(guest.rsvpStatus);
    setFormOpen(true);
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

  async function onDelete(guest: HeadcountPerson) {
    if (guest.isPlaceholder) return;
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
    <section id="guests" className={adminSectionClassName}>
      <div className={adminSectionInnerClassName}>
        <AdminSectionHeading
          eyebrow="Guests"
          title="Headcount"
          description="Every invited person, including reserved plus-one seats that have not been named yet. You can still change RSVPs here after the public deadline."
        />

        {!configured ? (
          <p className={`mt-8 ${adminMutedTextClassName}`}>
            Connect Supabase to manage guests.
          </p>
        ) : (
          <>
            <div className="mt-10">
              <button
                type="button"
                onClick={openCreate}
                className={adminPrimaryButtonClassName}
              >
                Add guest
              </button>
            </div>

            {errorMessage && !formOpen ? (
              <p className={`mt-6 ${adminErrorClassName}`} role="alert">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-12">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className={adminLabelClassName}>
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
                  <span className={adminLabelClassName}>
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
                  <span className={adminLabelClassName}>
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

              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <div className={`space-y-1 ${adminMutedTextClassName}`}>
                  {loading ? (
                    <p>Counting guests…</p>
                  ) : (
                    <>
                      <p>
                        Invited {summary.invited}
                        {" · "}
                        {summary.named} named
                        {" · "}
                        {summary.plusOneSeats} plus-one{" "}
                        {summary.plusOneSeats === 1 ? "seat" : "seats"}
                      </p>
                      <p>
                        Pending {summary.pending}
                        {" · "}
                        Attending {summary.attending}
                        {" · "}
                        Declining {summary.declining}
                      </p>
                      {filtersActive ? (
                        <p>
                          {guestCountLabel(
                            filteredGuests.length,
                            headcountPeople.length,
                            true,
                          )}
                        </p>
                      ) : null}
                      {!loading && filteredGuests.length > 0 ? (
                        <p>
                          {pageRangeLabel(
                            currentPage,
                            pageSize,
                            filteredGuests.length,
                          )}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={adminLinkClassName}
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className={adminLabelClassName}>
                    Show
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PAGE_SIZE_OPTIONS.map((option) => {
                      const selected = pageSize === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => onPageSizeChange(option.value)}
                          className={
                            selected
                              ? adminCompactButtonActiveClassName
                              : adminCompactButtonClassName
                          }
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {showPager ? (
                  <HeadcountPager
                    page={currentPage}
                    pageCount={pageCount}
                    onPageChange={setPage}
                  />
                ) : null}
              </div>

              <div className={`${adminListClassName} mt-4`}>
                {loading ? (
                  <p className={`py-6 ${adminMutedTextClassName}`}>
                    Loading guests…
                  </p>
                ) : headcountPeople.length === 0 ? (
                  <p className={`py-6 ${adminMutedTextClassName}`}>
                    No guests yet. Add a person or create a household.
                  </p>
                ) : filteredGuests.length === 0 ? (
                  <p className={`py-6 ${adminMutedTextClassName}`}>
                    No guests match these filters.
                  </p>
                ) : (
                  pagedGuests.map((guest) => (
                    <article key={guest.id} className="py-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className={adminItemTitleClassName}>
                            {formatGuestDisplayName(
                              guest.fullName,
                              guest.namePrefix,
                            )}
                          </h3>
                          <p className={`mt-1 ${adminMutedTextClassName}`}>
                            {guest.householdLabel}
                            {" · "}
                            {guest.isPlusOne ? "Plus-one" : "Named guest"}
                            {" · "}
                            {rsvpStatusLabel(guest.rsvpStatus)}
                            {guest.isPlaceholder ? " · Reserved seat" : null}
                          </p>
                        </div>
                        {guest.isPlaceholder ? null : (
                          <div className="flex flex-wrap gap-3 text-sm">
                            <button
                              type="button"
                              onClick={() => startEdit(guest)}
                              className={adminLinkClassName}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDelete(guest)}
                              className={adminLinkClassName}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>

              {showPager ? (
                <div className="mt-6">
                  <HeadcountPager
                    page={currentPage}
                    pageCount={pageCount}
                    onPageChange={setPage}
                  />
                </div>
              ) : null}
            </div>

            <AdminModal
              open={formOpen}
              title={mode === "edit" ? "Edit guest" : "Add guest"}
              onClose={resetForm}
            >
              <form onSubmit={onSubmit} className="space-y-6">
                <GuestNameFields
                  prefix={namePrefix}
                  onPrefixChange={setNamePrefix}
                  fullName={fullName}
                  onFullNameChange={setFullName}
                />

                {mode === "create" ? (
                  <>
                    <label className="block">
                      <span className={adminLabelClassName}>
                        Household
                      </span>
                      <select
                        value={householdId}
                        onChange={(event) =>
                          setHouseholdId(event.target.value)
                        }
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
                        <span className={adminLabelClassName}>
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
                  <span className={adminLabelClassName}>
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

                {errorMessage ? (
                  <p className={adminErrorClassName} role="alert">
                    {errorMessage}
                  </p>
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
                        ? "Save guest"
                        : "Add guest"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className={adminSecondaryButtonClassName}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </AdminModal>
          </>
        )}
      </div>
    </section>
  );
}
