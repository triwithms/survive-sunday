"use client";

type JoinFieldsProps = {
  viaPersonal: boolean;
  newPlayer: boolean;
  showPassword: boolean;
  lockEmail: boolean;
  inviteCode: string;
  setInviteCode: (value: string) => void;
  nickname: string;
  setNickname: (value: string) => void;
  realName: string;
  setRealName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
};

export function JoinFields(p: JoinFieldsProps) {
  const showIdentity = p.newPlayer || p.showPassword;
  return (
    <>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Invite code</span>
        <input
          value={p.inviteCode}
          onChange={(e) => p.setInviteCode(e.target.value.toUpperCase())}
          required
          className="mt-1 font-mono tracking-widest"
          autoComplete="off"
        />
        {p.viaPersonal && (
          <span className="block mt-1 text-xs text-[var(--text-muted)]">
            Already filled in.
          </span>
        )}
      </label>
      {p.newPlayer && (
        <>
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">
              Nickname (unique in pool)
            </span>
            <input
              value={p.nickname}
              onChange={(e) => p.setNickname(e.target.value)}
              required
              className="mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">Real name (optional)</span>
            <input
              value={p.realName}
              onChange={(e) => p.setRealName(e.target.value)}
              className="mt-1"
            />
          </label>
        </>
      )}
      {showIdentity && (
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Email</span>
          <input
            type="email"
            value={p.email}
            onChange={(e) => p.setEmail(e.target.value)}
            required
            readOnly={p.lockEmail}
            className="mt-1"
            autoComplete="email"
          />
        </label>
      )}
      {p.showPassword && (
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">
            {p.newPlayer ? "Password" : "Password you already sign in with"}
          </span>
          <input
            type="password"
            name="password"
            value={p.password}
            onChange={(e) => p.setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1"
            autoComplete="current-password"
          />
          {!p.newPlayer && (
            <span className="block mt-1 text-xs text-[var(--text-muted)]">
              Same as Sign in — not a new password.
            </span>
          )}
        </label>
      )}
    </>
  );
}
