"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { AdminRoleConfirm } from "./AdminRoleConfirm";
import { AdminRoleList } from "./AdminRoleList";
import type { AdminRoleRow, RoleConfirm } from "./admin-role-types";

export type { AdminRoleRow } from "./admin-role-types";

export function AdminRolesPanel({
  members,
  canDemoteMembershipIds,
}: {
  members: AdminRoleRow[];
  canDemoteMembershipIds: string[];
}) {
  const router = useRouter();
  const titleId = useId();
  const [busyId, setBusyId] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState<RoleConfirm | null>(null);
  const players = members.filter((m) => m.role !== "admin");

  async function run(action: "promote" | "demote", membershipId: string) {
    setBusyId(membershipId);
    setErr("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, action }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        nickname?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Couldn’t update administrator access");
        return;
      }
      setMsg(
        action === "promote"
          ? `${data.nickname || "That player"} can now open Admin tools.`
          : `${data.nickname || "That player"} is a player only again.`
      );
      router.refresh();
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusyId("");
      setConfirm(null);
    }
  }

  return (
    <Card as="section" className="p-4 space-y-3">
      <div>
        <h2 className="font-semibold">Administrators</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Give Admin tools to someone already in the pool. They stay on the
          board as a player. The pool must keep at least one administrator.
        </p>
      </div>
      {msg ? <p className="text-sm text-field-400" role="status">{msg}</p> : null}
      {err ? <p className="text-sm text-crimson-400" role="alert">{err}</p> : null}
      <AdminRoleList
        players={players}
        canDemoteMembershipIds={canDemoteMembershipIds}
        busyId={busyId}
        onConfirm={setConfirm}
      />
      {confirm ? (
        <AdminRoleConfirm
          confirm={confirm}
          titleId={titleId}
          busy={busyId !== ""}
          onCancel={() => setConfirm(null)}
          onRun={() => void run(confirm.action, confirm.id)}
        />
      ) : null}
    </Card>
  );
}
