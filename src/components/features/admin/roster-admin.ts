import type { RosterMember } from "./roster-types";

export function stampRosterAdmins(
  members: RosterMember[],
  admins: { id: string; isAdmin: boolean }[],
  canDemoteIds: string[]
): RosterMember[] {
  const adminIds = new Set(admins.filter((row) => row.isAdmin).map((row) => row.id));
  const demote = new Set(canDemoteIds);
  return members.map((member) => {
    const isPoolAdmin = adminIds.has(member.id);
    return {
      ...member,
      isPoolAdmin,
      canChangeAdmin: isPoolAdmin ? demote.has(member.id) : true,
    };
  });
}
