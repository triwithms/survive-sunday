"use client";

type Props = {
  nickname: string;
  realName: string;
  disabled: boolean;
  onNickname: (value: string) => void;
  onRealName: (value: string) => void;
};

export function RosterCardFields({
  nickname,
  realName,
  disabled,
  onNickname,
  onRealName,
}: Props) {
  return (
    <>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Nickname (what the board shows)</span>
        <input
          value={nickname}
          onChange={(e) => onNickname(e.target.value)}
          maxLength={24}
          disabled={disabled}
          className="mt-1"
          autoComplete="off"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Full name</span>
        <input
          value={realName}
          onChange={(e) => onRealName(e.target.value)}
          maxLength={80}
          disabled={disabled}
          className="mt-1"
          autoComplete="name"
          placeholder="e.g. Robert Gama"
        />
      </label>
    </>
  );
}
