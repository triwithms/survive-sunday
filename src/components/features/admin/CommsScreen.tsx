import { AdminAnnouncePanel } from "@/components/AdminAnnouncePanel";
import { PersonalInvitePanel } from "@/components/PersonalInvitePanel";
import { AdminHeading } from "./AdminHeading";
import type { CommsScreenProps } from "./types";

export function CommsScreen({ seats }: CommsScreenProps) {
  return (
    <div className="space-y-6">
      <AdminHeading title="Communications">
        Copy one Join link per friend who has not Joined. Pool notes and
        missing-pick nudges only go to friends who left those prefs on.
      </AdminHeading>
      <PersonalInvitePanel seats={seats} />
      <AdminAnnouncePanel />
    </div>
  );
}
