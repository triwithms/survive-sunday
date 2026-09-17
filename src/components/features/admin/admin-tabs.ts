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
    blurb: "Roster, claim status, temporary passwords, and administrators.",
    match: (path) =>
      path === "/admin/users" || path.startsWith("/admin/roster"),
  },
  {
    href: "/admin/config",
    label: "Pool",
    name: "Pool Config",
    blurb: "Real or demo mode, mulligan, week controls, and who runs the pool.",
    match: (path) =>
      path.startsWith("/admin/config") || path.startsWith("/admin/import"),
  },
  {
    href: "/admin/comms",
    label: "Comms",
    name: "Communications",
    blurb: "Personal Join links, pool notes, and missing-pick nudges.",
    match: (path) => path.startsWith("/admin/comms"),
  },
  {
    href: "/admin/system",
    label: "System",
    name: "System",
    blurb: "Sign-in email status and the audit log.",
    match: (path) => path.startsWith("/admin/system"),
  },
];
