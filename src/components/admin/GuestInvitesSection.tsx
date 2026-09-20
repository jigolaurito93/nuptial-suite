"use client";

import { useEffect, useState, type FormEvent } from "react";
import { hasSupabaseEnv } from "@/lib/env";
import { generateInviteCode, inviteLink, mapInviteRow } from "@/lib/invite";
import { createClient } from "@/lib/supabase/client";
import type { Invite, InviteRow } from "@/types";

type FormMode = "create" | "edit";

const inputClassName =
  "mt-2 w-full border border-zinc-300 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50";

function statusLabel(status: Invite["rsvpStatus"]) {
  if (status === "attending") return "Attending";
  if (status === "declining") return "Declining";
  return "Pending";
}

export function GuestInvitesSection() {
  const configured = hasSupabaseEnv();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(configured);
  const [errorMessage, setErrorMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [plusOnesAllowed, setPlusOnesAllowed] = useState(0);
  const [mode, setMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    let cancelled = false;

    void supabase
      .from("invites")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setErrorMessage("Unable to load invitations. Sign in and try again.");
          setInvites([]);
          setLoading(false);
          return;
        }

        setInvites(((data ?? []) as InviteRow[]).map(mapInviteRow));
        setErrorMessage("");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [configured, reloadToken]);

  function resetForm() {
    setDisplayName("");
    setPlusOnesAllowed(0);
    setMode("create");
    setEditingId(null);
  }

  function reloadInvites() {
    setReloadToken((value) => value + 1);
  }

  function startEdit(invite: Invite) {
    setMode("edit");
    setEditingId(invite.id);
    setDisplayName(invite.displayName);
    setPlusOnesAllowed(invite.plusOnesAllowed);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;

    const name = displayName.trim();
    if (!name) {
      setErrorMessage("Please enter a name for this invitation.");
      return;
    }

    const allowed = Number.isFinite(plusOnesAllowed)
      ? Math.max(0, Math.floor(plusOnesAllowed))
      : 0;

    setSaving(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      if (mode === "edit" && editingId) {
        const { error } = await supabase
          .from("invites")
          .update({
            display_name: name,
            plus_ones_allowed: allowed,
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        let inserted = false;
        let lastError: { message: string; code?: string } | null = null;

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const { error } = await supabase.from("invites").insert({
            display_name: name,
            plus_ones_allowed: allowed,
            invite_code: generateInviteCode(),
          });

          if (!error) {
            inserted = true;
            break;
          }

          lastError = error;
          if (error.code !== "23505") break;
        }

        if (!inserted) {
          throw new Error(lastError?.message ?? "Unable to create invitation.");
        }
      }

      resetForm();
      reloadInvites();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save this invitation.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(invite: Invite) {
    if (
      !window.confirm(
        `Delete the invitation for ${invite.displayName}? This cannot be undone.`,
      )
    ) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("invites")
      .delete()
      .eq("id", invite.id);
    if (error) {
      setErrorMessage("Unable to delete this invitation.");
      return;
    }
    if (editingId === invite.id) resetForm();
    reloadInvites();
  }

  async function onCopyLink(invite: Invite) {
    const url = inviteLink(window.location.origin, invite.inviteCode);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invite.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === invite.id ? null : current));
      }, 2000);
    } catch {
      setErrorMessage("Unable to copy the invite link.");
    }
  }

  return (
    <section
      id="guests"
      className="scroll-mt-24 border-t border-zinc-200 dark:border-zinc-800"
    >
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <p className="text-sm tracking-wide text-zinc-500 uppercase">Guests</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Invitations
        </h2>
        <p className="mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
          Each row is one invitation card. Set how many unnamed plus-ones they
          may bring, then share their unique link.
        </p>

        {!configured ? (
          <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
            Connect Supabase to manage invitations.
          </p>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mt-10 space-y-6">
              <label className="block">
                <span className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
                  Invitation name
                </span>
                <input
                  required
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Maria Santos & Guest"
                  className={inputClassName}
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
                  className={inputClassName}
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="border border-zinc-950 bg-zinc-950 px-6 py-3 text-sm tracking-[0.18em] text-white uppercase transition hover:bg-transparent hover:text-zinc-950 disabled:opacity-60 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:text-zinc-50"
                >
                  {saving
                    ? "Saving…"
                    : mode === "edit"
                      ? "Save invitation"
                      : "Add invitation"}
                </button>
                {mode === "edit" ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-zinc-300 px-6 py-3 text-sm tracking-[0.18em] uppercase dark:border-zinc-700"
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
                  Loading invitations…
                </p>
              ) : invites.length === 0 ? (
                <p className="py-6 text-sm text-zinc-500">
                  No invitations yet. Add a guest above to create their link.
                </p>
              ) : (
                invites.map((invite) => (
                  <article key={invite.id} className="py-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-medium tracking-tight">
                          {invite.displayName}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          {statusLabel(invite.rsvpStatus)}
                          {" · "}
                          {invite.plusOnesAllowed === 0
                            ? "No plus-ones"
                            : invite.plusOnesAllowed === 1
                              ? "1 plus-one allowed"
                              : `${invite.plusOnesAllowed} plus-ones allowed`}
                        </p>
                        {invite.contactNumber ? (
                          <p className="mt-1 text-sm text-zinc-500">
                            {invite.contactNumber}
                          </p>
                        ) : null}
                        {invite.plusOneNames.length > 0 ? (
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            Plus-ones: {invite.plusOneNames.join(", ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <button
                          type="button"
                          onClick={() => void onCopyLink(invite)}
                          className="underline underline-offset-4"
                        >
                          {copiedId === invite.id ? "Copied" : "Copy link"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(invite)}
                          className="underline underline-offset-4"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(invite)}
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
          </>
        )}
      </div>
    </section>
  );
}
