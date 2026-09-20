"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/admin/SignOutButton";

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

export function AdminNav() {
  const pathname = usePathname();
  const onAdminHome = pathname === "/admin";

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-background/95 backdrop-blur dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/admin#overview" className="font-semibold tracking-tight">
          Wedding admin
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((link) => {
            const href =
              link.hash && onAdminHome ? `#${link.hash}` : link.href;
            const active = link.href === "/admin/vendors" && pathname === "/admin/vendors";
            return (
              <Link
                key={link.href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "text-zinc-950 dark:text-zinc-50"
                    : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                }
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Public site
          </Link>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
