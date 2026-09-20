"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { invitation } from "@/content/invitation";

const links = [
  { href: "/admin#overview", hash: "overview", label: "Overview" },
  { href: "/admin#households", hash: "households", label: "Households" },
  { href: "/admin#guests", hash: "guests", label: "Guests" },
  { href: "/admin#messages", hash: "messages", label: "Messages" },
  { href: "/admin#budget", hash: "budget", label: "Budget" },
  { href: "/admin/vendors", hash: null, label: "Vendors" },
  { href: "/admin#tasks", hash: "tasks", label: "Tasks" },
  { href: "/admin#invitation", hash: "invitation", label: "Invitation" },
] as const;

function subscribeHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function getHash() {
  return window.location.hash || "#overview";
}

function getServerHash() {
  return "#overview";
}

export function AdminNav() {
  const pathname = usePathname();
  const onAdminHome = pathname === "/admin";
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 py-4">
          <Link href="/admin#overview" className="block">
            <p className="text-[0.65rem] tracking-[0.28em] text-accent uppercase">
              Wedding planner
            </p>
            <p className="font-display mt-1 text-2xl font-medium tracking-tight text-foreground">
              {invitation.couple.displayNames}
            </p>
          </Link>
          <div className="mb-1 flex items-center gap-5 text-[0.7rem] tracking-[0.18em] text-muted uppercase">
            <Link href="/" className="transition hover:text-foreground">
              Invitation
            </Link>
            <SignOutButton />
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border py-3">
          {links.map((link) => {
            const href =
              link.hash && onAdminHome ? `#${link.hash}` : link.href;
            const active = link.hash
              ? onAdminHome && hash === `#${link.hash}`
              : pathname === "/admin/vendors";
            return (
              <Link
                key={link.href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "border-b border-accent pb-0.5 text-[0.7rem] tracking-[0.16em] text-foreground uppercase"
                    : "text-[0.7rem] tracking-[0.16em] text-muted uppercase transition hover:text-foreground"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
