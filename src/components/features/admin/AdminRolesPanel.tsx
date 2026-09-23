import { Card } from "@/components/ui";
import { AdminRoleList } from "./AdminRoleList";
import type { AdminRoleRow } from "./admin-role-types";

export type { AdminRoleRow } from "./admin-role-types";

export function AdminRolesPanel({ members }: { members: AdminRoleRow[] }) {
  return (
    <Card as="section" className="p-4 space-y-3" data-testid="admin-list">
      <div>
        <h2 className="font-semibold">Administrators</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Read-only. Open a player to make or remove an administrator. They
          stay on the board.
        </p>
      </div>
      <AdminRoleList members={members} />
    </Card>
  );
}
