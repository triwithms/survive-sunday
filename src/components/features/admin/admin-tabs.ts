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
    blurb: "Roster, a password you can text, administrators, and remove player.",
    match: (path) =>
      path === "/admin/users" || path.startsWith("/admin/roster"),
  },
  {
    href: "/admin/config",
    label: "Pool",
    name: "Pool Config",
    blurb: "Real or demo mode, mulligan, and who runs the pool.",
    match: (path) => path.startsWith("/admin/config"),
  },
  {
    href: "/admin/comms",
    label: "Comms",
    name: "Communications",
    blurb: "Join links, pool notes, and sign-in email status.",
    match: (path) => path.startsWith("/admin/comms"),
  },
  {
    href: "/admin/system",
    label: "System",
    name: "System",
    blurb: "Pick census, login, reset, lock, import, audit. No database push.",
    match: (path) =>
      path.startsWith("/admin/system") || path.startsWith("/admin/import"),
  },
];
