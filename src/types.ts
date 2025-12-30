export type FarmId = number;
export type ZoneId = number;

export type Farm = { id: FarmId; name: string; location?: string | null };
export type Zone = { id: ZoneId; farmId: FarmId; name: string };

export type SensorSnapshot = {
  temperatureC: number | null;
  turbidityNTU: number | null;
  dissolvedOxygenMgL: number | null;
  doSaturationPercent: number | null;
  ph: number | null;
  updatedAt: string;
};

export type SensorPoint = {
  t: string;
  temperatureC: number | null;
  turbidityNTU: number | null;
  dissolvedOxygenMgL: number | null;
  doSaturationPercent: number | null;
  ph: number | null;
};

export type CameraType = "esp_cam" | "cctv" | "ai_cam";

export type CameraItem = {
  id: number;
  farmId: FarmId;
  zoneId: ZoneId;
  name: string;
  type: CameraType;
  streamUrl: string;
};

export type AIEventType = "red_tide" | "jellyfish" | "trash" | "predator" | "normal";

export type AIEvent = {
  id: number;
  farmId: FarmId;
  zoneId: ZoneId;
  cameraId?: number | null;
  type: AIEventType;
  confidence: number;
  message: string;
  snapshotUrl?: string | null;
  createdAt: string;
};

export type RiskLevel = "NORMAL" | "SUSPECT" | "ALERT";

export type ZoneStatus = {
  farmId?: FarmId;
  zoneId?: ZoneId;
  risk: RiskLevel;
  reason: string;
};
