import { useEffect, useMemo, useState } from "react";
import { Fish, Gauge, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/MetricCard";
import { EventsTimeline } from "@/components/EventsTimeline";
import { SensorChart } from "@/components/SensorChart";
import { StreamCard } from "@/components/StreamCard";
import { fetchSeries, fetchSnapshot } from "@/lib/api";
import { REFRESH_MS } from "@/lib/config";
import { fmtISOShort } from "@/lib/format";
import { inferRiskFromSnapshot } from "@/lib/risk";
import { AIEvent, CameraItem, FarmId, RiskLevel, SensorPoint, SensorSnapshot, ZoneId, ZoneStatus } from "@/types";

function riskBadge(risk: RiskLevel) {
  switch (risk) {
    case "ALERT":
      return <Badge variant="destructive">ALERT</Badge>;
    case "SUSPECT":
      return <Badge variant="secondary">SUSPECT</Badge>;
    default:
      return <Badge>NORMAL</Badge>;
  }
}

export function ZonePanel({
  farmId,
  zoneId,
  cameras,
  events,
  autoRefresh,
  refreshKey,
  token,
}: {
  farmId: FarmId | null;
  zoneId: ZoneId | null;
  cameras: CameraItem[];
  events: AIEvent[];
  autoRefresh: boolean;
  refreshKey: number;
  token?: string | null;
}) {
  const [snapshot, setSnapshot] = useState<SensorSnapshot | null>(null);
  const [series, setSeries] = useState<SensorPoint[]>([]);
  const [status, setStatus] = useState<ZoneStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const zoneCams = useMemo(
    () => cameras.filter((c) => c.farmId === farmId && (zoneId == null || c.zoneId === zoneId)),
    [cameras, farmId, zoneId]
  );
  const zoneEvents = useMemo(
    () => events.filter((e) => e.farmId === farmId && (zoneId == null || e.zoneId === zoneId)),
    [events, farmId, zoneId]
  );

  useEffect(() => {
    if (farmId == null || zoneId == null) {
      setSnapshot(null);
      setSeries([]);
      setStatus(null);
      return;
    }

    let alive = true;

    const update = async () => {
      setLoading(true);
      try {
        const [snap, ser] = await Promise.all([fetchSnapshot(farmId, zoneId, token || undefined), fetchSeries(farmId, zoneId, token || undefined)]);
        if (!alive) return;
        setSnapshot(snap);
        setSeries(ser);
        setStatus(inferRiskFromSnapshot(snap));
      } finally {
        if (alive) setLoading(false);
      }
    };

    update();
    if (!autoRefresh)
      return () => {
        alive = false;
      };

    const id = setInterval(update, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [farmId, zoneId, autoRefresh, refreshKey, token]);

  const last = series.length ? series[series.length - 1] : null;
  const formatValue = (v: number | null | undefined, digits = 1) => (v == null ? "--" : v.toFixed(digits));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="수온"
          value={formatValue(snapshot?.temperatureC, 1)}
          unit="°C"
          hint={snapshot ? `업데이트: ${fmtISOShort(snapshot.updatedAt)}` : loading ? "로딩 중" : "데이터 없음"}
          icon={<Gauge className="h-4 w-4" />}
        />
        <MetricCard
          title="탁도"
          value={formatValue(snapshot?.turbidityNTU, 1)}
          unit="NTU"
          hint={last ? `최근 1시간 추이` : loading ? "로딩 중" : "데이터 없음"}
          icon={<Waves className="h-4 w-4" />}
        />
        <MetricCard
          title="산소포화(DO)"
          value={formatValue(snapshot?.dissolvedOxygenMgL, 2)}
          unit="mg/L"
          hint={status ? `${status.reason}` : loading ? "로딩 중" : "데이터 없음"}
          icon={<Fish className="h-4 w-4" />}
        />
        <MetricCard
          title="산소포화도"
          value={formatValue(snapshot?.doSaturationPercent, 0)}
          unit="%"
          hint={snapshot ? "수온/DO 기반 계산값" : loading ? "로딩 중" : "데이터 없음"}
          icon={<Gauge className="h-4 w-4" />}
        />
        <MetricCard
          title="pH"
          value={formatValue(snapshot?.ph, 2)}
          unit="pH"
          hint={snapshot ? "적정 범위 6.8 ~ 8.4" : loading ? "로딩 중" : "데이터 없음"}
          icon={<Gauge className="h-4 w-4" />}
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Zone 상태</span>
            {status ? riskBadge(status.risk) : <Badge variant="secondary">{loading ? "LOADING" : "NO DATA"}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">사유:</span>
            <span>{status ? status.reason : loading ? "로딩 중" : "데이터 없음"}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            ※ 현재는 기본 임계치 로직입니다. 실제 운영에서는 현장 기준으로 보정 후 적용하세요.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SensorChart title="센서 그래프 (실시간, 최근 1시간 / 5분 간격)" data={series} />
        <EventsTimeline events={zoneEvents} filter={""} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zoneCams.length === 0 ? (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">등록된 카메라가 없습니다.</CardContent>
          </Card>
        ) : (
          zoneCams.map((c) => <StreamCard key={c.id} cam={c} />)
        )}
      </div>
    </div>
  );
}
