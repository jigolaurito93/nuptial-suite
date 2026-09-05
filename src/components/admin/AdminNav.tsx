import Link from "next/link";

const links = [
  { href: "#overview", label: "Overview" },
  { href: "#guests", label: "Guests" },
  { href: "#budget", label: "Budget" },
  { href: "#vendors", label: "Vendors" },
  { href: "#tasks", label: "Tasks" },
  { href: "#invitation", label: "Invitation" },
] as const;

export function AdminNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-background/95 backdrop-blur dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <a href="#overview" className="font-semibold tracking-tight">
          Wedding admin
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
          <Link
            href="/"
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Public site
          </Link>
        </nav>
      </div>
    </header>
  );
}
