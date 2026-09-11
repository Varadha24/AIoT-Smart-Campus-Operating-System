import { classifyAirQuality, DEFAULT_RFID_MAP } from '../config/esp32';

// Realistic-ish random walk so charts don't look like white noise.
function walk(value, min, max, maxStep) {
  const next = value + (Math.random() * 2 - 1) * maxStep;
  return Math.min(max, Math.max(min, next));
}

export function createDemoEngine({ onSensors, onAttendance, onSystem }) {
  let temperature = 28.2;
  let humidity = 70;
  let mq135 = 320;
  let stopped = false;

  const uids = Object.keys(DEFAULT_RFID_MAP);
  const scanned = new Set();

  function tickSensors() {
    if (stopped) return;
    temperature = walk(temperature, 27, 30, 0.25);
    humidity = walk(humidity, 65, 78, 1.2);
    mq135 = walk(mq135, 250, 500, 12);
    onSensors({
      deviceId: 'classroom_101',
      temperature: Number(temperature.toFixed(1)),
      humidity: Math.round(humidity),
      mq135: Math.round(mq135),
      airQuality: classifyAirQuality(Math.round(mq135)),
      status: 'online',
      timestamp: Date.now(),
    });
  }

  function tickScan() {
    if (stopped) return;
    // Prefer unscanned tags first so demo attendance builds up naturally
    const pool = uids.filter((u) => !scanned.has(u));
    const uid = (pool.length ? pool : uids)[Math.floor(Math.random() * (pool.length ? pool.length : uids.length))];
    scanned.add(uid);
    const info = DEFAULT_RFID_MAP[uid];
    onAttendance({
      event: 'attendance',
      uid,
      name: info.name,
      type: info.type,
      timestamp: Date.now(),
    });
  }

  function tickHeartbeat() {
    if (stopped) return;
    onSystem({ event: 'heartbeat', timestamp: Date.now() });
  }

  const sensorTimer = setInterval(tickSensors, 2500);
  const heartbeatTimer = setInterval(tickHeartbeat, 10000);
  const scanTimer = setInterval(() => {
    // ~35% chance of a scan every cycle → occasional, not constant
    if (Math.random() < 0.35) tickScan();
  }, 6000);

  // Fire once immediately so the UI isn't empty on load
  tickSensors();
  setTimeout(tickScan, 1200);

  return {
    stop() {
      stopped = true;
      clearInterval(sensorTimer);
      clearInterval(heartbeatTimer);
      clearInterval(scanTimer);
    },
    forceScan: tickScan,
  };
}
