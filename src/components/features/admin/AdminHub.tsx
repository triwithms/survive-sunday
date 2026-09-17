import Link from "next/link";
import { Card } from "@/components/ui";
import { ADMIN_TABS } from "./admin-tabs";
import { AdminHeading } from "./AdminHeading";

export function AdminHub() {
  return (
    <div className="space-y-4">
      <AdminHeading title="Commissioner">
        Pick a menu. Tools stay on one screen each — roster, pool settings,
        invites, and status.
      </AdminHeading>
      <ul className="space-y-3">
        {ADMIN_TABS.map((tab) => (
          <li key={tab.href}>
            <Card as="article" className="p-4 space-y-2">
              <h2 className="font-semibold text-gold-400">{tab.name}</h2>
              <p className="text-sm text-[var(--text-muted)]">{tab.blurb}</p>
              <Link
                href={tab.href}
                prefetch={false}
                className="btn-primary inline-flex items-center justify-center w-full min-h-11"
              >
                Open {tab.name}
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
