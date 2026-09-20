"use client";

import { useState, type FormEvent } from "react";
import { invitation } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";

type FormState = "idle" | "submitting" | "success" | "error";

export function WellWishesSection() {
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function resetForm() {
    setFullName("");
    setMessage("");
    setContactNumber("");
    setErrorMessage("");
    setFormState("idle");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          message: message.trim(),
          contactNumber: contactNumber.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(data?.message ?? "Unable to send your note.");
      }

      setFormState("success");
    } catch (error) {
      setFormState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send your note.",
      );
    }
  }

  return (
    <section
      id="wishes"
      className="invitation-section border-t border-border px-6 py-24"
    >
      <SectionHeading
        eyebrow="With love"
        title="A note for the couple"
        description={`RSVP is for guests with a personal invitation link. You can still leave a message for ${invitation.couple.displayNames}.`}
      />
      <div className="mt-14">
        {formState === "success" ? (
          <div className="mx-auto max-w-lg border border-border bg-surface px-8 py-12 text-center">
            <p className="font-display text-3xl">Thank you</p>
            <p className="mt-3 text-muted">
              Your note has been received. We are so grateful.
            </p>
            <button
              type="button"
              className="mt-8 text-sm underline underline-offset-4"
              onClick={resetForm}
            >
              Send another note
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-8">
            <label className="block">
              <span className="text-xs tracking-[0.18em] text-muted uppercase">
                Your name
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
                Message
              </span>
              <textarea
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                className="mt-2 w-full resize-y border border-border bg-surface px-4 py-3 text-foreground outline-none focus:border-accent"
              />
            </label>

            <label className="block">
              <span className="text-xs tracking-[0.18em] text-muted uppercase">
                Phone number (optional)
              </span>
              <input
                value={contactNumber}
                onChange={(event) => setContactNumber(event.target.value)}
                className="mt-2 w-full border border-border bg-surface px-4 py-3 text-foreground outline-none focus:border-accent"
                autoComplete="tel"
                inputMode="tel"
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
              {formState === "submitting" ? "Sending…" : "Send note"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
