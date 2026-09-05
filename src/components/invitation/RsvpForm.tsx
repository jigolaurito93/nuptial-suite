"use client";

import { useState, type FormEvent } from "react";
import type { RsvpPayload, RsvpStatus } from "@/types";

type FormState = "idle" | "submitting" | "success" | "error";

export function RsvpForm() {
  const [status, setStatus] = useState<RsvpStatus | "">("");
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

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
      fullName: fullName.trim(),
      contactNumber: contactNumber.trim(),
      status,
      message: message.trim() || undefined,
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
      setFullName("");
      setContactNumber("");
      setMessage("");
      setStatus("");
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
          onClick={() => setFormState("idle")}
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-8">
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
