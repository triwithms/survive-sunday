import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

const PRESS =
  "inline-flex items-center justify-center gap-2 touch-manipulation " +
  "transition-[transform,filter] duration-75 " +
  "active:scale-[0.97] active:brightness-90";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  pending?: boolean;
};

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  pending = false,
  disabled,
  children,
  onClick,
  ...props
}: Props) {
  const blocked = Boolean(disabled) && !pending;
  return (
    <button
      type={type}
      {...props}
      aria-busy={pending || undefined}
      disabled={blocked}
      onClick={(e) => {
        if (pending || blocked) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      className={cn(VARIANTS[variant], PRESS, pending && "scale-[0.97] brightness-90", className)}
    >
      {pending ? <Spinner /> : null}
      {children}
    </button>
  );
}
