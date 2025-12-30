import { API_BASE } from "@/lib/config";
import { AIEvent, CameraItem, CameraType, Farm, FarmId, SensorPoint, SensorSnapshot, Zone, ZoneId } from "@/types";

type FetchOpts = RequestInit & { token?: string };

function authHeaders(token?: string): HeadersInit {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

const BASE_URL = API_BASE;

async function request<T>(path: string, options: FetchOpts = {}): Promise<T | null> {
  try {
    const { token, ...rest } = options;
    const res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(rest.headers || {}),
        ...authHeaders(token),
      },
    });
    if (res.status === 404) return null; // no data yet; surface as null without console noise
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    // 404는 위에서 처리, 여기선 기타 오류만 로그
    console.error("API request failed:", path, err);
    return null;
  }
}

type ApiFarm = { id: number; name: string; location?: string | null };
type ApiZone = { id: number; farm_id: number; name: string };
type ApiCamera = { id: number; farm_id: number; zone_id: number; type: string; name: string; stream_url: string };
type ApiEvent = {
  id: number;
  farm_id: number;
  zone_id: number;
  camera_id?: number | null;
  type: string;
  confidence: number;
  message: string;
  snapshot_url?: string | null;
  created_at: string;
};

const toFarm = (f: ApiFarm): Farm => ({ id: f.id, name: f.name, location: f.location ?? null });
const toZone = (z: ApiZone): Zone => ({ id: z.id, farmId: z.farm_id, name: z.name });
const toCamera = (c: ApiCamera): CameraItem => ({
  id: c.id,
  farmId: c.farm_id,
  zoneId: c.zone_id,
  name: c.name,
  type: c.type as CameraType,
  streamUrl: c.stream_url,
});
const toEvent = (e: ApiEvent): AIEvent => ({
  id: e.id,
  farmId: e.farm_id,
  zoneId: e.zone_id,
  cameraId: e.camera_id ?? null,
  type: e.type as AIEvent["type"],
  confidence: e.confidence,
  message: e.message,
  snapshotUrl: e.snapshot_url ?? null,
  createdAt: e.created_at,
});

export async function fetchFarms(token?: string): Promise<Farm[]> {
  const api = await request<ApiFarm[]>("/api/farms", { token });
  return api?.map(toFarm) ?? [];
}

export async function createFarm(payload: { name: string; location?: string }, token?: string): Promise<Farm> {
  const api = await request<ApiFarm>("/api/admin/farms", {
    method: "POST",
    body: JSON.stringify({ name: payload.name, location: payload.location }),
    token,
  });
  if (!api) throw new Error("Failed to create farm");
  return toFarm(api);
}

export async function deleteFarm(farmId: FarmId, token?: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/farms/${farmId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
  });
  if (!res.ok) throw new Error(`Failed to delete farm (${res.status})`);
}

export async function fetchZones(farmId: FarmId, token?: string): Promise<Zone[]> {
  const api = await request<ApiZone[]>(`/api/farms/${farmId}/zones`, { token });
  return api?.map(toZone) ?? [];
}

export async function fetchSnapshot(farmId: FarmId, zoneId: ZoneId, token?: string): Promise<SensorSnapshot | null> {
  return request<SensorSnapshot>(`/api/farms/${farmId}/zones/${zoneId}/snapshot`, { token });
}

export async function fetchSeries(farmId: FarmId, zoneId: ZoneId, token?: string): Promise<SensorPoint[]> {
  const api = await request<SensorPoint[]>(`/api/farms/${farmId}/zones/${zoneId}/series?range=1h`, { token });
  return api ?? [];
}

export async function fetchEvents(farmId: FarmId, token?: string): Promise<AIEvent[]> {
  const api = await request<ApiEvent[]>(`/api/farms/${farmId}/events?range=24h`, { token });
  return api?.map(toEvent) ?? [];
}

export async function fetchCameras(farmId: FarmId, token?: string): Promise<CameraItem[]> {
  const api = await request<ApiCamera[]>(`/api/farms/${farmId}/cameras`, { token });
  return api?.map(toCamera) ?? [];
}

export async function createCamera(
  payload: { farmId: FarmId; zoneId: ZoneId; name: string; type: CameraType; streamUrl: string },
  token?: string
): Promise<CameraItem> {
  const api = await request<ApiCamera>("/api/admin/cameras", {
    method: "POST",
    token,
    body: JSON.stringify({
      farm_id: payload.farmId,
      zone_id: payload.zoneId,
      type: payload.type,
      name: payload.name,
      stream_url: payload.streamUrl,
    }),
  });
  if (!api) throw new Error("Failed to create camera");
  return toCamera(api);
}

export async function deleteCamera(cameraId: number, token?: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/cameras/${cameraId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
  });
  if (!res.ok) throw new Error(`Failed to delete camera (${res.status})`);
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json() as Promise<{ access_token: string; token_type: string; expires_in: number }>;
}

export async function apiSignup(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Signup failed");
  return res.json();
}
