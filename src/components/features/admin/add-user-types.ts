export type AddUserDraft = {
  nickname: string;
  realName: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  kind: "temporary" | "permanent";
  invite: boolean;
};

export type AddUserSaved = {
  nickname: string;
  realName: string | null;
  email: string | null;
  claimed: boolean;
  password: string | null;
  inviteUrl: string | null;
};

export const EMPTY_ADD_USER: AddUserDraft = {
  nickname: "",
  realName: "",
  email: "",
  phone: "",
  password: "",
  confirm: "",
  kind: "temporary",
  invite: true,
};
