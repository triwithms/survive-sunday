import type { ResetPreview } from "./reset-pool-types";

export function ResetPoolPreview({ preview }: { preview: ResetPreview }) {
  return (
    <div className="text-sm space-y-2">
      <p>
        This will clear <strong>{preview.pickCount}</strong> pick
        {preview.pickCount === 1 ? "" : "s"} and reset survival status for
        remaining members.
      </p>
      {preview.demoMembersToRemove.length > 0 ? (
        <p>
          Practice accounts to remove:{" "}
          {preview.demoMembersToRemove.map((m) => m.nickname).join(", ")}.
        </p>
      ) : null}
      {preview.membersKept.length > 0 ? (
        <p className="text-[var(--text-muted)]">
          Kept (reset to undefeated):{" "}
          {preview.membersKept
            .map((m) =>
              m.role === "admin" ? `${m.nickname} (administrator)` : m.nickname
            )
            .join(", ")}
          .
        </p>
      ) : null}
    </div>
  );
}
