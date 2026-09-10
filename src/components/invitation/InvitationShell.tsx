"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "motion/react";
import { PasswordGate } from "@/components/invitation/PasswordGate";

const InvitationPage = dynamic(async () => {
  const mod = await import("@/components/invitation/InvitationPage");
  return { default: mod.InvitationPage };
});

type InvitationShellProps = {
  initiallyUnlocked: boolean;
};

export function InvitationShell({ initiallyUnlocked }: InvitationShellProps) {
  const [unlocked, setUnlocked] = useState(initiallyUnlocked);
  const [invitationReady, setInvitationReady] = useState(initiallyUnlocked);

  useEffect(() => {
    const root = document.documentElement;
    if (unlocked) {
      root.classList.remove("password-locked");
      return;
    }

    root.classList.add("password-locked");
    return () => root.classList.remove("password-locked");
  }, [unlocked]);

  return (
    <>
      {invitationReady ? (
        <div
          {...(!unlocked
            ? { inert: true as const, "aria-hidden": true as const }
            : {})}
        >
          <InvitationPage />
        </div>
      ) : null}
      <AnimatePresence>
        {unlocked ? null : (
          <PasswordGate
            key="password-gate"
            onRevealStart={() => setInvitationReady(true)}
            onUnlocked={() => setUnlocked(true)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
