import { cn } from "@/lib/utils";

export function Surface({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-white shadow-sm",
        className
      )}
      {...props}
    />
  );
}
