import { getESP32Url, getWsUrl, ENDPOINTS, POLL_INTERVAL_MS } from '../config/esp32';

// ─────────────────────────────────────────────────────────────
// Direct ESP32 <-> browser communication layer.
// No backend, no database. Prefers a persistent WebSocket for
// real-time push; falls back to REST polling if the socket
// can't be established (e.g. firmware without WS support yet).
// ─────────────────────────────────────────────────────────────

export function createESP32Connection({ onSensors, onAttendance, onSystem, onConnectionChange }) {
  let ws = null;
  let pollTimer = null;
  let reconnectTimer = null;
  let mode = 'connecting'; // 'websocket' | 'polling' | 'connecting'
  let stopped = false;

  function setConnected(connected, transport) {
    onConnectionChange?.({ connected, transport });
  }

  function handleMessage(raw) {
    let msg;
    try {
      msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return;
    }
    if (msg.event === 'attendance') {
      onAttendance(msg);
    } else if (msg.event === 'heartbeat' || msg.event === 'system') {
      onSystem(msg);
    } else if ('temperature' in msg || 'mq135' in msg) {
      onSensors(msg);
    }
  }

  function startPolling() {
    mode = 'polling';
    stopPolling();
    const poll = async () => {
      try {
        const res = await fetch(`${getESP32Url()}${ENDPOINTS.sensors}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('bad status');
        const data = await res.json();
        onSensors(data);
        setConnected(true, 'polling');
      } catch {
        setConnected(false, 'polling');
      }
      try {
        const res2 = await fetch(`${getESP32Url()}${ENDPOINTS.attendance}?since=latest`, { cache: 'no-store' });
        if (res2.ok) {
          const events = await res2.json();
          (Array.isArray(events) ? events : [events]).forEach((e) => e && onAttendance(e));
        }
      } catch {
        /* attendance endpoint optional under pure polling mode */
      }
    };
    poll();
    pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  function connectWebSocket() {
    if (stopped) return;
    try {
      ws = new WebSocket(getWsUrl());
    } catch {
      startPolling();
      return;
    }

    ws.onopen = () => {
      mode = 'websocket';
      stopPolling();
      setConnected(true, 'websocket');
    };
    ws.onmessage = (evt) => handleMessage(evt.data);
    ws.onclose = () => {
      setConnected(false, mode);
      if (stopped) return;
      // fall back to REST polling immediately, keep retrying the socket in background
      startPolling();
      reconnectTimer = setTimeout(connectWebSocket, 5000);
    };
    ws.onerror = () => {
      ws?.close();
    };
  }

  connectWebSocket();

  return {
    disconnect() {
      stopped = true;
      stopPolling();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    },
    getMode: () => mode,
  };
}

export async function fetchDeviceInfo() {
  const res = await fetch(`${getESP32Url()}${ENDPOINTS.device}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('device info unavailable');
  return res.json();
}

export async function fetchStatus() {
  const res = await fetch(`${getESP32Url()}${ENDPOINTS.status}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('status unavailable');
  return res.json();
}
