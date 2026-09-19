"use client";

import { InviteJoinButtons } from "./InviteJoinButtons";
import { needsEmailToLogIn, rosterRowSubtitle } from "./roster-row-meta";
import type { RosterMember } from "./roster-types";

type Props = {
  member: RosterMember;
  open: boolean;
  onToggle: () => void;
  backupSourceNickname?: string | null;
  children: React.ReactNode;
};

export function RosterRow({
  member,
  open,
  onToggle,
  backupSourceNickname,
  children,
}: Props) {
  const editorId = `roster-editor-${member.id}`;
  const needsEmail = needsEmailToLogIn(member);
  return (
    <li className="min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          className="flex-1 min-h-11 py-2.5 text-left min-w-0"
          aria-expanded={open}
          aria-controls={editorId}
          onClick={onToggle}
          data-testid={`roster-toggle-${member.id}`}
        >
          <span className="block text-sm font-medium truncate">
            {member.nickname}
          </span>
          <span className="block text-xs text-[var(--text-muted)] break-words whitespace-normal">
            {rosterRowSubtitle(member, backupSourceNickname).split(" · ")[0]}
          </span>
        </button>
        <InviteJoinButtons membershipId={member.id} nickname={member.nickname} />
        <button
          type="button"
          className="min-h-11 px-2 shrink-0 text-xs text-gold-400"
          aria-expanded={open}
          aria-controls={editorId}
          onClick={onToggle}
        >
          {open ? "Close" : "Edit"}
        </button>
      </div>
      {needsEmail ? (
        <p className="pb-1 text-xs text-[var(--text-muted)]" data-testid="needs-email">
          Needs email to log in
        </p>
      ) : null}
      {open ? (
        <div id={editorId} className="pb-4 space-y-3 min-w-0 max-w-full">
          {children}
        </div>
      ) : null}
    </li>
  );
}
