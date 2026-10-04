"use client";

/** Clears the session, then opens Sign in. A Link to /login loops when already signed in. */
export function SwitchAccountLink({
  callbackUrl,
  className,
  children,
}: {
  callbackUrl: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form action="/api/logout" method="post" className="inline">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
