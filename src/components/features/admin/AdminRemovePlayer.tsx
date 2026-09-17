"use client";

import { Button, Card } from "@/components/ui";
import { useAdminPost } from "./use-admin-post";
import type { RemoveMember } from "./types";

export function AdminRemovePlayer({ members }: { members: RemoveMember[] }) {
  const { msg, busy, call } = useAdminPost();
  const players = members.filter((m) => m.role !== "admin");
  return (
    <Card as="section" className="p-4 space-y-2">
      <h2 className="font-semibold">Remove player</h2>
      <ul className="space-y-2">
        {players.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="min-w-0 truncate">
              {m.nickname}
              {m.realName ? ` (${m.realName})` : ""}{" "}
              <span className="text-[var(--text-muted)]">({m.status})</span>
            </span>
            <Button
              variant="danger"
              className="text-xs px-3 py-1 shrink-0"
              disabled={busy}
              onClick={() => {
                if (confirm(`Remove ${m.nickname} from the pool?`)) {
                  call("/api/admin/remove-player", { membershipId: m.id });
                }
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      {msg ? (
        <pre className="card-glass p-3 text-xs overflow-x-auto text-field-400">
          {msg}
        </pre>
      ) : null}
    </Card>
  );
}
