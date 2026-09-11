import { motion } from 'framer-motion';
import { DoorOpen, FlaskConical, GraduationCap, Radio, Trees, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const BUILDINGS = {
  entrance: { x: 120, y: 410, w: 170, h: 80, depth: 34, type: 'GATE', icon: DoorOpen },
  'main-building': { x: 345, y: 300, w: 250, h: 120, depth: 48, type: 'BUILDING', icon: GraduationCap },
  'classroom-101': { x: 570, y: 390, w: 230, h: 120, depth: 46, type: 'IOT NODE', icon: Radio, monitored: true },
  'classroom-102': { x: 760, y: 245, w: 150, h: 92, depth: 38, type: 'BUILDING', icon: GraduationCap },
  'laboratory': { x: 675, y: 110, w: 180, h: 96, depth: 38, type: 'BUILDING', icon: FlaskConical },
  'staff-room': { x: 380, y: 100, w: 170, h: 82, depth: 34, type: 'BUILDING', icon: Users },
  'common-area': { x: 120, y: 155, w: 190, h: 85, depth: 34, type: 'OPEN AREA', icon: Trees },
};

const ROADS = [
  'M80 525 L300 525 L445 465 L900 465',
  'M300 525 L430 405 L430 65',
  'M430 405 L690 260 L950 260',
  'M430 405 L650 465 L875 330',
];

export default function DigitalTwin({ locations, onSelect, selectedId, deviceOnline, pulseSignal }) {
  const byId = useMemo(() => Object.fromEntries(locations.map((l) => [l.id, l])), [locations]);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (!pulseSignal) return;
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 1200);
    return () => clearTimeout(t);
  }, [pulseSignal]);

  return (
    <section className="twin-panel">
      <div className="twin-panel-head">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /></div>
          <h2>Live Campus Digital Twin</h2>
          <p>Interactive site model · select a zone to inspect its digital state</p>
        </div>
        <div className="twin-head-meta">
          <span><i className="live-dot" /> REAL-TIME</span>
          <span>7 ZONES</span>
          <span>1 ACTIVE NODE</span>
        </div>
      </div>

      <div className="twin-canvas">
        <div className="twin-grid" />
        <div className="map-orbit orbit-a" />
        <div className="map-orbit orbit-b" />

        <svg viewBox="0 0 1000 600" className="campus-svg" role="img" aria-label="Smart campus digital twin">
          <defs>
            <linearGradient id="road" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e2e8f0" />
              <stop offset="1" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="buildingTop" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e7edf3" />
              <stop offset="1" stopColor="#cfd8e3" />
            </linearGradient>
            <linearGradient id="nodeTop" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#bde8ee" />
              <stop offset="1" stopColor="#8ed1dc" />
            </linearGradient>
            <filter id="cyanGlow"><feGaussianBlur stdDeviation="8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <filter id="softGlow"><feGaussianBlur stdDeviation="3" /></filter>
          </defs>

          <g className="roads">
            {ROADS.map((d, i) => <path key={i} d={d} className="road" />)}
            {ROADS.map((d, i) => <path key={`l-${i}`} d={d} className="road-line" />)}
          </g>

          <g className="site-details">
            <path d="M110 310 L300 310" className="site-line" />
            <path d="M110 330 L300 330" className="site-line" />
            <path d="M875 115 L960 115" className="site-line" />
            <path d="M875 135 L940 135" className="site-line" />
            <circle cx="92" cy="92" r="26" className="site-ring" />
            <text x="92" y="97" textAnchor="middle" className="north-label">N</text>
          </g>

          {locations.map((loc) => {
            const b = BUILDINGS[loc.id];
            if (!b) return null;
            const selected = selectedId === loc.id;
            const monitored = b.monitored;
            const online = monitored && deviceOnline;
            const top = `${b.x},${b.y} ${b.x + b.w / 2},${b.y - b.depth} ${b.x + b.w},${b.y} ${b.x + b.w / 2},${b.y + b.depth}`;
            const left = `${b.x},${b.y} ${b.x + b.w / 2},${b.y + b.depth} ${b.x + b.w / 2},${b.y + b.h + b.depth} ${b.x},${b.y + b.h}`;
            const right = `${b.x + b.w},${b.y} ${b.x + b.w / 2},${b.y + b.depth} ${b.x + b.w / 2},${b.y + b.h + b.depth} ${b.x + b.w},${b.y + b.h}`;
            const labelX = b.x + b.w / 2;
            const labelY = b.y - b.depth - 13;
            return (
              <g
                key={loc.id}
                className={`building ${selected ? 'is-selected' : ''} ${monitored ? 'is-monitored' : ''} ${online ? 'is-online' : 'is-offline'}`}
                onClick={() => onSelect(loc.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(loc.id)}
              >
                {monitored && online && <polygon points={top} className="node-glow" filter="url(#softGlow)" />}
                <polygon points={left} className="building-side left" />
                <polygon points={right} className="building-side right" />
                <polygon points={top} className="building-top" />
                <g className="building-lines">
                  <line x1={b.x + 24} y1={b.y + 18} x2={b.x + b.w / 2} y2={b.y - b.depth + 14} />
                  <line x1={b.x + b.w - 24} y1={b.y + 18} x2={b.x + b.w / 2} y2={b.y - b.depth + 14} />
                </g>
                <g className="building-windows">
                  {[0, 1, 2].map((n) => (
                    <rect key={n} x={b.x + 22 + n * Math.min(54, b.w / 4)} y={b.y + b.h * 0.42} width="18" height="11" rx="2" />
                  ))}
                </g>
                {monitored && (
                  <g className="node-marker">
                    <circle cx={b.x + b.w / 2} cy={b.y - b.depth - 6} r="7" className="node-core" />
                    {online && <circle cx={b.x + b.w / 2} cy={b.y - b.depth - 6} r="16" className="node-pulse" />}
                  </g>
                )}
                
              </g>
            );
          })}
          <g className="building-label-layer">

  {locations.map((loc) => {
    const b = BUILDINGS[loc.id];

    if (!b) return null;

    const monitored = b.monitored;
    const online = monitored && deviceOnline;

    const labelX = b.x + b.w / 2;
    const labelY = b.y - b.depth - 13;

    return (
      <g
        key={`label-${loc.id}`}
        className="building-label"
        pointerEvents="none"
      >
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
        >
          {loc.name.toUpperCase()}
        </text>

        {monitored && (
          <text
            x={labelX}
            y={labelY + 18}
            textAnchor="middle"
            className={online ? 'online-text' : 'offline-text'}
          >
            {online
              ? '● ESP32 LIVE'
              : '● CONNECTION LOST'}
          </text>
        )}
      </g>
    );
  })}

</g>

          
        </svg>

      
        <div className="scale-indicator"><span>50 M</span><i /><small>SITE SCALE</small></div>
        <div className="map-coords">10.214° N&nbsp;&nbsp; 76.357° E</div>

        {pulsing && (
          <motion.div className="scan-flare" initial={{ opacity: 0, scale: .6 }} animate={{ opacity: 1, scale: 1.3 }} transition={{ duration: .9 }} />
        )}
      </div>

      <div className="twin-footer">
      </div>
    </section>
  );
}
