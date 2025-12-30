import { useEffect, useMemo, useState } from "react";
import { Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ZonePanel } from "@/components/ZonePanel";
import { EventsTimeline } from "@/components/EventsTimeline";
import { StreamCard } from "@/components/StreamCard";
import { API_BASE, REFRESH_MS } from "@/lib/config";
import { apiLogin, apiSignup, createCamera, createFarm, deleteCamera, deleteFarm, fetchCameras, fetchEvents, fetchFarms, fetchZones } from "@/lib/api";
import { clearAuth, loadAuth, saveAuth } from "@/lib/auth";
import { AIEvent, AIEventType, CameraItem, CameraType, Farm, FarmId, Zone, ZoneId } from "@/types";

export default function App() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [farmId, setFarmId] = useState<FarmId | null>(null);
  const [zoneId, setZoneId] = useState<ZoneId | null>(null);
  const [events, setEvents] = useState<AIEvent[]>([]);
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmLocation, setNewFarmLocation] = useState("");
  const [farmError, setFarmError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [newCameraName, setNewCameraName] = useState("");
  const [newCameraUrl, setNewCameraUrl] = useState("");
  const [newCameraType, setNewCameraType] = useState<CameraType>("cctv");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraSaving, setCameraSaving] = useState(false);
  const [farmDeleting, setFarmDeleting] = useState(false);
  const farmEvents = useMemo(() => (farmId ? events.filter((e) => e.farmId === farmId) : []), [events, farmId]);

  useEffect(() => {
    const stored = loadAuth();
    if (stored.token) {
      setToken(stored.token);
      setUserEmail(stored.email);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadFarms() {
      const list = await fetchFarms(token || undefined);
      if (!alive) return;
      setFarms(list);
      if (list.length > 0) {
        setFarmId((prev) => {
          if (prev && list.some((f) => f.id === prev)) return prev;
          return list[0].id;
        });
      } else {
        setFarmId(null);
        setZoneId(null);
      }
    }

    loadFarms();
    return () => {
      alive = false;
    };
  }, [token, refreshKey]);

  useEffect(() => {
    if (farmId == null) {
      setZones([]);
      setZoneId(null);
      return;
    }
    let alive = true;
    const targetFarmId = farmId;

    async function loadZones() {
      const list = await fetchZones(targetFarmId, token || undefined);
      if (!alive) return;
      setZones(list);
      setZoneId((prev) => {
        if (prev && list.some((z) => z.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    }

    loadZones();
    return () => {
      alive = false;
    };
  }, [farmId, token, refreshKey]);

  useEffect(() => {
    if (farmId == null) {
      setCameras([]);
      return;
    }
    let alive = true;
    const targetFarmId = farmId;
    async function load() {
      const cams = await fetchCameras(targetFarmId, token || undefined);
      if (!alive) return;
      setCameras(cams);
    }
    load();
    return () => {
      alive = false;
    };
  }, [farmId, token, refreshKey]);

  useEffect(() => {
    if (farmId == null) {
      setEvents([]);
      return;
    }
    let alive = true;
    const targetFarmId = farmId;

    async function tick() {
      const ev = await fetchEvents(targetFarmId, token || undefined);
      if (!alive) return;
      setEvents(ev);
    }

    tick();
    if (!autoRefresh)
      return () => {
        alive = false;
      };

    const id = setInterval(tick, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [farmId, autoRefresh, refreshKey, token]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return farmEvents;
    return farmEvents.filter((e) => `${e.type} ${e.message}`.toLowerCase().includes(q));
  }, [farmEvents, search]);

  const handleCreateCamera = async () => {
    if (farmId == null || zoneId == null) return;
    if (!token) {
      setCameraError("카메라 추가는 관리자 로그인 후 가능합니다.");
      return;
    }
    setCameraSaving(true);
    setCameraError(null);
    try {
      const name = newCameraName.trim() || `새 카메라 ${cameras.length + 1}`;
      const cam = await createCamera(
        { farmId, zoneId, name, type: newCameraType, streamUrl: newCameraUrl.trim() || "http://localhost" },
        token
      );
      setCameras((prev) => [...prev, cam]);
      setNewCameraName("");
      setNewCameraUrl("");
    } catch (err) {
      setCameraError("카메라 등록 실패: 권한 또는 백엔드 상태를 확인하세요.");
    } finally {
      setCameraSaving(false);
    }
  };

  const handleDeleteCamera = async (cam: CameraItem) => {
    if (!token) {
      setCameraError("카메라 삭제는 관리자 로그인 후 가능합니다.");
      return;
    }
    try {
      await deleteCamera(cam.id, token);
      setCameras((prev) => prev.filter((c) => c.id !== cam.id));
    } catch (err) {
      setCameraError("카메라 삭제 실패: 권한 또는 백엔드 상태를 확인하세요.");
    }
  };

  const handleManualRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleAddFarm = async () => {
    if (!token) {
      setFarmError("양식장 추가는 로그인 후 가능합니다.");
      return;
    }
    const name = newFarmName.trim() || `새 양식장 ${farms.length + 1}`;
    setFarmError(null);
    try {
      const created = await createFarm({ name, location: newFarmLocation.trim() || undefined }, token);
      setFarms((prev) => [...prev, created]);
      setFarmId(created.id);
      setNewFarmName("");
      setNewFarmLocation("");
    } catch (err) {
      setFarmError("양식장 생성 실패: 권한 또는 백엔드 상태를 확인하세요.");
    }
  };

  const handleDeleteFarm = async () => {
    if (!token) {
      setFarmError("양식장 삭제는 로그인 후 가능합니다.");
      return;
    }
    if (farmId == null) {
      setFarmError("삭제할 양식장을 선택하세요.");
      return;
    }
    if (!window.confirm("현재 선택한 양식장을 삭제할까요? (존/장치/이벤트/센서 데이터 포함)")) return;
    setFarmError(null);
    setFarmDeleting(true);
    try {
      await deleteFarm(farmId, token);
      const remaining = farms.filter((f) => f.id !== farmId);
      setFarms(remaining);
      setZones([]);
      setCameras([]);
      setEvents([]);
      setFarmId(remaining[0]?.id ?? null);
      setZoneId(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFarmError("양식장 삭제 실패: 권한 또는 백엔드 상태를 확인하세요.");
    } finally {
      setFarmDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl border flex items-center justify-center shadow-sm">
              <Waves className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Aqua-Quad</div>
              <div className="text-xs text-muted-foreground">분산형 AI 양식장 가드 시스템 관제 대시보드</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto Refresh</span>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
            <Button variant="secondary" className="rounded-2xl" onClick={handleManualRefresh}>
              새로고침
            </Button>
            {token ? (
              <>
                <div className="hidden md:block text-xs text-muted-foreground">로그인: {userEmail}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    clearAuth();
                    setToken(null);
                    setUserEmail(null);
                    setAuthEmail("");
                    setAuthPassword("");
                    setFarms([]);
                    setFarmId(null);
                    setZones([]);
                    setZoneId(null);
                    setCameras([]);
                    setEvents([]);
                    setSearch("");
                  }}
                >
                  로그아웃
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {!token ? (
          <Card className="rounded-2xl shadow-sm border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Aqua-Quad 로그인</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                <Input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="이메일" className="md:w-72 rounded-2xl" />
                <Input value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="비밀번호" type="password" className="md:w-72 rounded-2xl" />
                <Button
                  className="rounded-xl"
                  disabled={authLoading}
                  onClick={async () => {
                    setAuthError(null);
                    setAuthLoading(true);
                    try {
                      if (authMode === "signup") {
                        await apiSignup(authEmail, authPassword);
                      }
                      const r = await apiLogin(authEmail, authPassword);
                      setToken(r.access_token);
                      setUserEmail(authEmail);
                      saveAuth(r.access_token, authEmail);
                    } catch (err) {
                      setAuthError("로그인/회원가입 실패: 백엔드 실행 여부 확인");
                    } finally {
                      setAuthLoading(false);
                    }
                  }}
                >
                  {authMode === "login" ? "로그인" : "회원가입 후 로그인"}
                </Button>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
                  {authMode === "login" ? "회원가입으로 전환" : "로그인으로 전환"}
                </Button>
                <div className="text-muted-foreground">데이터 확인을 위해 백엔드 서버가 실행 중인지 확인하세요.</div>
              </div>
              {authError ? <div className="text-sm text-destructive">{authError}</div> : null}
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="py-4 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">양식장</span>
              <Select
                value={farmId ? String(farmId) : ""}
                onValueChange={(v) => {
                    setFarmId(v ? Number(v) : null);
                    setRefreshKey((k) => k + 1);
                  }}
                  options={farms.map((f) => ({ value: String(f.id), label: f.name }))}
                  placeholder="양식장 선택"
                  className="w-48"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Zone</span>
                <Select
                  value={zoneId ? String(zoneId) : ""}
                  onValueChange={(v) => {
                    setZoneId(v ? Number(v) : null);
                    setRefreshKey((k) => k + 1);
                  }}
                  options={zones.map((z) => ({ value: String(z.id), label: z.name }))}
                  placeholder="zone"
                  className="w-40"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="이벤트 검색 (red_tide, trash)"
                  className="w-full md:w-80 rounded-2xl"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <Input
                value={newFarmName}
                onChange={(e) => setNewFarmName(e.target.value)}
                placeholder="새 양식장 이름"
                className="md:w-60 rounded-2xl"
              />
              <Input
                value={newFarmLocation}
                onChange={(e) => setNewFarmLocation(e.target.value)}
                placeholder="위치 (선택)"
                className="md:w-60 rounded-2xl"
              />
              <Button className="rounded-xl md:w-40" onClick={handleAddFarm}>
                양식장 추가
              </Button>
              <Button variant="destructive" className="rounded-xl md:w-32" onClick={handleDeleteFarm} disabled={farmDeleting || farmId == null}>
                {farmDeleting ? "삭제 중..." : "양식장 삭제"}
              </Button>
              {farmError ? <div className="text-xs text-destructive">{farmError}</div> : null}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="rounded-2xl">
            <TabsTrigger value="dashboard" className="rounded-2xl">
              대시보드
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-2xl">
              이벤트
            </TabsTrigger>
            <TabsTrigger value="cameras" className="rounded-2xl">
              카메라
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-2xl">
              설정
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <ZonePanel
              farmId={farmId}
              zoneId={zoneId}
              cameras={cameras}
              events={farmEvents}
              autoRefresh={autoRefresh}
              refreshKey={refreshKey}
              token={token}
            />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <EventsTimeline events={filteredEvents} filter={search} />
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">이벤트 통계(최근 조회 기준)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">총 이벤트</span>
                    <span className="font-mono">{filteredEvents.length}</span>
                  </div>
                  <Separator />
                  {(["red_tide", "jellyfish", "trash", "predator", "normal"] as AIEventType[]).map((t) => {
                    const c = filteredEvents.filter((e) => e.type === t).length;
                    return (
                      <div key={t} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 capitalize">
                          <Badge variant="secondary" className="capitalize">
                            {t}
                          </Badge>
                        </span>
                        <span className="font-mono">{c}</span>
                      </div>
                    );
                  })}
                  <div className="text-xs text-muted-foreground pt-2">
                    정확한 통계를 위해 기간별 집계 API를 연동하세요: <span className="font-mono">/api/farms/:id/events/stats</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cameras" className="mt-6 space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-lg font-semibold">카메라 목록</div>
                  <div className="text-xs text-muted-foreground">
                    RTSP는 서버에서 HLS/MJPEG로 변환 후 웹에 연결하는 구성이 안정적입니다.
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                  <Input
                    value={newCameraName}
                    onChange={(e) => setNewCameraName(e.target.value)}
                    placeholder="카메라 이름"
                    className="rounded-2xl md:w-48"
                  />
                  <Input
                    value={newCameraUrl}
                    onChange={(e) => setNewCameraUrl(e.target.value)}
                    placeholder="스트림 URL"
                    className="rounded-2xl md:w-64"
                  />
                  <Select
                    value={newCameraType}
                    onValueChange={(v) => setNewCameraType(v as CameraType)}
                    options={[
                      { value: "cctv", label: "CCTV" },
                      { value: "ai_cam", label: "AI" },
                      { value: "esp_cam", label: "ESP32-CAM" },
                    ]}
                    className="md:w-32"
                  />
                  <Button className="rounded-2xl md:w-32" disabled={cameraSaving || farmId == null || zoneId == null} onClick={handleCreateCamera}>
                    {cameraSaving ? "등록 중..." : "카메라 추가"}
                  </Button>
                </div>
              </div>
              {cameraError ? <div className="text-xs text-destructive">{cameraError}</div> : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cameras.filter((c) => c.farmId === farmId && (zoneId == null || c.zoneId === zoneId)).length === 0 ? (
                <Card className="rounded-2xl shadow-sm">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">등록된 카메라가 없습니다.</CardContent>
                </Card>
              ) : (
                cameras
                  .filter((c) => c.farmId === farmId && (zoneId == null || c.zoneId === zoneId))
                  .map((c) => <StreamCard key={c.id} cam={c} onDelete={handleDeleteCamera} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">서버 연동</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="text-muted-foreground">현재 API Base</div>
                  <div className="font-mono break-all">{API_BASE}</div>
                    <div className="text-xs text-muted-foreground">
                      백엔드 권장 엔드포인트 예시:
                    <div className="font-mono mt-1">GET /api/farms</div>
                    <div className="font-mono">GET /api/farms/:farmId/snapshot</div>
                    <div className="font-mono">GET /api/farms/:farmId/series?range=1h</div>
                    <div className="font-mono">GET /api/farms/:farmId/events?range=24h</div>
                    <div className="font-mono">WS /ws (events, snapshots push)</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">운영 정책</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>자동 새로고침</span>
                    <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                  </div>
                  <Separator />
                  <div className="text-xs text-muted-foreground">
                    실전 권장:
                    <ul className="list-disc pl-4 space-y-1 mt-2">
                      <li>센서/AI 이벤트는 서버에서 WebSocket으로 push</li>
                      <li>카메라 스트림은 RTSP → HLS/MJPEG 변환 후 제공</li>
                      <li>장비 인증(Device Token) + Rate Limit 적용</li>
                      <li>네트워크 끊김 시 엣지 기기 로컬 큐 저장 후 재전송</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <footer className="pt-6 pb-10 text-xs text-muted-foreground">
          <div>© Aqua-Quad. Edge(AI) + Distributed Sensors + Power Management Dashboard.</div>
        </footer>
      </main>
    </div>
  );
}
