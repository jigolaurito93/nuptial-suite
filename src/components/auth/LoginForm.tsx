"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  adminInputClassName,
  adminLabelClassName,
  adminPrimaryButtonClassName,
} from "@/components/admin/formStyles";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(
          "That email or password did not match. Please try again.",
        );
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 max-w-md space-y-6">
      <label className="block">
        <span className={adminLabelClassName}>
          Email
        </span>
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={adminInputClassName}
        />
      </label>

      <label className="block">
        <span className={adminLabelClassName}>
          Password
        </span>
        <input
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={adminInputClassName}
        />
      </label>

      {errorMessage ? (
        <p className="text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className={`w-full ${adminPrimaryButtonClassName}`}
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
