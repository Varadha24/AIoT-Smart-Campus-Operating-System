// ─────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for the ESP32's network address.
// Change this one value (or override it from the Settings panel,
// which persists to localStorage) — nothing else in the app
// should ever hardcode an IP or hostname.
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'smartcampus.esp32Url';

const DEFAULT_ESP32_URL = 'http://192.168.18.202';

function readStoredUrl() {
  if (typeof window === 'undefined') return DEFAULT_ESP32_URL;
  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_ESP32_URL;
}

export function getESP32Url() {
  return readStoredUrl().replace(/\/+$/, '');
}

export function setESP32Url(url) {
  const clean = url.trim().replace(/\/+$/, '');

  window.localStorage.setItem(STORAGE_KEY, clean);

  return clean;
}

export function getWsUrl() {
  const httpUrl = getESP32Url();
  return httpUrl.replace(/^http/, 'ws') + '/ws';
}

export const ENDPOINTS = {
  status: '/api/status',
  sensors: '/api/sensors',
  attendance: '/api/attendance',
  device: '/api/device',
};

// How often to poll REST endpoints when WebSocket is unavailable (ms)
export const POLL_INTERVAL_MS = 3000;

// If no data arrives within this window, the device is considered offline
export const OFFLINE_TIMEOUT_MS = 8000;

// ─────────────────────────────────────────────────────────────
// RFID tag registry — maps a UID to a human identity.
// The real UIDs from the physical RC522 reader go here once known.
// Editable at runtime from the Settings panel (persisted to localStorage).
// ─────────────────────────────────────────────────────────────
const RFID_STORAGE_KEY = 'smartcampus.rfidMap';

export const DEFAULT_RFID_MAP = {
  UID_1: { name: 'Student 1', type: 'student' },
  UID_2: { name: 'Student 2', type: 'student' },
  UID_3: { name: 'Student 3', type: 'student' },
  UID_4: { name: 'Student 4', type: 'student' },
  UID_5: { name: 'Teacher 1', type: 'teacher' },
  UID_6: { name: 'Teacher 2', type: 'teacher' },
  UID_7: { name: 'Teacher 3', type: 'teacher' },
};

export function getRfidMap() {
  if (typeof window === 'undefined') return DEFAULT_RFID_MAP;
  try {
    const raw = window.localStorage.getItem(RFID_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_RFID_MAP;
  } catch {
    return DEFAULT_RFID_MAP;
  }
}

export function setRfidMap(map) {
  window.localStorage.setItem(RFID_STORAGE_KEY, JSON.stringify(map));
}

// Air-quality classification for the RAW MQ135 analog value.
// This is NOT calibrated ppm — just a project-specific bucket.
export const MQ135_THRESHOLDS = { good: 400, moderate: 700 };

export function classifyAirQuality(raw) {
  if (raw <= MQ135_THRESHOLDS.good) return 'GOOD';
  if (raw <= MQ135_THRESHOLDS.moderate) return 'MODERATE';
  return 'POOR';
}

export const CAMPUS_LOCATIONS = [
  { id: 'entrance', name: 'Entrance', kind: 'gate' },
  { id: 'main-building', name: 'Main Building', kind: 'building' },
  { id: 'classroom-101', name: 'Classroom 101', kind: 'monitored' },
  { id: 'classroom-102', name: 'Classroom 102', kind: 'building' },
  { id: 'laboratory', name: 'Laboratory', kind: 'building' },
  { id: 'staff-room', name: 'Staff Room', kind: 'building' },
  { id: 'common-area', name: 'Common Area', kind: 'open' },
];

export const DEVICE_ID = 'classroom_101';
