import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "destructive";
};

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  const styles = {
    default: "bg-primary/10 text-primary border border-primary/20",
    secondary: "bg-muted text-foreground border border-border",
    destructive: "bg-destructive text-destructive-foreground border border-destructive/40",
  } as const;

  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", styles[variant], className)} {...props} />;
}
