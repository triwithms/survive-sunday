"use client";

/**
 * Visible in-app Sign out. Native form POST so Safari clears the session
 * cookie. Do not use a bare /api/auth/signout URL as the only control.
 */
export function SignOutButton({
  next = "/",
  className = "btn-secondary w-full",
  children = "Sign out",
}: {
  next?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <form action="/api/logout" method="post" className="block w-full">
      <input type="hidden" name="callbackUrl" value={next} />
      <button type="submit" className={className} data-testid="sign-out">
        {children}
      </button>
    </form>
  );
}
