import { AdminAnnouncePanel } from "@/components/AdminAnnouncePanel";
import { DeliveryStatusCard } from "@/components/DeliveryStatusCard";
import { PersonalInvitePanel } from "@/components/PersonalInvitePanel";
import { AdminHeading } from "./AdminHeading";
import type { CommsScreenProps } from "./types";

export function CommsScreen({ seats, delivery }: CommsScreenProps) {
  return (
    <div className="space-y-6">
      <AdminHeading title="Communications">
        Personal Join links, pool notes, and whether sign-in emails can send.
      </AdminHeading>
      <PersonalInvitePanel seats={seats} />
      <AdminAnnouncePanel />
      <DeliveryStatusCard status={delivery} />
    </div>
  );
}
