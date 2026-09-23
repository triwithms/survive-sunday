"use client";

import { useId } from "react";
import { Button } from "@/components/ui";
import { AdminDetails } from "./AdminDetails";
import { AdminRoleConfirm } from "./AdminRoleConfirm";
import { useAdminRole } from "./use-admin-role";
import type { RosterMember } from "./roster-types";

export function RosterRoleSection({ member }: { member: RosterMember }) {
  const titleId = useId();
  const role = useAdminRole();
  if (member.role === "admin") return null;
  const isAdmin = member.isPoolAdmin === true;
  return (
    <AdminDetails
      title="Role"
      summary={isAdmin ? "Administrator" : "Player"}
      testId="roster-role"
    >
      {role.msg ? (
        <p className="text-sm text-field-400" role="status">{role.msg}</p>
      ) : null}
      {role.err ? (
        <p className="text-sm text-crimson-400" role="alert">{role.err}</p>
      ) : null}
      {isAdmin && !member.canChangeAdmin ? (
        <p className="text-sm text-[var(--text-muted)]">
          The pool keeps at least one administrator.
        </p>
      ) : (
        <Button
          variant={isAdmin ? "secondary" : "primary"}
          className="min-h-11 w-full"
          disabled={role.busy}
          data-testid={isAdmin ? "roster-remove-admin" : "roster-make-admin"}
          onClick={() =>
            role.ask({
              id: member.id,
              nickname: member.nickname,
              action: isAdmin ? "demote" : "promote",
            })
          }
        >
          {isAdmin ? "Remove admin" : "Make administrator"}
        </Button>
      )}
      {role.confirm ? (
        <AdminRoleConfirm
          confirm={role.confirm}
          titleId={titleId}
          busy={role.busy}
          onCancel={() => role.ask(null)}
          onRun={() => void role.run()}
        />
      ) : null}
    </AdminDetails>
  );
}
