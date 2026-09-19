import { Card } from "@/components/ui";

export function AdminDenied({ isDemo }: { isDemo?: boolean }) {
  void isDemo;
  return (
    <Card className="p-5 space-y-4">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          Admin only
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          This area is for pool administrators. Sign in with an administrator
          account to manage the roster, pool settings, and invites.
        </p>
      </div>
    </Card>
  );
}
