import { Chip, type ChipTone } from "./Chip";
import type { HTMLAttributes } from "react";

/** Visual map only — caller supplies the label as children. */
const STATUS_TONE = {
  undefeated: "gold",
  one_loss: "one-loss",
  eliminated: "eliminated",
} as const satisfies Record<string, ChipTone>;

export type StatusBadgeStatus = keyof typeof STATUS_TONE;

type Props = HTMLAttributes<HTMLSpanElement> & {
  status: StatusBadgeStatus;
};

export function StatusBadge({ status, className, ...props }: Props) {
  return <Chip tone={STATUS_TONE[status]} className={className} {...props} />;
}
