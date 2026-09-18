"use client";

import { rosterRowDetail } from "./roster-row-meta";
import type { RosterMember } from "./roster-types";

type Props = {
  member: RosterMember;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function RosterRow({ member, open, onToggle, children }: Props) {
  const editorId = `roster-editor-${member.id}`;
  return (
    <li className="min-w-0">
      <button
        type="button"
        className="w-full min-h-11 flex items-center justify-between gap-3 py-2.5 text-left min-w-0"
        aria-expanded={open}
        aria-controls={editorId}
        onClick={onToggle}
        data-testid={`roster-toggle-${member.id}`}
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium truncate">
            {member.nickname}
          </span>
          <span className="block text-xs text-[var(--text-muted)] truncate">
            {rosterRowDetail(member)}
          </span>
        </span>
        <span className="text-xs text-gold-400 shrink-0">
          {open ? "Close" : "Edit"}
        </span>
      </button>
      {open ? (
        <div id={editorId} className="pb-4 space-y-3 min-w-0 max-w-full">
          {children}
        </div>
      ) : null}
    </li>
  );
}
