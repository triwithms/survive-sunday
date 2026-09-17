import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const TONES = {
  gold: "chip-gold",
  "one-loss": "chip-one-loss",
  eliminated: "chip-eliminated",
  live: "chip-live",
} as const;

export type ChipTone = keyof typeof TONES;

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone;
};

export function Chip({ tone = "gold", className, ...props }: Props) {
  return <span className={cn("chip", TONES[tone], className)} {...props} />;
}
