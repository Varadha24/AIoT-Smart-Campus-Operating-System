import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Droplets, Thermometer, Users, Wind, X } from 'lucide-react';

export default function ClassroomPanel({ open, onClose, sensors, studentsPresent, teachersPresent, lastScan, connected, secondsSinceUpdate }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-base-line bg-base-deep p-5 shadow-2xl sm:inset-x-auto sm:right-6 sm:top-1/2 sm:bottom-auto sm:w-[380px] sm:-translate-y-1/2 sm:rounded-2xl sm:border"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-ink-dim">Digital twin · detail view</p>
                <h3 className="font-display text-lg font-semibold text-ink-bright">Classroom 101</h3>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-ink-dim hover:bg-base-surface hover:text-ink-bright">
                <X size={18} />
              </button>
            </div>

            <div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-mono ${
              connected ? 'border-signal-green/30 bg-signal-green/5 text-signal-green' : 'border-signal-red/30 bg-signal-red/5 text-signal-red'
            }`}>
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-signal-green' : 'bg-signal-red'}`} />
              ESP32 {connected ? 'ONLINE' : 'CONNECTION LOST'}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric icon={Thermometer} label="Temperature" value={sensors.temperature != null ? `${sensors.temperature} °C` : '—'} />
              <Metric icon={Droplets} label="Humidity" value={sensors.humidity != null ? `${sensors.humidity} %` : '—'} />
              <Metric icon={Wind} label="MQ135 (raw)" value={sensors.mq135 ?? '—'} />
              <Metric icon={Wind} label="Air Quality" value={sensors.airQuality ?? '—'} accent={aqColor(sensors.airQuality)} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric icon={Users} label="Students Present" value={studentsPresent} />
              <Metric icon={Users} label="Teachers Present" value={teachersPresent} />
            </div>

            <div className="mt-4 rounded-xl border border-base-line bg-base-surface/70 p-3">
              <p className="mb-1 text-[11px] uppercase tracking-wide text-ink-dim">Latest RFID Activity</p>
              {lastScan ? (
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-medium text-ink-bright">{lastScan.name}</span>
                  <span className="font-mono text-xs text-ink-dim">{lastScan.time}</span>
                </div>
              ) : (
                <p className="text-sm text-ink-dim">No scans yet</p>
              )}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-dim">
              <Clock size={12} />
              Last data update: {secondsSinceUpdate != null ? `${secondsSinceUpdate}s ago` : '—'}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function aqColor(aq) {
  if (aq === 'GOOD') return 'text-signal-green';
  if (aq === 'MODERATE') return 'text-signal-amber';
  if (aq === 'POOR') return 'text-signal-red';
  return '';
}

function Metric({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-base-line bg-base-surface/70 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-ink-dim">
        <Icon size={13} />
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className={`font-display text-lg font-semibold ${accent || 'text-ink-bright'}`}>{value}</p>
    </div>
  );
}
