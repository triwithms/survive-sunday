import Link from "next/link";
import { AdminDetails } from "./AdminDetails";
import { AdminGradePanel } from "./AdminGradePanel";
import { AdminLockPanel } from "./AdminLockPanel";

export function SystemWeekTools({
  weekNumber,
  games,
}: {
  weekNumber: number;
  games: { id: string; label: string; status: string }[];
}) {
  return (
    <AdminDetails title="Week tools — lock, grade, import" testId="system-week-tools">
      <AdminLockPanel weekNumber={weekNumber} />
      <AdminGradePanel weekNumber={weekNumber} games={games} />
      <Link
        href="/admin/import"
        prefetch={false}
        className="btn-secondary inline-flex items-center justify-center w-full min-h-11"
      >
        Import week picks
      </Link>
    </AdminDetails>
  );
}
