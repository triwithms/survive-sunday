import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tag = "div" | "section" | "article" | "aside" | "figure" | "li";

type Props = HTMLAttributes<HTMLElement> & {
  as?: Tag;
};

/** Stadium card-glass panel. Padding is opt-in via className. */
export function Card({ as: Tag = "div", className, ...props }: Props) {
  return <Tag className={cn("card-glass", className)} {...props} />;
}
