"use client";

import { useMemo, useState, type FormEvent } from "react";
import { plusOneAllowanceCopy } from "@/lib/invite";
import { formatGuestDisplayName } from "@/lib/guest-name";
import type { PublicInvite, RsvpPayload, RsvpStatus } from "@/types";

type FormState = "idle" | "submitting" | "success" | "error";

type RsvpFormProps = {
  invite: PublicInvite;
  inviteCode: string;
  onSuccess?: () => void;
};

function namedGuests(invite: PublicInvite) {
  return invite.guests.filter((guest) => !guest.isPlusOne);
}

function plusOneGuests(invite: PublicInvite) {
  return invite.guests.filter((guest) => guest.isPlusOne);
}

function statusesFromInvite(invite: PublicInvite) {
  return Object.fromEntries(
    namedGuests(invite).map((guest) => [
      guest.id,
      guest.rsvpStatus === "pending" ? "" : guest.rsvpStatus,
    ]),
  ) as Record<string, RsvpStatus | "">;
}

function plusOneNamesFromInvite(invite: PublicInvite) {
  const existing = plusOneGuests(invite).map((guest) => guest.fullName);
  return Array.from(
    { length: invite.plusOnesAllowed },
    (_, index) => existing[index] ?? "",
  );
}

function statusLabel(status: RsvpStatus | "pending" | "") {
  if (status === "attending") return "Attending";
  if (status === "declining") return "Declining";
  return "Pending";
}

