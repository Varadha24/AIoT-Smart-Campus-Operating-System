import { Radio, Settings, Wifi, WifiOff } from 'lucide-react';
export default function TopBar({ mode, setMode, connected, transport, onOpenSettings }) {
  return <header className="command-header"><div className="header-inner">
    <div className="brand"><div className="brand-mark"><Radio size={17} /><span /></div><div><h1>Smart Campus Operating System </h1></div></div>
    <div className="header-controls"><div className="mode-switch">{['live','demo'].map(m => <button key={m} onClick={() => setMode(m)} className={mode === m ? 'active' : ''}>{m === 'live' ? 'Live mode' : 'Demo mode'}</button>)}</div><div className={`connection ${mode === 'demo' || connected ? 'good' : 'bad'}`}>{mode === 'demo' || connected ? <Wifi size={12}/> : <WifiOff size={12}/>}<span>{mode === 'demo' ? 'SIMULATED' : connected ? (transport === 'websocket' ? 'WEBSOCKET' : 'ONLINE') : 'OFFLINE'}</span></div><button className="icon-button" onClick={onOpenSettings} aria-label="Settings"><Settings size={15}/></button></div>
  </div></header>;
}
