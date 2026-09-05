import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/story", label: "Story" },
  { href: "/schedule", label: "Schedule" },
  { href: "/venue", label: "Venue" },
  { href: "/rsvp", label: "RSVP" },
  { href: "/registry", label: "Registry" },
] as const;

export function InvitationNav() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          Nuptial Suite
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/planner"
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Planner
          </Link>
        </nav>
      </div>
    </header>
  );
}
