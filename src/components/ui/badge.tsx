import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "primary";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-yellow-700",
  danger: "bg-danger/10 text-danger",
  primary: "bg-primary/10 text-primary"
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded px-2 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
