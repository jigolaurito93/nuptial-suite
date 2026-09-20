"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useState,
  type ReactNode,
  type SVGProps,
} from "react";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/admin/SignOutButton";
import {
  adminNavGroups,
  adminPageTitle,
  isAdminNavActive,
} from "@/components/admin/navConfig";
import { invitation } from "@/content/invitation";

function Icon({
  children,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4 shrink-0"
      {...props}
    >
      {children}
    </svg>
  );
}

function NavIcon({ href }: { href: string }) {
  if (href === "/admin") {
    return (
      <Icon>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
      </Icon>
    );
  }
  if (href === "/admin/households") {
    return (
      <Icon>
        <path d="M4.5 11.5 12 5l7.5 6.5" />
        <path d="M6.5 10.5V19h11v-8.5" />
      </Icon>
    );
  }
  if (href === "/admin/guests") {
    return (
      <Icon>
        <circle cx="9" cy="8" r="2.4" />
        <path d="M4.5 18c.4-2.6 2.3-4 4.5-4s4.1 1.4 4.5 4" />
        <circle cx="16.2" cy="8.4" r="2" />
        <path d="M15 14.2c1.8.2 3.4 1.4 3.8 3.8" />
      </Icon>
    );
  }
  if (href === "/admin/messages") {
    return (
      <Icon>
        <path d="M5 6.5h14v10H8.5L5 19.5z" />
      </Icon>
    );
  }
  if (href === "/admin/vendors") {
    return (
      <Icon>
        <path d="M8 7V5.8A2.8 2.8 0 0 1 10.8 3h2.4A2.8 2.8 0 0 1 16 5.8V7" />
        <rect x="4.5" y="7" width="15" height="13" rx="1.5" />
      </Icon>
    );
  }
  if (href === "/admin/budget") {
    return (
      <Icon>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M9.5 10.2c.6-.8 1.5-1.2 2.5-1.2 1.6 0 2.6.8 2.6 2 0 2.6-5.1 1.4-5.1 3.6 0 1.1 1 2 2.5 2 1.1 0 2-.5 2.5-1.2" />
      </Icon>
    );
  }
  if (href === "/admin/tasks") {
    return (
      <Icon>
        <path d="M9 6.5h10M9 12h10M9 17.5h10" />
        <path d="M5 6.5l.8.8L7.6 5.5" />
        <path d="M5 12l.8.8L7.6 11" />
        <path d="M5 17.5l.8.8L7.6 16.5" />
      </Icon>
    );
  }
  return (
    <Icon>
      <rect x="5" y="4.5" width="14" height="15" rx="1.4" />
      <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" />
    </Icon>
  );
}

function MenuIcon() {
  return (
    <Icon className="size-5">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

function CloseIcon() {
  return (
    <Icon className="size-5">
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/admin" onClick={onNavigate} className="block px-1">
      <p className="text-[0.65rem] tracking-[0.28em] text-accent uppercase">
        Wedding planner
      </p>
      <p className="font-display mt-1 text-2xl font-medium tracking-tight text-foreground">
        {invitation.couple.displayNames}
      </p>
    </Link>
  );
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-6">
      {adminNavGroups.map((group) => (
        <div key={group.label} className="mt-4 first:mt-1">
          <p className="px-3 pb-2 text-[0.6rem] tracking-[0.22em] text-muted uppercase">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isAdminNavActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "flex items-center gap-3 rounded-lg bg-navy px-3 py-2.5 text-sm text-background"
                      : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-background hover:text-foreground"
                  }
                >
                  <NavIcon href={item.href} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const menuId = useId();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPath(null);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpenPath(null);
  const title = adminPageTitle(pathname);

  return (
    <div className="flex min-h-full min-w-0 flex-1">
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-navy/35 lg:hidden"
          onClick={close}
        />
      ) : null}

      <aside
        id={menuId}
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 lg:sticky lg:inset-auto lg:top-0 lg:h-svh lg:translate-x-0 lg:self-start ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-6 pb-4">
          <SidebarBrand onNavigate={close} />
          <button
            type="button"
            className="mt-1 text-muted transition hover:text-foreground lg:hidden"
            aria-label="Close menu"
            onClick={close}
          >
            <CloseIcon />
          </button>
        </div>
        <SidebarNav pathname={pathname} onNavigate={close} />
        <div className="mt-auto border-t border-border px-5 py-4">
          <Link
            href="/"
            className="text-[0.7rem] tracking-[0.18em] text-muted uppercase transition hover:text-foreground"
          >
            View invitation
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:px-12">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="text-muted transition hover:text-foreground lg:hidden"
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpenPath(pathname)}
              >
                <MenuIcon />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[0.65rem] tracking-[0.22em] text-muted uppercase">
                  Planner
                </p>
                <p className="font-display truncate text-xl font-medium tracking-tight text-foreground">
                  {title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 text-[0.7rem] tracking-[0.18em] text-muted uppercase">
              <Link
                href="/"
                className="hidden transition hover:text-foreground sm:inline"
              >
                Invitation
              </Link>
              <SignOutButton />
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
