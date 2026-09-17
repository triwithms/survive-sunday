export type AdminRoleRow = {
  id: string;
  nickname: string;
  realName: string | null;
  role: string;
  isAdmin: boolean;
  isYou: boolean;
};

export type RoleConfirm = {
  id: string;
  nickname: string;
  action: "promote" | "demote";
};
