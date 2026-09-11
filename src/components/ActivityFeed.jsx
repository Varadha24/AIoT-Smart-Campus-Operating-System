import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Cpu, CreditCard, Radio } from 'lucide-react';
const ICONS = { rfid: CreditCard, sensor: Radio, system: Cpu, warning: AlertTriangle };
export default function ActivityFeed({ activity }) {
  return <section className="activity-panel">
    <div className="activity-head"><div><div className="eyebrow">EVENT STREAM</div><h3>Live activity</h3></div><span className="panel-live"><i /> UNIFIED TIMELINE</span></div>
    <div className="activity-list">
      <AnimatePresence initial={false}>
        {activity.slice(0, 7).map((evt) => { const Icon = ICONS[evt.kind] || Cpu; return <motion.div key={evt.id} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="event-row"><span className={`event-icon ${evt.kind}`}><Icon size={12} /></span><span className="event-kind">{evt.title}</span><span className="event-detail">{evt.detail}</span><time>{evt.time}</time></motion.div>; })}
      </AnimatePresence>
      {activity.length === 0 && <div className="empty-state">No events yet.</div>}
    </div>
  </section>;
}
