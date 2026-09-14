"use client";

import type { ClaimableSeat } from "@/lib/claim-seat";
import { InviteLinkCopy } from "@/components/InviteLinkCopy";

export function PersonalInvitePanel({ seats }: { seats: ClaimableSeat[] }) {
  const open = seats.filter((s) => !s.claimed);
  const claimed = seats.filter((s) => s.claimed);

  return (
    <section className="card-glass p-4 space-y-4" data-testid="personal-invite-panel">
      <div>
        <h2 className="font-semibold">Personal Join links</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Copy one link per friend who has not Joined yet. Text or email it to
          that person only. They tap the link, confirm their name, enter their
          own email and password. Do not send the same link to the whole group.
        </p>
      </div>
      {open.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Every player seat is claimed. Friends who already Joined should Sign
          in.
        </p>
      ) : (
        <ul className="space-y-4">
          {open.map((seat) => (
            <li key={seat.membershipId} className="border-t border-stadium-border pt-3 first:border-0 first:pt-0">
              <p className="text-sm font-medium mb-2">{seat.label}</p>
              <InviteLinkCopy
                membershipId={seat.membershipId}
                nickname={seat.nickname}
                claimed={false}
              />
            </li>
          ))}
        </ul>
      )}
      {claimed.length > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          Already joined ({claimed.length}):{" "}
          {claimed.map((s) => s.nickname).join(", ")}.
        </p>
      )}
    </section>
  );
}
