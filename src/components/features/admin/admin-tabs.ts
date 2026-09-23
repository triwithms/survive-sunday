export type AdminTab = {
  href: string;
  label: string;
  name: string;
  blurb: string;
  match: (path: string) => boolean;
};

export const ADMIN_TABS: AdminTab[] = [
  {
    href: "/admin/users",
    label: "Users",
    name: "Users",
    blurb: "Add a friend, edit roster, password, Join.",
    match: (path) =>
      path === "/admin/users" ||
      path.startsWith("/admin/roster") ||
      path.startsWith("/admin/comms"),
  },
  {
    href: "/admin/config",
    label: "Pool",
    name: "Pool",
    blurb: "Mulligan, Make administrator, Hand the pool. Reset is last.",
    match: (path) => path.startsWith("/admin/config"),
  },
  {
    href: "/admin/system",
    label: "System",
    name: "System",
    blurb: "Week wrap, missing picks, enter a friend’s pick.",
    match: (path) =>
      path.startsWith("/admin/system") || path.startsWith("/admin/import"),
  },
];
