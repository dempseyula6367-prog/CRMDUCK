import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent",
  secondary:
    "bg-white text-foreground hover:bg-muted border-border shadow-sm",
  ghost: "bg-transparent text-foreground hover:bg-muted border-transparent",
  danger: "bg-danger text-white hover:bg-danger/90 border-transparent"
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  icon: "h-9 w-9 p-0"
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:focus-ring",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
