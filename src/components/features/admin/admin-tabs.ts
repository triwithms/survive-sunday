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
    blurb: "Find a friend, set a password, copy Join.",
    match: (path) =>
      path === "/admin/users" || path.startsWith("/admin/roster"),
  },
  {
    href: "/admin/config",
    label: "Pool",
    name: "Pool",
    blurb: "Mulligan, Make administrator, Hand the pool.",
    match: (path) => path.startsWith("/admin/config"),
  },
  {
    href: "/admin/comms",
    label: "Comms",
    name: "Comms",
    blurb: "Join links, Home Screen ask, pool notes.",
    match: (path) => path.startsWith("/admin/comms"),
  },
  {
    href: "/admin/system",
    label: "System",
    name: "System",
    blurb: "This week’s picks. Danger stays closed.",
    match: (path) =>
      path.startsWith("/admin/system") || path.startsWith("/admin/import"),
  },
];
