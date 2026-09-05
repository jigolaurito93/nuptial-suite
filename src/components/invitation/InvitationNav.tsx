"use client";

import { invitation } from "@/content/invitation";

const links = [
  { href: "#save-the-date", label: "Home" },
  { href: "#countdown", label: "Countdown" },
  { href: "#venue", label: "Venue" },
  { href: "#program", label: "Program" },
  { href: "#entourage", label: "Entourage" },
  { href: "#dress-code", label: "Dress" },
  { href: "#gallery", label: "Gallery" },
  { href: "#gift-guide", label: "Gifts" },
  { href: "#rsvp", label: "RSVP" },
  { href: "#faqs", label: "FAQs" },
] as const;

type InvitationNavProps = {
  visible: boolean;
};

export function InvitationNav({ visible }: InvitationNavProps) {
  if (!visible) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <a
          href="#save-the-date"
          className="font-display text-lg tracking-tight text-foreground"
        >
          {invitation.couple.displayNames}
        </a>
        <nav className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 text-xs tracking-wide text-muted uppercase">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
