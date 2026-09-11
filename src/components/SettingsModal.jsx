import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Save, X } from 'lucide-react';
import { useState } from 'react';
import { getESP32Url, setESP32Url, getRfidMap, setRfidMap } from '../config/esp32';

export default function SettingsModal({open, onClose, onESP32UrlSaved, }) {
  const [url, setUrl] = useState('');
  const [rfid, setRfid] = useState(getRfidMap());
  const [saved, setSaved] = useState(false);

  function save() {
  const savedUrl = setESP32Url(url);

  // Keep the input synchronized with the cleaned URL
  setUrl(savedUrl);

  setRfidMap(rfid);

  // Tell Dashboard/useESP32 to disconnect from the old ESP32
  // and connect again using the newly saved URL.
  onESP32UrlSaved?.();

  setSaved(true);

  setTimeout(() => {
    setSaved(false);
  }, 1600);
}

  function updateName(uid, field, value) {
    setRfid((prev) => ({ ...prev, [uid]: { ...prev[uid], [field]: value } }));
  }

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
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-base-line bg-base-deep shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-base-line px-5 py-4">
              <h3 className="font-display text-base font-semibold text-ink-bright">Settings &amp; Device Management</h3>
              <button onClick={onClose} className="rounded-lg p-1.5 text-ink-dim hover:bg-base-surface hover:text-ink-bright">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
            <section className="mb-5">
              <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-ink-dim">ESP32 URL</label>
              <div className="flex gap-2">
  <input
    value={url}
    onChange={(e) => setUrl(e.target.value)}
    placeholder="http://192.168.18.202"
    className="min-w-0 flex-1 rounded-lg border border-base-line bg-base-surface px-3 py-2 font-mono text-sm text-ink-bright outline-none focus:border-signal-cyan/50"
  />

  <button
    type="button"
    onClick={save}
    className="flex items-center gap-1.5 rounded-lg bg-signal-cyan/15 px-4 py-2 text-sm font-medium text-signal-cyan transition hover:bg-signal-cyan/25"
  >
    <Save size={15} />
    {saved ? 'Saved' : 'Save'}
  </button>
</div>
              <p className="mt-1.5 text-[11px] text-ink-dim">
                The single source of truth used everywhere in the app. Find this address from your router's client list, or the
                ESP32's serial monitor on boot.
              </p>
              <a
                href={`${url.replace(/\/+$/, '')}/admin`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-signal-cyan hover:underline"
              >
                Open device management page (firmware update, Wi-Fi) <ExternalLink size={12} />
              </a>
            </section>

            <section className="mb-5">
              <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-ink-dim">RFID Tag Registry</label>
              <div className="space-y-2">
                {Object.entries(rfid).map(([uid, info]) => (
                  <div key={uid} className="flex items-center gap-2">
                    <span className="w-16 flex-shrink-0 font-mono text-[11px] text-ink-dim">{uid}</span>
                    <input
                      value={info.name}
                      onChange={(e) => updateName(uid, 'name', e.target.value)}
                      className="flex-1 rounded-lg border border-base-line bg-base-surface px-2.5 py-1.5 text-sm text-ink-bright outline-none focus:border-signal-cyan/50"
                    />
                    <select
                      value={info.type}
                      onChange={(e) => updateName(uid, 'type', e.target.value)}
                      className="rounded-lg border border-base-line bg-base-surface px-2 py-1.5 text-xs text-ink-base outline-none focus:border-signal-cyan/50"
                    >
                      <option value="student">student</option>
                      <option value="teacher">teacher</option>
                    </select>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-dim">Swap in the real UIDs printed by the RC522 once tags are scanned.</p>
            </section>
            </div>

            <div className="border-t border-base-line p-4">
              <button
                onClick={save}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal-cyan/15 py-2.5 text-sm font-medium text-signal-cyan transition hover:bg-signal-cyan/25"
              >
                <Save size={15} />
                {saved ? 'Saved ✓' : 'Save changes'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
