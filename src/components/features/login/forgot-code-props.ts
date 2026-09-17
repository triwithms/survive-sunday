import type { FormEvent } from "react";
import type { OtpChannel } from "@/lib/otp";
import type { ChallengeView } from "./forgot-types";

export type ForgotCodeStepProps = {
  email: string;
  view: ChallengeView | null;
  code: string;
  setCode: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirm: string;
  setConfirm: (v: string) => void;
  info: string;
  err: string;
  busy: boolean;
  cooldown: number;
  onReset: (e: FormEvent) => void;
  onResend: (channel?: OtpChannel) => void;
  otherChannel: OtpChannel | null;
};
