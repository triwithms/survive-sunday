export type AdminTab = {
  href: string;
  label: string;
  name: string;
  blurb: string;
  match: (path: string) => boolean;
};

/** Paths stay /admin/users and /admin/system so older links keep working. */
export const ADMIN_TABS: AdminTab[] = [
  {
    href: "/admin/users",
    label: "Players",
    name: "Players",
    blurb: "Add a friend, edit a player, password, join link.",
    match: (path) =>
      path === "/admin/users" ||
      path.startsWith("/admin/roster") ||
      path.startsWith("/admin/comms"),
  },
  {
    href: "/admin/system",
    label: "This Week",
    name: "This Week",
    blurb: "Week wrap, missing picks, enter a friend’s pick.",
    match: (path) =>
      path.startsWith("/admin/system") || path.startsWith("/admin/import"),
  },
  {
    href: "/admin/config",
    label: "Pool",
    name: "Pool",
    blurb: "Mulligan, Hand the pool, administrators. Reset is last.",
    match: (path) => path.startsWith("/admin/config"),
  },
];
