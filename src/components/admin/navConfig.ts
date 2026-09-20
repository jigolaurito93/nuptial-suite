export type AdminNavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", exact: true }],
  },
  {
    label: "Guests",
    items: [
      { href: "/admin/households", label: "Households" },
      { href: "/admin/guests", label: "Guests" },
      { href: "/admin/messages", label: "Messages" },
    ],
  },
  {
    label: "Planning",
    items: [
      { href: "/admin/vendors", label: "Vendors" },
      { href: "/admin/budget", label: "Budget" },
      { href: "/admin/tasks", label: "Tasks" },
    ],
  },
  {
    label: "Site",
    items: [{ href: "/admin/invitation", label: "Invitation" }],
  },
];

export function isAdminNavActive(pathname: string, item: AdminNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function adminPageTitle(pathname: string) {
  for (const group of adminNavGroups) {
    for (const item of group.items) {
      if (isAdminNavActive(pathname, item)) return item.label;
    }
  }
  return "Planner";
}
