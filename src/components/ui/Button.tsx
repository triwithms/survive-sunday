import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(VARIANTS[variant], className)}
      {...props}
    />
  );
}
