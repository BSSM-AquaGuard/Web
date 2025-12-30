import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type MetricCardProps = {
  title: string;
  value: string;
  unit?: string;
  hint?: string;
  icon?: ReactNode;
  className?: string;
};

export function MetricCard({ title, value, unit, hint, icon, className }: MetricCardProps) {
  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
          {unit ? <div className="text-sm text-muted-foreground pb-1">{unit}</div> : null}
        </div>
        {hint ? <div className="text-xs text-muted-foreground mt-1">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}
