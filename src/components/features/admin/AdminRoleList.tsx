"use client";

import { Button } from "@/components/ui";
import { formatSeatLabel } from "@/lib/claim-seat";
import type { AdminRoleRow, RoleConfirm } from "./admin-role-types";

export function AdminRoleList({
  players,
  canDemoteMembershipIds,
  busyId,
  onConfirm,
}: {
  players: AdminRoleRow[];
  canDemoteMembershipIds: string[];
  busyId: string;
  onConfirm: (row: RoleConfirm) => void;
}) {
  return (
    <ul className="space-y-2">
      {players.map((member) => {
        const label = formatSeatLabel(member.nickname, member.realName);
        const isAdmin = member.isAdmin || member.role === "admin";
        return (
          <li
            key={member.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">
                {label}
                {member.isYou ? " (you)" : ""}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {isAdmin ? "Player + Administrator" : "Player"}
              </p>
            </div>
            {isAdmin ? (
              <Button
                variant="secondary"
                className="text-xs shrink-0"
                disabled={busyId !== "" || !canDemoteMembershipIds.includes(member.id)}
                onClick={() =>
                  onConfirm({ id: member.id, nickname: member.nickname, action: "demote" })
                }
              >
                Remove admin
              </Button>
            ) : (
              <Button
                className="text-xs shrink-0"
                disabled={busyId !== ""}
                onClick={() =>
                  onConfirm({ id: member.id, nickname: member.nickname, action: "promote" })
                }
              >
                Make administrator
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
