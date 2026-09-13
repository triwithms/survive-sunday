"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ModalDialog } from "@/components/ModalDialog";
import { formatSeatLabel } from "@/lib/claim-seat";

export type AdminRoleRow = {
  id: string;
  nickname: string;
  realName: string | null;
  role: string;
  isAdmin: boolean;
  isYou: boolean;
};

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
  const [confirm, setConfirm] = useState<
    { id: string; nickname: string; action: "promote" | "demote" } | null
  >(null);

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
    <section className="card-glass p-4 space-y-3">
      <div>
        <h2 className="font-semibold">Administrators</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Give Admin tools to someone already in the pool. They stay on the
          board as a player. The pool must keep at least one administrator.
        </p>
      </div>
      {msg && (
        <p className="text-sm text-field-400" role="status">
          {msg}
        </p>
      )}
      {err && (
        <p className="text-sm text-crimson-400" role="alert">
          {err}
        </p>
      )}
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
                <button
                  type="button"
                  className="btn-secondary text-xs shrink-0"
                  disabled={
                    busyId !== "" || !canDemoteMembershipIds.includes(member.id)
                  }
                  onClick={() =>
                    setConfirm({
                      id: member.id,
                      nickname: member.nickname,
                      action: "demote",
                    })
                  }
                >
                  Remove admin
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary text-xs shrink-0"
                  disabled={busyId !== ""}
                  onClick={() =>
                    setConfirm({
                      id: member.id,
                      nickname: member.nickname,
                      action: "promote",
                    })
                  }
                >
                  Make administrator
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {confirm && (
        <ModalDialog
          labelledBy={titleId}
          onBackdropClick={busyId ? undefined : () => setConfirm(null)}
        >
          <h2 id={titleId} className="font-semibold text-lg text-gold-400">
            {confirm.action === "promote"
              ? `Give ${confirm.nickname} Admin tools?`
              : `Remove Admin from ${confirm.nickname}?`}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            {confirm.action === "promote"
              ? "They can change pool settings, import picks, and open Admin. They stay on the board as a player."
              : "They stay in the pool as a player. They will no longer see Admin tools."}
          </p>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="btn-secondary flex-1"
              disabled={busyId !== ""}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={busyId !== ""}
              onClick={() => void run(confirm.action, confirm.id)}
            >
              {busyId ? "Saving…" : "Yes, confirm"}
            </button>
          </div>
        </ModalDialog>
      )}
    </section>
  );
}