export function RsvpForm({ invite, inviteCode, onSuccess }: RsvpFormProps) {
  const named = useMemo(() => namedGuests(invite), [invite]);
  const [guestStatuses, setGuestStatuses] = useState(() =>
    statusesFromInvite(invite),
  );
  const [contactNumber, setContactNumber] = useState(
    invite.contactNumber ?? "",
  );
  const [message, setMessage] = useState(invite.message ?? "");
  const [plusOneNames, setPlusOneNames] = useState(() =>
    plusOneNamesFromInvite(invite),
  );
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const anyAttending = named.some(
    (guest) => guestStatuses[guest.id] === "attending",
  );
  const showPlusOnes = invite.plusOnesAllowed > 0 && anyAttending;

  function resetForm() {
    setGuestStatuses(statusesFromInvite(invite));
    setContactNumber(invite.contactNumber ?? "");
    setPlusOneNames(plusOneNamesFromInvite(invite));
    setMessage(invite.message ?? "");
    setErrorMessage("");
    setFormState("idle");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const missing = named.some((guest) => !guestStatuses[guest.id]);
    if (missing) {
      setFormState("error");
      setErrorMessage(
        "Please choose attending or declining for each person on this invitation.",
      );
      return;
    }

    const usedPlusOnes = showPlusOnes
      ? plusOneNames.map((name) => name.trim()).filter(Boolean)
      : [];

    setFormState("submitting");
    setErrorMessage("");

    const payload: RsvpPayload = {
      inviteCode,
      contactNumber: contactNumber.trim(),
      message: message.trim() || undefined,
      guestReplies: named.map((guest) => ({
        id: guest.id,
        status: guestStatuses[guest.id] as RsvpStatus,
      })),
      plusOneNames: usedPlusOnes,
    };

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(data?.message ?? "Unable to submit RSVP.");
      }

      setFormState("success");
      onSuccess?.();
    } catch (error) {
      setFormState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit RSVP.",
      );
    }
  }

  if (formState === "success") {
    return (
      <div className="mx-auto max-w-lg border border-border bg-surface px-8 py-12 text-center">
        <p className="font-display text-3xl">Thank you</p>
        <p className="mt-3 text-muted">
          Your RSVP has been received. You can use this same link to update it
          until the deadline.
        </p>
        <button
          type="button"
          className="mt-8 text-sm underline underline-offset-4"
          onClick={resetForm}
        >
          Update your response
        </button>
      </div>
    );
  }

  if (!invite.rsvpOpen) {
    return (
      <div className="mx-auto max-w-lg space-y-6 border border-border bg-surface px-8 py-10">
        <p className="text-center text-sm leading-relaxed text-muted">
          RSVP is closed. Here is what we have on file for {invite.label}.
        </p>
        <ul className="space-y-3 text-sm">
          {invite.guests.map((guest) => (
            <li
              key={guest.id}
              className="flex items-center justify-between gap-4 border-b border-border pb-3"
            >
              <span>
                {formatGuestDisplayName(guest.fullName, guest.namePrefix)}
                {guest.isPlusOne ? (
                  <span className="text-muted"> (plus-one)</span>
                ) : null}
              </span>
              <span className="text-muted">{statusLabel(guest.rsvpStatus)}</span>
            </li>
          ))}
        </ul>
        {invite.contactNumber ? (
          <p className="text-sm text-muted">Contact: {invite.contactNumber}</p>
        ) : null}
        {invite.message ? (
          <p className="text-sm text-muted">{invite.message}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-8">
      <p className="text-center text-sm leading-relaxed text-muted">
        {plusOneAllowanceCopy(invite.plusOnesAllowed, invite.label)}
      </p>
      <p className="text-center text-sm text-muted">
        Invitation for{" "}
        <span className="text-foreground">{invite.label}</span>
      </p>

      <fieldset className="space-y-6">
        <legend className="text-xs tracking-[0.22em] text-accent uppercase">
          Who will attend?
        </legend>
        {named.map((guest) => (
          <div key={guest.id}>
            <p className="text-sm text-foreground">
              {formatGuestDisplayName(guest.fullName, guest.namePrefix)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(
                [
                  { value: "attending", label: "Attending" },
                  { value: "declining", label: "Declining" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setGuestStatuses((current) => ({
                      ...current,
                      [guest.id]: option.value,
                    }))
                  }
                  className={`border px-4 py-3 text-sm tracking-wide transition ${
                    guestStatuses[guest.id] === option.value
                      ? "border-accent bg-accent-soft text-foreground"
                      : "border-border bg-surface text-muted hover:border-accent"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      <label className="block">
        <span className="text-xs tracking-[0.18em] text-muted uppercase">
          Contact number
        </span>
        <input
          required
          value={contactNumber}
          onChange={(event) => setContactNumber(event.target.value)}
          className="mt-2 w-full border border-border bg-surface px-4 py-3 text-foreground outline-none focus:border-accent"
          autoComplete="tel"
          inputMode="tel"
        />
      </label>

      {showPlusOnes ? (
        <fieldset className="space-y-4">
          <legend className="text-xs tracking-[0.18em] text-muted uppercase">
            {invite.plusOnesAllowed === 1
              ? "Plus-one name (leave blank if not bringing anyone)"
              : `Guest names (up to ${invite.plusOnesAllowed}; leave blank if unused)`}
          </legend>
          {plusOneNames.map((name, index) => (
            <label key={index} className="block">
              <span className="sr-only">Guest {index + 1} name</span>
              <input
                value={name}
                onChange={(event) => {
                  const next = [...plusOneNames];
                  next[index] = event.target.value;
                  setPlusOneNames(next);
                }}
                placeholder={`Guest ${index + 1}`}
                className="mt-2 w-full border border-border bg-surface px-4 py-3 text-foreground outline-none focus:border-accent"
                autoComplete="off"
              />
            </label>
          ))}
        </fieldset>
      ) : null}

      <label className="block">
        <span className="text-xs tracking-[0.18em] text-muted uppercase">
          Message to the couple
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          className="mt-2 w-full resize-y border border-border bg-surface px-4 py-3 text-foreground outline-none focus:border-accent"
        />
      </label>

      {formState === "error" ? (
        <p className="text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={formState === "submitting"}
        className="w-full border border-foreground bg-foreground px-6 py-3 text-sm tracking-[0.18em] text-background uppercase transition hover:bg-transparent hover:text-foreground disabled:opacity-60"
      >
        {formState === "submitting" ? "Sending…" : "Send RSVP"}
      </button>
    </form>
  );
}
