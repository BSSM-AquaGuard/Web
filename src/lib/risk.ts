import { SensorSnapshot, ZoneStatus } from "@/types";

export function inferRiskFromSnapshot(s: SensorSnapshot | null): ZoneStatus | null {
  if (!s) return null;

  const turb = s.turbidityNTU;
  const dox = s.dissolvedOxygenMgL;
  const doPercent = s.doSaturationPercent;
  const temp = s.temperatureC;
  const ph = s.ph;

  // 데이터가 비어있으면 리스크 계산 불가
  if (turb == null && dox == null && temp == null && ph == null) return null;

  let score = 0;
  if (turb != null) {
    if (turb >= 12) score += 2;
    else if (turb >= 9) score += 1;
  }
  if (doPercent != null) {
    if (doPercent <= 70) score += 2;
    else if (doPercent <= 80) score += 1;
  } else if (dox != null) {
    if (dox <= 5.5) score += 2;
    else if (dox <= 6.0) score += 1;
  }
  if (temp != null) {
    if (temp >= 26 || temp <= 10) score += 2;
  }
  if (ph != null) {
    if (ph <= 6.8 || ph >= 8.4) score += 1;
  }

  if (score >= 4) return { risk: "ALERT", reason: "탁도/DO 이상 수치 감지" };
  if (score >= 2) return { risk: "SUSPECT", reason: "경계 수치(추가 확인 필요)" };
  return { risk: "NORMAL", reason: "정상 범위" };
}
