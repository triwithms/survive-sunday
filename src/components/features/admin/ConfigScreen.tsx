import { AdminDetails } from "./AdminDetails";
import { AdminRolesPanel } from "./AdminRolesPanel";
import { AdminHeading } from "./AdminHeading";
import { DeletePoolPanel } from "./DeletePoolPanel";
import { EntryFeeCard } from "./EntryFeeCard";
import { PoolInviteCard } from "./PoolInviteCard";
import { PoolRulesForm } from "./PoolRulesForm";
import { PoolStartWeekCard } from "./PoolStartWeekCard";
import { ResetPoolPanel } from "./ResetPoolPanel";
import { TeamLogosCard } from "./TeamLogosCard";
import { TransferCommissionerForm } from "./TransferCommissionerForm";
import type { ConfigScreenProps } from "./types";

export function ConfigScreen(props: ConfigScreenProps) {
  return (
    <div className="space-y-4">
      <AdminHeading title="Pool">
        Mulligan rules, entry fees, and Hand the pool. Administrators are
        listed here. Reset and Delete are last.
      </AdminHeading>
      <PoolInviteCard active={props.poolInviteActive} />
      <PoolStartWeekCard startWeek={props.startWeek} />
      <PoolRulesForm
        currentWeek={props.currentWeek}
        startWeek={props.startWeek}
        singleEliminationFromWeek={props.singleEliminationFromWeek}
        oneLossCount={props.oneLossCount}
        undefeatedCount={props.undefeatedCount}
      />
      <EntryFeeCard
        enabled={props.paymentTrackingEnabled}
        entryFeeCents={props.entryFeeCents}
        currency={props.entryFeeCurrency}
        instructions={props.paymentInstructions}
        link={props.paymentLink}
      />
      <TeamLogosCard
        showTeamLogos={props.showTeamLogos}
        forcedOff={props.teamLogosForcedOff}
      />
      <AdminRolesPanel members={props.roleMembers} />
      <TransferCommissionerForm members={props.transferMembers} />
      <AdminDetails title="Danger — reset the pool" danger testId="pool-danger">
        <ResetPoolPanel />
      </AdminDetails>
      <AdminDetails title="Danger — delete this pool" danger testId="pool-delete">
        <DeletePoolPanel poolId={props.poolId} poolName={props.poolName} />
      </AdminDetails>
    </div>
  );
}
