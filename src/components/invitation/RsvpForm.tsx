"use client";

import { useState, type FormEvent } from "react";
import { plusOneAllowanceCopy } from "@/lib/invite";
import type { PublicInvite, RsvpPayload, RsvpStatus } from "@/types";

type FormState = "idle" | "submitting" | "success" | "error";

type RsvpFormProps = {
  invite?: PublicInvite | null;
  inviteCode?: string | null;
  onSuccess?: () => void;
};

function emptyPlusOneNames(invite: PublicInvite | null | undefined) {
  const allowed = invite?.plusOnesAllowed ?? 0;
  const existing = invite?.plusOneNames ?? [];
  return Array.from({ length: allowed }, (_, index) => existing[index] ?? "");
}

function statusFromInvite(
  invite: PublicInvite | null | undefined,
): RsvpStatus | "" {
  return invite?.rsvpStatus === "pending" ? "" : (invite?.rsvpStatus ?? "");
}

export function RsvpForm({ invite, inviteCode, onSuccess }: RsvpFormProps) {
  const [status, setStatus] = useState<RsvpStatus | "">(() =>
    statusFromInvite(invite),
  );
  const [fullName, setFullName] = useState(invite?.displayName ?? "");
  const [contactNumber, setContactNumber] = useState(
    invite?.contactNumber ?? "",
  );
  const [message, setMessage] = useState("");
  const [plusOneNames, setPlusOneNames] = useState(() =>
    emptyPlusOneNames(invite),
  );
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function resetForm() {
    setStatus(statusFromInvite(invite));
    setFullName(invite?.displayName ?? "");
    setContactNumber(invite?.contactNumber ?? "");
    setPlusOneNames(emptyPlusOneNames(invite));
    setMessage("");
    setErrorMessage("");
    setFormState("idle");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!status) {
      setFormState("error");
      setErrorMessage("Please choose attending or declining.");
      return;
    }

    setFormState("submitting");
    setErrorMessage("");

    const payload: RsvpPayload = {
      contactNumber: contactNumber.trim(),
      status,
      message: message.trim() || undefined,
    };

    if (inviteCode) {
      payload.inviteCode = inviteCode;
      payload.plusOneNames =
        status === "attending"
          ? plusOneNames.map((name) => name.trim()).filter(Boolean)
          : [];
    } else {
      payload.fullName = fullName.trim();
    }

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
      if (!inviteCode) {
        setFullName("");
        setContactNumber("");
        setMessage("");
        setStatus("");
        setPlusOneNames([]);
      } else {
        setMessage("");
      }
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
          Your RSVP has been received. We look forward to celebrating with you.
        </p>
        <button
          type="button"
          className="mt-8 text-sm underline underline-offset-4"
          onClick={resetForm}
        >
          Submit another response
        </button>
      </div>
    );
  }

  const showPlusOnes =
    Boolean(invite) &&
    (invite?.plusOnesAllowed ?? 0) > 0 &&
    status === "attending";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-8">
      {invite ? (
        <p className="text-center text-sm leading-relaxed text-muted">
          {plusOneAllowanceCopy(invite.plusOnesAllowed, invite.displayName)}
        </p>
      ) : null}

      <fieldset>
        <legend className="text-xs tracking-[0.22em] text-accent uppercase">
          Will you attend?
        </legend>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(
            [
              { value: "attending", label: "Attending" },
              { value: "declining", label: "Declining" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={`border px-4 py-3 text-sm tracking-wide transition ${
                status === option.value
                  ? "border-accent bg-accent-soft text-foreground"
                  : "border-border bg-surface text-muted hover:border-accent"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {invite ? (
        <p className="text-sm text-muted">
          Invitation for{" "}
          <span className="text-foreground">{invite.displayName}</span>
        </p>
      ) : (
        <label className="block">
          <span className="text-xs tracking-[0.18em] text-muted uppercase">
            Full name
          </span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 w-full border border-border bg-surface px-4 py-3 text-foreground outline-none focus:border-accent"
            autoComplete="name"
          />
        </label>
      )}

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
            {invite?.plusOnesAllowed === 1
              ? "Plus-one name (optional)"
              : `Guest names (up to ${invite?.plusOnesAllowed})`}
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
