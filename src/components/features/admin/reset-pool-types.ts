export type ResetPreview = {
  poolName: string;
  pickCount: number;
  demoMembersToRemove: { nickname: string; email: string }[];
  membersKept: { nickname: string; email: string; role: string }[];
  weekCount: number;
};
