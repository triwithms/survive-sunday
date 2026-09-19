import { AdminAnnouncePanel } from "@/components/AdminAnnouncePanel";
import { DeliveryStatusCard } from "@/components/DeliveryStatusCard";
import { PersonalInvitePanel } from "@/components/PersonalInvitePanel";
import { AdminDetails } from "./AdminDetails";
import { AdminHeading } from "./AdminHeading";
import { HomeScreenPanel } from "./HomeScreenPanel";
import type { CommsScreenProps } from "./types";

export function CommsScreen({ seats, delivery }: CommsScreenProps) {
  return (
    <div className="space-y-4">
      <AdminHeading title="Comms">
        Join links, Home Screen ask, and pool notes.
      </AdminHeading>
      <PersonalInvitePanel seats={seats} />
      <HomeScreenPanel />
      <AdminAnnouncePanel />
      <AdminDetails title="Sign-in emails" testId="comms-delivery">
        <DeliveryStatusCard status={delivery} />
      </AdminDetails>
    </div>
  );
}
