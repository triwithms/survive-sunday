import { Card } from "@/components/ui";
import { SignOutButton } from "@/components/SignOutButton";

export function CommissionerSignOut() {
  return (
    <Card as="section" className="p-4 space-y-2">
      <p className="text-sm text-[var(--text-primary)] font-medium">
        Signed in as commissioner
      </p>
      <SignOutButton next="/login" className="btn-danger w-full" />
    </Card>
  );
}
