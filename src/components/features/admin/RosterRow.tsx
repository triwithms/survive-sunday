"use client";

import { TeamLogo } from "@/components/TeamLogo";
import { StatusBadge } from "@/components/ui";
import { InviteJoinButtons } from "./InviteJoinButtons";
import { needsEmailToLogIn, rosterRowSubtitle } from "./roster-row-meta";
import { isRosterLifeStatus, rosterStatusLabel } from "./roster-status";
import type { RosterMember } from "./roster-types";

type Props = {
  member: RosterMember;
  weekPick: string | null;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function RosterRow({
  member,
  weekPick,
  open,
  onToggle,
  children,
}: Props) {
  const editorId = `roster-editor-${member.id}`;
  const needsEmail = needsEmailToLogIn(member);
  const statusLabel = rosterStatusLabel(member.status);
  const out = member.status === "eliminated";
  return (
    <li className="min-w-0">
      <div className={`flex items-center gap-2 min-w-0 ${out ? "opacity-60" : ""}`}>
        <button
          type="button"
          className="flex flex-1 items-center gap-2 min-h-11 py-2.5 text-left min-w-0"
          aria-expanded={open}
          aria-controls={editorId}
          onClick={onToggle}
          data-testid={`roster-toggle-${member.id}`}
        >
          {weekPick ? (
            <span className="shrink-0" title={weekPick} aria-label={weekPick}>
              <TeamLogo abbr={weekPick} size={24} />
            </span>
          ) : (
            <span className="shrink-0 w-6 h-6" aria-hidden />
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium truncate">
              {member.nickname}
            </span>
            <span className="block text-xs text-[var(--text-muted)] break-words whitespace-normal">
              {rosterRowSubtitle(member).split(" · ")[0]}
            </span>
          </span>
          {statusLabel && isRosterLifeStatus(member.status) ? (
            <StatusBadge
              status={member.status}
              className="shrink-0"
              data-testid={`roster-status-${member.id}`}
            >
              {statusLabel}
            </StatusBadge>
          ) : null}
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
