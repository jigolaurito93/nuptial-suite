import Link from "next/link";

const links = [
  { href: "/planner", label: "Dashboard" },
  { href: "/planner/guests", label: "Guests" },
  { href: "/planner/budget", label: "Budget" },
  { href: "/planner/vendors", label: "Vendors" },
  { href: "/planner/tasks", label: "Tasks" },
  { href: "/planner/invitation", label: "Invitation" },
] as const;

export function PlannerNav() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/planner" className="font-semibold tracking-tight">
          Couple Planner
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
