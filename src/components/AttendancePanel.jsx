import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, GraduationCap, UserRound } from 'lucide-react';

export default function AttendancePanel({ attendance, studentsPresent, teachersPresent }) {
  return (
    <section className="mini-panel attendance-panel">
      <div className="panel-title-row"><div><div className="eyebrow"></div><h3>Live attendance</h3></div><CreditCard size={15} className="title-icon" /></div>
      <div className="attendance-counts"><Count label="STUDENTS" value={studentsPresent} /><Count label="TEACHERS" value={teachersPresent} /><Count label="TOTAL" value={studentsPresent + teachersPresent} accent /></div>
      <div className="recent-label">RECENT SCANS</div>
      <div className="scan-list">
        <AnimatePresence initial={false}>
          {attendance.length === 0 && <div className="empty-state">Waiting for RFID activity…</div>}
          {attendance.slice(0, 5).map((entry) => (
            <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="scan-row">
              <span className="scan-dot" /><span className="avatar">{entry.type === 'teacher' ? <GraduationCap size={13} /> : <UserRound size={13} />}</span><div className="scan-person"><strong>{entry.name}</strong><small>{entry.type} · Classroom 101</small></div><time>{entry.time}</time>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
function Count({ label, value, accent }) { return <div className={`count-box ${accent ? 'accent' : ''}`}><strong>{value}</strong><span>{label}</span></div>; }
