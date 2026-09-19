"use client";

import type { PasswordKind } from "./password-members";

export function SetPasswordKind({
  kind,
  onKind,
}: {
  kind: PasswordKind;
  onKind: (kind: PasswordKind) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm text-[var(--text-muted)]">Kind</legend>
      <label className="flex items-start gap-3 text-sm min-h-11">
        <input
          type="radio"
          className="mt-1 !h-4 !w-4 !min-h-0 !p-0 shrink-0"
          name="password-kind"
          checked={kind === "temporary"}
          onChange={() => onKind("temporary")}
        />
        <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
          Temporary — I’ll text it; they can change it later.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm min-h-11">
        <input
          type="radio"
          className="mt-1 !h-4 !w-4 !min-h-0 !p-0 shrink-0"
          name="password-kind"
          checked={kind === "permanent"}
          onChange={() => onKind("permanent")}
        />
        <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
          Permanent — they can keep this until they change it.
        </span>
      </label>
    </fieldset>
  );
}
