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
          className="mt-1"
          name="password-kind"
          checked={kind === "temporary"}
          onChange={() => onKind("temporary")}
        />
        <span>Temporary — I’ll text it; they can change it later.</span>
      </label>
      <label className="flex items-start gap-3 text-sm min-h-11">
        <input
          type="radio"
          className="mt-1"
          name="password-kind"
          checked={kind === "permanent"}
          onChange={() => onKind("permanent")}
        />
        <span>Permanent — they can keep this until they change it.</span>
      </label>
    </fieldset>
  );
}
