const links = [
  { href: "#home", label: "Home" },
  { href: "#story", label: "Story" },
  { href: "#schedule", label: "Schedule" },
  { href: "#venue", label: "Venue" },
  { href: "#rsvp", label: "RSVP" },
  { href: "#registry", label: "Registry" },
] as const;

export function InvitationNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-background/95 backdrop-blur dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <a href="#home" className="font-semibold tracking-tight">
          Nuptial Suite
        </a>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
