import { useMemo } from "react";
import { AlertTriangle, Fish, Gauge, ShieldAlert, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { fmtISOShort } from "@/lib/format";
import { AIEvent, AIEventType } from "@/types";

function eventIcon(type: AIEventType) {
  switch (type) {
    case "red_tide":
      return <Waves className="h-4 w-4" />;
    case "jellyfish":
      return <Fish className="h-4 w-4" />;
    case "trash":
      return <AlertTriangle className="h-4 w-4" />;
    case "predator":
      return <ShieldAlert className="h-4 w-4" />;
    default:
      return <Gauge className="h-4 w-4" />;
  }
}

export function EventsTimeline({ events, filter }: { events: AIEvent[]; filter: string }) {
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => `${e.type} ${e.message}`.toLowerCase().includes(q));
  }, [events, filter]);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>AI 이벤트 타임라인</span>
          <Badge variant="secondary">최근 {filtered.length}건</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 pr-2">
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground">이벤트가 없습니다.</div>
            ) : (
              filtered
                .slice()
                .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                .map((e) => (
                  <div key={e.id} className="flex gap-3 rounded-xl border p-3">
                    <div className="mt-0.5 text-muted-foreground">{eventIcon(e.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm">{e.message}</div>
                        <div className="text-xs text-muted-foreground">{fmtISOShort(e.createdAt)}</div>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <div className="text-muted-foreground">
                          Type: <span className="font-mono">{e.type}</span>
                        </div>
                        <div>
                          Conf: <span className="font-mono">{Math.round(e.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
