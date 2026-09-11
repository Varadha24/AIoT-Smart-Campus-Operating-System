import { Cpu, Globe, Radio, Settings, Wifi } from 'lucide-react';
import { getESP32Url, DEVICE_ID } from '../config/esp32';
export default function StatusPanel({ mode, connected, transport, secondsSinceUpdate, onOpenSettings }) {
  const rows = [
    { icon: Cpu, label: 'ESP32 NODE', value: connected ? 'ONLINE' : 'CONNECTION LOST', ok: connected },
    { icon: Wifi, label: 'NETWORK', value: connected ? 'CONNECTED' : 'DISCONNECTED', ok: connected },
    { icon: Radio, label: 'TRANSPORT', value: mode === 'demo' ? 'SIMULATED' : transport === 'websocket' ? 'WEBSOCKET' : transport === 'polling' ? 'REST FALLBACK' : 'DISCONNECTED', ok: mode === 'demo' || transport === 'websocket' },
  ];
  return <section className="mini-panel status-panel">
    <div className="panel-title-row"><div><div className="eyebrow">SYSTEM HEALTH</div><h3>ESP32 status</h3></div><Globe size={14} className="title-icon" /></div>
    <div className="status-list">{rows.map((r) => <div className="status-row" key={r.label}><span><r.icon size={12} />{r.label}</span><strong className={r.ok ? 'ok' : 'bad'}>{r.value}</strong></div>)}</div>
    <div className="device-meta"><span>DEVICE ID</span><strong>{DEVICE_ID}</strong><span>IP ADDRESS</span><strong>{mode === 'demo' ? '—' : getESP32Url().replace(/^https?:\/\//, '')}</strong><span>LAST UPDATE</span><strong>{secondsSinceUpdate != null ? `${secondsSinceUpdate}s ago` : '—'}</strong></div>
    <button className="settings-link" onClick={onOpenSettings}><Settings size={12} /> Device management & settings</button>
  </section>;
}
