import { useState } from 'react';
import { useESP32 } from '../hooks/useESP32';
import { CAMPUS_LOCATIONS } from '../config/esp32';
import TopBar from '../components/TopBar';
import DigitalTwin from '../components/DigitalTwin';
import ClassroomPanel from '../components/ClassroomPanel';
import SensorCards from '../components/SensorCards';
import AttendancePanel from '../components/AttendancePanel';
import SettingsModal from '../components/SettingsModal';
import Chatbot from '../components/Chatbot';

export default function Dashboard() {
  const state = useESP32('demo');
  const [selectedBuilding, setSelectedBuilding] = useState('classroom-101');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const panelOpen = selectedBuilding === 'classroom-101';

  return <div className="app-shell">
    <TopBar mode={state.mode} setMode={state.setMode} connected={state.connected} transport={state.transport} onOpenSettings={() => setSettingsOpen(true)} />
    {state.mode === 'demo' && <div className="demo-strip"><span>DEMO MODE</span> Simulated telemetry is running in the browser. Switch to Live Mode when the ESP32 is on the network.</div>}
    <main className="dashboard-shell">
      
      <div className="primary-grid">
        <DigitalTwin locations={CAMPUS_LOCATIONS} onSelect={setSelectedBuilding} selectedId={selectedBuilding} deviceOnline={state.connected} pulseSignal={state.attendance[0]?.id} sensors={state.sensors} />
        <aside className="telemetry-rail">
  <SensorCards
    sensors={state.sensors}
    history={state.history}
    selectedBuilding={selectedBuilding}
  />

  <AttendancePanel
    attendance={state.attendance}
    studentsPresent={state.studentsPresent}
    teachersPresent={state.teachersPresent}
  />
</aside>
      </div>
    </main>
    <ClassroomPanel open={panelOpen} onClose={() => setSelectedBuilding(null)} sensors={state.sensors} studentsPresent={state.studentsPresent} teachersPresent={state.teachersPresent} lastScan={state.attendance[0]} connected={state.connected} secondsSinceUpdate={state.secondsSinceUpdate} />
    <SettingsModal
    open={settingsOpen}
    onClose={() => setSettingsOpen(false)}
    onESP32UrlSaved={state.reconnectESP32}
   />
    <Chatbot
    sensors={state.sensors}
    history={state.history}
    attendance={state.attendance}
    studentsPresent={state.studentsPresent}
    teachersPresent={state.teachersPresent}
    connected={state.connected}
    mode={state.mode}
    secondsSinceUpdate={state.secondsSinceUpdate}
    />

  </div>;
}
