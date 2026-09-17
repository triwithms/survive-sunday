import { Card } from "@/components/ui";

export function OpsPointers() {
  return (
    <Card as="section" className="p-4 space-y-2">
      <h2 className="font-semibold">Dangerous ops stay off this screen</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Demo vs Real toggle was removed. The pool is live-only.
      </p>
      <p className="text-sm text-[var(--text-muted)]">
        Schema repair, <code>prisma db push</code>, seed, and{" "}
        <code>ensure-production-db</code> are deploy/CLI only. This app never
        runs them from Admin, crons, or <code>next build</code>. See{" "}
        <code>DEPLOY.md</code>.
      </p>
    </Card>
  );
}
