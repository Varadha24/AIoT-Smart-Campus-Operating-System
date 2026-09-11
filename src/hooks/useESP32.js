import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createESP32Connection } from '../services/esp32Service';
import { createDemoEngine } from '../data/demoData';
import { getRfidMap, classifyAirQuality, OFFLINE_TIMEOUT_MS } from '../config/esp32';

const MAX_HISTORY = 120;   // ~ enough points for the "last hour" chart at demo cadence
const MAX_ACTIVITY = 60;
const MAX_ATTENDANCE = 40;

function fmtTime(ts) {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleTimeString('en-US', { hour12: false });
}

export function useESP32(initialMode = 'demo') {
  const [mode, setMode] = useState(initialMode);
  const [connectionVersion, setConnectionVersion] = useState(0);
  const [connected, setConnected] = useState(false);
  const [transport, setTransport] = useState(null); // 'websocket' | 'polling' | null
  const [sensors, setSensors] = useState({ temperature: null, humidity: null, mq135: null, airQuality: null });
  const [history, setHistory] = useState([]); // { t, temperature, humidity, mq135 }
  const [attendance, setAttendance] = useState([]); // recent scans, newest first
  const [presentSet, setPresentSet] = useState({}); // uid -> {name, type, time}
  const [activity, setActivity] = useState([]); // unified event log
  const [lastUpdate, setLastUpdate] = useState(null);

  const engineRef = useRef(null);
  const offlineTimerRef = useRef(null);
  const rfidMap = useRef(getRfidMap());

  const pushActivity = useCallback((entry) => {
    setActivity((prev) => [{ id: `${Date.now()}-${Math.random()}`, time: fmtTime(entry.timestamp), ...entry }, ...prev].slice(0, MAX_ACTIVITY));
  }, []);

  const armOfflineTimer = useCallback(() => {
    if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    offlineTimerRef.current = setTimeout(() => {
      setConnected(false);
    }, OFFLINE_TIMEOUT_MS);
  }, []);

  const handleSensors = useCallback((data) => {
    const airQuality = data.airQuality || classifyAirQuality(data.mq135 ?? 0);
    setSensors({
      temperature: data.temperature,
      humidity: data.humidity,
      mq135: data.mq135,
      airQuality,
    });
    setLastUpdate(Date.now());
    setConnected(true);
    armOfflineTimer();
    setHistory((prev) => {
      const next = [...prev, { t: fmtTime(data.timestamp), temperature: data.temperature, humidity: data.humidity, mq135: data.mq135 }];
      return next.slice(-MAX_HISTORY);
    });
    pushActivity({ kind: 'sensor', title: 'ENVIRONMENT', detail: `Temperature → ${data.temperature}°C · MQ135 → ${data.mq135} (${airQuality})`, timestamp: data.timestamp });
  }, [armOfflineTimer, pushActivity]);

  const handleAttendance = useCallback((evt) => {
    const known = rfidMap.current[evt.uid];
    const name = evt.name || known?.name || evt.uid;
    const type = evt.type || known?.type || 'unknown';
    const ts = typeof evt.timestamp === 'number' ? (evt.timestamp > 2e10 ? evt.timestamp : evt.timestamp * 1000) : Date.now();

    setLastUpdate(Date.now());
    setConnected(true);
    armOfflineTimer();

    setAttendance((prev) => [{ id: `${ts}-${evt.uid}`, uid: evt.uid, name, type, time: fmtTime(ts) }, ...prev].slice(0, MAX_ATTENDANCE));
    setPresentSet((prev) => ({ ...prev, [evt.uid]: { name, type, time: fmtTime(ts) } }));
    pushActivity({ kind: 'rfid', title: 'RFID SCAN', detail: `${name} entered Classroom 101`, timestamp: ts });
  }, [armOfflineTimer, pushActivity]);

  const handleSystem = useCallback((evt) => {
    setLastUpdate(Date.now());
    setConnected(true);
    armOfflineTimer();
    if (evt.event === 'heartbeat') {
      pushActivity({ kind: 'system', title: 'SYSTEM', detail: 'ESP32 heartbeat received', timestamp: evt.timestamp });
    }
  }, [armOfflineTimer, pushActivity]);

  // (Re)start engine whenever mode changes
  useEffect(() => {
    engineRef.current?.stop?.();
    engineRef.current?.disconnect?.();
    engineRef.current = null;
    setConnected(false);
    setTransport(null);

    if (mode === 'demo') {
      engineRef.current = createDemoEngine({
        onSensors: handleSensors,
        onAttendance: handleAttendance,
        onSystem: handleSystem,
      });
      setConnected(true);
      setTransport('demo');
    } else {
      const conn = createESP32Connection({
        onSensors: handleSensors,
        onAttendance: handleAttendance,
        onSystem: handleSystem,
        onConnectionChange: ({ connected: c, transport: t }) => {
          setConnected(c);
          setTransport(t);
        },
      });
      engineRef.current = conn;
    }

    return () => {
      engineRef.current?.stop?.();
      engineRef.current?.disconnect?.();
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, connectionVersion]);

  const studentsPresent = useMemo(() => Object.values(presentSet).filter((p) => p.type === 'student').length, [presentSet]);
  const teachersPresent = useMemo(() => Object.values(presentSet).filter((p) => p.type === 'teacher').length, [presentSet]);

  const secondsSinceUpdate = useSecondsSince(lastUpdate);

  const reconnectESP32 = useCallback(() => {
  if (mode !== 'live') {
    return;
  }

  // Incrementing this value forces the connection useEffect
  // to clean up the old ESP32 connection and start a new one.
  setConnectionVersion((version) => version + 1);
}, [mode]);

  return {
    mode,
    setMode,
    connected,
    transport,
    sensors,
    history,
    attendance,
    studentsPresent,
    teachersPresent,
    totalPresent: studentsPresent + teachersPresent,
    activity,
    lastUpdate,
    secondsSinceUpdate,
    reconnectESP32,
    forceDemoScan: () => engineRef.current?.forceScan?.(),
  };
}

function useSecondsSince(ts) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  if (!ts) return null;
  return Math.max(0, Math.round((Date.now() - ts) / 1000));
}
