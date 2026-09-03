import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "subtle"
  | "outline"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap " +
  "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand-solid text-white shadow-xs hover:bg-brand-solid-hover",
  secondary:
    "border border-line bg-surface text-ink shadow-xs hover:bg-surface-hover hover:border-line-strong",
  ghost: "text-ink-secondary hover:bg-surface-hover hover:text-ink",
  subtle: "bg-brand-soft text-brand-text hover:bg-brand-soft-hover",
  outline: "border border-brand-border bg-transparent text-brand-text hover:bg-brand-soft",
  danger: "bg-status-critical text-white shadow-xs hover:bg-[#b8302f]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-[15px]",
  icon: "h-9 w-9",
  "icon-sm": "h-8 w-8",
};

/**
 * Class string for the button look, so links and other elements can adopt it
 * without wrapping a `<button>`.
 */
export function buttonStyles(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const { variant = "primary", size = "md", className } = options ?? {};
  return cn(base, variantStyles[variant], sizeStyles[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
});
