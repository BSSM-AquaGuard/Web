import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function ScrollArea({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("overflow-auto", className)} {...props}>
      {children}
    </div>
  );
}
