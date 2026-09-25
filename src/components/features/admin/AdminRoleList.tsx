import Link from "next/link";
import type { AdminRoleRow } from "./admin-role-types";

/** Read-only list. Grant and remove Admin on the player record. */
export function AdminRoleList({ members }: { members: AdminRoleRow[] }) {
  const admins = members.filter((member) => member.isAdmin || member.role === "admin");
  if (admins.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">No administrators yet.</p>
    );
  }
  return (
    <ul className="space-y-1">
      {admins.map((member) => (
        <li key={member.id}>
          <Link
            href={`/admin/users?member=${member.id}`}
            prefetch={false}
            className="flex min-h-11 items-center text-sm text-gold-400"
            data-testid={`admin-link-${member.id}`}
          >
            {member.nickname}
            {member.isYou ? " (you)" : ""}
          </Link>
        </li>
      ))}
    </ul>
  );
}
