"use client";

type MemberOption = { id: string; nickname: string; status: string };

export function TransferFields({
  members,
  selected,
  membershipId,
  confirmNickname,
  understood,
  busy,
  onMembership,
  onConfirm,
  onUnderstood,
}: {
  members: MemberOption[];
  selected?: MemberOption;
  membershipId: string;
  confirmNickname: string;
  understood: boolean;
  busy: boolean;
  onMembership: (id: string) => void;
  onConfirm: (value: string) => void;
  onUnderstood: (value: boolean) => void;
}) {
  return (
    <>
      <ul className="text-xs text-[var(--text-muted)] list-disc pl-5 space-y-1">
        <li>They keep their picks and stay on the board (if they were a player).</li>
        <li>They also get the Admin screen.</li>
        <li>You lose Admin after this. Use Help if you need to undo it later.</li>
        <li>
          If you were only running the pool (not playing), you become a player
          from the next open week so old missed weeks do not count against you.
        </li>
      </ul>
      <label className="block text-sm space-y-1">
        <span className="text-[var(--text-muted)]">Give Admin to</span>
        <select
          className="w-full min-h-11 rounded-md bg-stadium-800 border border-stadium-border px-3"
          value={membershipId}
          disabled={busy}
          onChange={(e) => onMembership(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nickname} ({m.status.replace("_", " ")})
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm space-y-1">
        <span className="text-[var(--text-muted)]">
          Type {selected ? selected.nickname : "their nickname"} to confirm
        </span>
        <input
          type="text"
          autoComplete="off"
          className="w-full min-h-11 rounded-md bg-stadium-800 border border-stadium-border px-3"
          value={confirmNickname}
          onChange={(e) => onConfirm(e.target.value)}
          placeholder={selected?.nickname ?? "Nickname"}
        />
      </label>
      <label className="flex items-start gap-3 text-sm min-h-11">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--gold-400,#d4a017)]"
          checked={understood}
          onChange={(e) => onUnderstood(e.target.checked)}
        />
        <span>
          I understand I will lose Admin and {selected?.nickname ?? "they"} will
          run the pool.
        </span>
      </label>
    </>
  );
}
