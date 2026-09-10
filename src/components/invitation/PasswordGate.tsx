"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { invitation } from "@/content/invitation";

type PasswordGateProps = {
  onRevealStart: () => void;
  onUnlocked: () => void;
};

type GateState = "idle" | "submitting" | "error" | "revealing";

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export function PasswordGate({ onRevealStart, onUnlocked }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<GateState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const reduceMotion = useReducedMotion();
  const formShakeRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const revealing = state === "revealing";

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting" || revealing) return;

    setState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(data?.message ?? invitation.passwordGate.error);
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState("revealing");
      onRevealStart();

      if (reduceMotion) {
        onUnlocked();
        return;
      }

      await wait(980, controller.signal);
      onUnlocked();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setState("error");
      setErrorMessage(
        error instanceof Error ? error.message : invitation.passwordGate.error,
      );
      const shakeNode = formShakeRef.current;
      if (shakeNode && !reduceMotion) {
        shakeNode.classList.remove("password-form--shake");
        void shakeNode.offsetWidth;
        shakeNode.classList.add("password-form--shake");
      }
    }
  }

  return (
    <motion.div
      className="password-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-gate-title"
      initial={{ opacity: 1, y: 0 }}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { y: "-108%", opacity: 0.35, filter: "blur(8px)" }
      }
      transition={
        reduceMotion
          ? { duration: 0.28 }
          : { duration: 1.05, ease: [0.22, 1, 0.32, 1] }
      }
    >
      <div className="liquid-atmosphere" aria-hidden>
        <span className="silk-wash silk-aurora" />
        <span className="silk-wash silk-aurora-b" />
        <span className="silk-wash silk-a" />
        <span className="silk-wash silk-b" />
        <span className="silk-wash silk-c" />
        <div className="liquid-glass" />
      </div>

      <motion.div
        className="password-bloom"
        aria-hidden
        initial={{ opacity: 0, scale: 0.2 }}
        animate={
          revealing
            ? { opacity: [0, 0.95, 0.55], scale: [0.2, 1.15, 1.85] }
            : { opacity: 0, scale: 0.2 }
        }
        transition={{ duration: 1.1, ease: "easeOut" }}
      />

      <div className="password-gate-inner">
        <AnimatePresence mode="wait">
          {revealing ? (
            <motion.div
              key="reveal"
              className="password-reveal"
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.32, 1] }}
            >
              <motion.div
                className="password-seal"
                initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
                animate={{
                  scale: [0.7, 1.08, 1],
                  rotate: [-8, 6, 0],
                  opacity: 1,
                }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.32, 1] }}
              >
                <Image
                  src="/kb-seal.svg"
                  alt=""
                  fill
                  priority
                  unoptimized
                  sizes="7.5rem"
                  className="password-seal-img"
                />
              </motion.div>
              <p className="text-xs tracking-[0.28em] text-muted uppercase">
                {invitation.passwordGate.revealingEyebrow}
              </p>
              <p className="font-script mt-3 text-6xl leading-[1.15] text-foreground sm:text-7xl">
                {invitation.couple.partnerOne}{" "}
                <span className="letter-names-amp">&amp;</span>{" "}
                {invitation.couple.partnerTwo}
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={onSubmit}
              className="password-form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.32, 1] }}
            >
              <div ref={formShakeRef} className="w-full">
                <p className="text-xs tracking-[0.28em] text-muted uppercase">
                  {invitation.passwordGate.eyebrow}
                </p>
                <h1
                  id="password-gate-title"
                  className="font-script mt-3 text-6xl leading-[1.15] text-foreground sm:text-7xl md:text-8xl"
                >
                  {invitation.couple.partnerOne}{" "}
                  <span className="letter-names-amp">&amp;</span>{" "}
                  {invitation.couple.partnerTwo}
                </h1>
                <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-muted sm:text-base">
                  {invitation.passwordGate.prompt}
                </p>

                <label className="mt-10 block text-left">
                  <span className="text-xs tracking-[0.18em] text-muted uppercase">
                    {invitation.passwordGate.placeholder}
                  </span>
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    autoFocus
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full border border-border bg-surface px-4 py-3 text-foreground outline-none focus:border-accent"
                  />
                </label>

                {state === "error" ? (
                  <p className="mt-3 text-sm text-red-700" role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={state === "submitting"}
                  className="mt-8 w-full border border-foreground bg-foreground px-6 py-3 text-sm tracking-[0.18em] text-background uppercase transition hover:bg-transparent hover:text-foreground disabled:opacity-60"
                >
                  {state === "submitting"
                    ? invitation.passwordGate.submitting
                    : invitation.passwordGate.submit}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
