export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ??
  // CRA 호환
  (typeof process !== "undefined" ? (process as any).env?.REACT_APP_API_BASE : undefined) ??
  "http://localhost:8000";

export const REFRESH_MS = 5000;
