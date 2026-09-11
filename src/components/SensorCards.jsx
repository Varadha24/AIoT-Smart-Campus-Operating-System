import { Droplets, Gauge, Thermometer, Wind } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';

const DEMO_ZONE_DATA = {
  'classroom-102': {
    name: 'Classroom 102',
    temperature: 26.8,
    humidity: 58.4,
    mq135: 420,
    airQuality: 'MODERATE',
  },

  'staff-room': {
    name: 'Staff Room',
    temperature: 25.9,
    humidity: 54.2,
    mq135: 310,
    airQuality: 'GOOD',
  },

  'common-area': {
    name: 'Common Area',
    temperature: 30.1,
    humidity: 62.5,
    mq135: 690,
    airQuality: 'MODERATE',
  },

  laboratory: {
    name: 'Laboratory',
    temperature: 24.7,
    humidity: 48.8,
    mq135: 520,
    airQuality: 'MODERATE',
  },

  'main-building': {
    name: 'Main Building',
    temperature: 27.3,
    humidity: 56.9,
    mq135: 360,
    airQuality: 'GOOD',
  },

  entrance: {
    name: 'Entrance',
    temperature: 31.2,
    humidity: 64.1,
    mq135: 740,
    airQuality: 'POOR',
  },
};

const DEFS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer, cls: 'cyan-chart' },
  { key: 'humidity', label: 'Humidity', unit: '%', icon: Droplets, cls: 'blue-chart' },
  
];

export default function SensorCards({
  sensors,
  history,
  selectedBuilding
}) {
  const isClassroom101 = selectedBuilding === 'classroom-101';

const demoData = DEMO_ZONE_DATA[selectedBuilding];

const displaySensors = isClassroom101
  ? sensors
  : demoData || sensors;

const buildingName = isClassroom101
  ? 'Classroom 101'
  : demoData?.name || 'Classroom 101';
  return (
    <section className="telemetry-panel">
      <div className="panel-title-row">
  <div>
    <div className="eyebrow">LIVE TELEMETRY</div>

    <h3>
      Environment - {buildingName}
    </h3>
  </div>

  <span className="panel-live">
    <i /> STREAMING
  </span>
</div>
      <div className="sensor-stack">
        {DEFS.map((def) => (
  <MetricCard
    key={def.key}
    def={def}
    value={displaySensors[def.key]}
    history={history}
    isDemo={!isClassroom101}
  />
))}
        <AirQualityCard
  airQuality={displaySensors.airQuality}
  mq135={displaySensors.mq135}
/>
      </div>
    </section>
  );
}

function MetricCard({
  def,
  value,
  history,
  isDemo
}) {
  const Icon = def.icon;
  const chartData = isDemo
  ? Array.from({ length: 20 }, (_, index) => ({
      [def.key]:
        Number(value) +
        Math.sin(index * 0.8) *
        (
          def.key === 'temperature'
            ? 0.6
            : def.key === 'humidity'
            ? 3
            : 25
        )
    }))
  : history;
  return (
    <div className="metric-card">
      <div className="metric-top"><span><Icon size={13} /> {def.label}</span><b>LIVE</b></div>
      <div className="metric-value">{value != null ? value : '—'}<small>{def.unit}</small></div>
      <div className="metric-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><YAxis hide domain={['dataMin - 2', 'dataMax + 2']} /><Line type="monotone" dataKey={def.key} className={def.cls} stroke="currentColor" strokeWidth={1.8} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
    </div>
  );
}

function AirQualityCard({ airQuality, mq135, mq135History }) {
  const tone = airQuality === 'GOOD' ? 'good' : airQuality === 'POOR' ? 'poor' : 'moderate';
  return (
    <div className={`air-card ${tone}`}>
      <div className="metric-top"><span><Gauge size={13} /> Air quality</span><b>DERIVED</b></div>
      <div className="air-value">{airQuality || '—'}</div>
      
      <div className="air-note">Pollution Index : <strong>{mq135 ?? '—'}</strong> </div>
    </div>
  );
}
