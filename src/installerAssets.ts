// This file is auto-generated to support the "Download Installer" feature.
// It bundles the source code of the UI so users can run it locally without a bundler.

// NOTE: We inline the source code for the new components here to ensure the installer works.

export const getProjectFiles = () => {
  return {
    "src/index.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    "src/metadata.json": `{
  "name": "OpenClaw Game OS",
  "description": "A 2.5D Isometric Spatial Operating System for OpenClaw agents.",
  "requestFramePermissions": []
}`,
    "src/types.ts": `import React from 'react';
export type Language = 'en' | 'zh';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'mock';
export type ConnectionMode = 'local' | 'remote';
export type AgentStatus = 'idle' | 'processing' | 'error';
export type HouseId = 'world' | 'skills' | 'memory' | 'tasks' | 'soul' | 'console' | 'settings';

export interface HouseConfig {
  id: HouseId;
  name: string;
  icon: any;
  component: React.FC;
  description?: string;
  themeColor?: string;
}

export interface Skill {
  id: string;
  name: string;
  name_zh: string;
  iconName: string;
  description: string;
  enabled: boolean;
  x: number;
  y: number;
}

export interface LogMessage {
  id: string;
  timestamp: number;
  sender: 'user' | 'agent' | 'system';
  text: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Settings {
  mode: ConnectionMode;
  apiToken: string;
  language: Language;
  wsUrl: string;
}`,
    "src/store.ts": `import { create } from 'zustand';
import { AgentStatus, ConnectionStatus, Language, LogMessage, Position, Settings, Skill, HouseId } from './types';
import { INITIAL_SKILLS, WS_URL } from './constants';

interface GameState {
  playerPos: Position;
  targetPos: Position;
  agentStatus: AgentStatus;
  skills: Skill[];
  logs: LogMessage[];
  connectionStatus: ConnectionStatus;
  settings: Settings;
  zoomLevel: number;
  currentView: HouseId;
  setPlayerPos: (pos: Position) => void;
  setTargetPos: (pos: Position) => void;
  setAgentStatus: (status: AgentStatus) => void;
  addLog: (log: Omit<LogMessage, 'id' | 'timestamp'>) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  toggleSkill: (id: string) => void;
  setZoomLevel: (zoom: number) => void;
  setCurrentView: (view: HouseId) => void;
}

export const useGameStore = create<GameState>((set) => ({
  playerPos: { x: 0, y: 0 },
  targetPos: { x: 0, y: 0 },
  agentStatus: 'idle',
  skills: INITIAL_SKILLS,
  logs: [{ id: 'init', timestamp: Date.now(), sender: 'system', text: 'System initialized.' }],
  connectionStatus: 'disconnected',
  settings: { mode: 'local', apiToken: '', language: 'en', wsUrl: WS_URL },
  zoomLevel: 1.0,
  currentView: 'world',
  setPlayerPos: (pos) => set({ playerPos: pos }),
  setTargetPos: (pos) => set({ targetPos: pos }),
  setAgentStatus: (status) => set({ agentStatus: status }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, { ...log, id: Math.random().toString(36).substring(7), timestamp: Date.now() }].slice(-50) })),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
  toggleSkill: (id) => set((state) => ({ skills: state.skills.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s) })),
  setZoomLevel: (zoom) => set({ zoomLevel: Math.max(0.5, Math.min(2.0, zoom)) }),
  setCurrentView: (view) => set({ currentView: view }),
}));`,
    "src/houses/registry.tsx": `import { Terminal, Settings, Home, Brain, Scroll, ListTodo, Ghost } from 'lucide-react';
import { HouseConfig } from '../types';
import { WorldView } from '../components/WorldView';
import { SkillHouse } from '../components/houses/SkillHouse';
import { MemoryHouse } from '../components/houses/MemoryHouse';
import { TaskHouse } from '../components/houses/TaskHouse';
import { SoulHouse } from '../components/houses/SoulHouse';
import { ConsoleView } from '../components/views/ConsoleView';
import { SettingsView } from '../components/views/SettingsView';

export const HOUSES: HouseConfig[] = [
  { id: 'world', name: 'World', icon: Home, component: WorldView },
  { id: 'skills', name: 'Skills', icon: Brain, component: SkillHouse },
  { id: 'memory', name: 'Memory', icon: Scroll, component: MemoryHouse },
  { id: 'tasks', name: 'Tasks', icon: ListTodo, component: TaskHouse },
  { id: 'soul', name: 'Soul', icon: Ghost, component: SoulHouse },
  { id: 'console', name: 'Console', icon: Terminal, component: ConsoleView },
  { id: 'settings', name: 'Settings', icon: Settings, component: SettingsView },
];`,
    "src/App.tsx": `import React from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Dock } from './components/Dock';
import { TopBar } from './components/TopBar';
import { useGameStore } from './store';
import { HOUSES } from './houses/registry';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const { currentView } = useGameStore();
  const activeHouse = HOUSES.find(h => h.id === currentView);
  const ActiveComponent = activeHouse?.component;

  return (
    <div className="relative w-screen h-screen bg-gray-950 overflow-hidden font-sans select-none text-white">
       <div className="absolute inset-0 z-0">
         <GameCanvas />
         <AnimatePresence>{currentView !== 'world' && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 bg-gray-950/80 backdrop-blur-md z-10" />)}</AnimatePresence>
       </div>
       <TopBar />
       <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center p-6 pb-28">
          <AnimatePresence mode="wait">
             {currentView !== 'world' && ActiveComponent && (
                <motion.div key={currentView} initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.05, y: -20, filter: 'blur(10px)' }} transition={{ type: "spring", stiffness: 200, damping: 25 }} className="pointer-events-auto w-full max-w-6xl h-full max-h-[85vh] bg-black/40 border border-white/5 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl">
                   <ActiveComponent />
                </motion.div>
             )}
          </AnimatePresence>
       </div>
       <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"><Dock /></div>
    </div>
  );
}
export default App;`,
    "src/components/WorldView.tsx": `import React from 'react';
export const WorldView: React.FC = () => { return null; };`,
    "src/components/Dock.tsx": `import React from 'react';
import { useGameStore } from '../store';
import { HOUSES } from '../houses/registry';
import { motion } from 'framer-motion';
import { HouseId } from '../types';

export const Dock: React.FC = () => {
  const { currentView, setCurrentView } = useGameStore();

  return (
    <div className="flex gap-4 p-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl shadow-2xl">
      {HOUSES.map((house) => {
        const Icon = house.icon;
        const isActive = currentView === house.id;
        
        return (
          <button key={house.id} onClick={() => setCurrentView(house.id as HouseId)} className={\`relative p-3 rounded-full transition-all duration-300 group \${isActive ? 'bg-white/10 text-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
            <Icon size={24} />
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-md">{house.name}</span>
            {isActive && (<motion.div layoutId="active-dot" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]" />)}
          </button>
        );
      })}
    </div>
  );
};`,
    "src/components/houses/SkillHouse.tsx": `import React, { useMemo } from 'react';
import { useGameStore } from '../../store';
import { Brain, Globe, HardDrive, Code, Terminal, Mail, Cpu, Box, Database, Cloud, Lock, Zap, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MAP_SIZE } from '../../constants';

const IconMap: any = { Globe, HardDrive, Code, Terminal, Mail, Cpu, Brain, Box, Database, Cloud, Lock };

export const SkillHouse: React.FC = () => {
  const { skills } = useGameStore();
  const sortedSkills = useMemo(() => [...skills].sort((a, b) => a.x - b.x), [skills]);
  const normalize = (val: number) => 15 + (val / MAP_SIZE) * 70;
  
  const connections = useMemo(() => {
    const lines: {x1: number, y1: number, x2: number, y2: number, id: string}[] = [];
    sortedSkills.forEach((s1, i) => {
         if (i < 2) lines.push({ x1: 50, y1: 50, x2: normalize(s1.x), y2: normalize(s1.y), id: \`core-\${s1.id}\` });
         const nextSkill = sortedSkills.find((s, idx) => idx > i && s.x > s1.x);
         if (nextSkill) {
             lines.push({ x1: normalize(s1.x), y1: normalize(s1.y), x2: normalize(nextSkill.x), y2: normalize(nextSkill.y), id: \`\${s1.id}-\${nextSkill.id}\` });
         }
    });
    return lines;
  }, [sortedSkills]);

  return (
    <div className="w-full h-full p-8 flex flex-col bg-gray-950 text-white overflow-hidden relative selection:bg-cyan-500/30">
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: \`linear-gradient(to right, #083344 1px, transparent 1px), linear-gradient(to bottom, #083344 1px, transparent 1px)\`, backgroundSize: '40px 40px', maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)' }} />
      <div className="relative z-10 flex justify-between items-center mb-6 border-b border-cyan-900/50 pb-4">
          <h2 className="text-3xl font-bold font-mono text-cyan-400 flex items-center gap-3 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"><Share2 size={32} /> NEURAL LINK</h2>
          <div className="text-right"><div className="text-xs font-mono text-cyan-600 tracking-widest">DAG.VISUALIZER</div><div className="text-xl font-bold font-mono text-white flex items-center gap-2 justify-end"><span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" /> ONLINE</div></div>
      </div>
      <div className="flex-1 relative rounded-xl bg-black/40 shadow-inner border border-cyan-900/30 overflow-hidden backdrop-blur-sm">
         <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
             <defs><linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0e7490" stopOpacity="0.05" /><stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" /><stop offset="100%" stopColor="#0e7490" stopOpacity="0.05" /></linearGradient></defs>
             {connections.map((line, i) => {
                 const dist = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2));
                 const cpOffset = dist * 0.5;
                 const d = \`M \${line.x1}% \${line.y1}% C \${line.x1 + cpOffset/2}% \${line.y1}%, \${line.x2 - cpOffset/2}% \${line.y2}%, \${line.x2}% \${line.y2}%\`;
                 return (<g key={line.id}><path d={d} fill="none" stroke="#164e63" strokeWidth="1" strokeOpacity="0.5" /><motion.path d={d} fill="none" stroke="url(#lineGradient)" strokeWidth="2" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 2.5, repeat: Infinity, repeatType: "loop", ease: "linear", delay: i * 0.3 }} /></g>)
             })}
         </svg>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"><div className="w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" /></div>
         {sortedSkills.map((skill, i) => {
             const Icon = IconMap[skill.iconName] || Box;
             const left = normalize(skill.x);
             const top = normalize(skill.y);
             const isEnabled = skill.enabled;
             return (
                 <motion.div key={skill.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1, type: "spring" }} className="absolute z-20" style={{ left: \`\${left}%\`, top: \`\${top}%\` }}>
                     <div className="relative group -translate-x-1/2 -translate-y-1/2">
                         <div className={\`w-16 h-16 flex items-center justify-center transition-all duration-300 relative clip-hexagon \${isEnabled ? 'bg-gray-900 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]' : 'bg-gray-900/50 text-gray-600 grayscale'}\`} style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                            <div className="absolute inset-[2px] bg-gray-950 z-10" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} /><div className={\`absolute inset-0 z-0 \${isEnabled ? 'bg-cyan-500' : 'bg-gray-800'}\`} /><div className="relative z-20">{isEnabled ? <Icon size={24} /> : <Lock size={20} />}</div>
                         </div>
                         {isEnabled && (<div className="absolute inset-[-4px] border-2 border-cyan-500/30 rounded-full animate-ping pointer-events-none" />)}
                         <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-52 bg-gray-900/90 border border-cyan-500/30 text-white p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 scale-95 group-hover:scale-100 backdrop-blur-xl shadow-2xl">
                             <div className="text-[10px] font-mono text-cyan-500 mb-1 tracking-widest">MODULE: {skill.id.toUpperCase()}</div><div className="font-bold text-base mb-1 text-white">{skill.name}</div><div className="text-xs text-gray-400 leading-relaxed">{skill.description}</div><div className="mt-3 flex items-center gap-1 text-[10px] font-mono border-t border-white/10 pt-2"><Zap size={10} className={isEnabled ? "text-green-400" : "text-gray-600"} /> <span className={isEnabled ? "text-green-400" : "text-gray-500"}>{isEnabled ? 'SYSTEM ONLINE' : 'OFFLINE'}</span></div>
                         </div>
                         <div className={\`absolute top-16 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wider mt-2 whitespace-nowrap px-2 py-0.5 rounded \${isEnabled ? 'text-cyan-200 bg-cyan-900/30' : 'text-gray-600'}\`}>{skill.name.toUpperCase()}</div>
                     </div>
                 </motion.div>
             );
         })}
      </div>
    </div>
  );
};`,
    "src/components/houses/MemoryHouse.tsx": `import React, { useState, useEffect, useRef } from 'react';
import { Scroll, Database, Clock, Hash, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const MatrixRain = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;
        canvas.width = canvas.parentElement?.clientWidth || 300;
        canvas.height = canvas.parentElement?.clientHeight || 600;
        const letters = "010101XYZA";
        const fontSize = 12;
        const columns = canvas.width / fontSize;
        const drops: number[] = [];
        for(let x=0; x<columns; x++) drops[x] = 1;
        const draw = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#10b981";
            ctx.font = fontSize + "px monospace";
            for(let i=0; i<drops.length; i++) {
                const text = letters.charAt(Math.floor(Math.random()*letters.length));
                ctx.fillText(text, i*fontSize, drops[i]*fontSize);
                if(drops[i]*fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        };
        const interval = setInterval(draw, 50);
        return () => clearInterval(interval);
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 opacity-10 pointer-events-none" />;
};

const MEMORIES = [
    { id: 'm1', time: '10:42:01', date: '2023-10-24', title: 'System Initialization', type: 'system', details: 'Kernel booted successfully. Loaded 5 modules into active memory.' },
    { id: 'm2', time: '10:45:15', date: '2023-10-24', title: 'User Login', type: 'user', details: 'User authenticated via local gateway token. Session established.' },
    { id: 'm3', time: '11:02:33', date: '2023-10-24', title: 'Python Env Setup', type: 'agent', details: 'Sandboxed environment prepared. Installed numpy, pandas from local cache.' },
    { id: 'm4', time: '11:20:00', date: '2023-10-24', title: 'Task Execution', type: 'agent', details: 'Executed "scrape_weather.py". Returned 200 OK with 15kb of data.' },
    { id: 'm5', time: '12:15:00', date: '2023-10-24', title: 'Memory Optimization', type: 'system', details: 'Garbage collection run. Freed 45MB of heap space.' },
];

export const MemoryHouse: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedMemory = MEMORIES.find(m => m.id === selectedId);

  return (
    <div className="w-full h-full p-6 flex flex-col bg-gray-950 text-white overflow-hidden relative">
      <MatrixRain />
      <div className="relative z-10 flex justify-between items-center mb-6 border-b border-gray-800 pb-4"><h2 className="text-3xl font-bold font-mono text-emerald-400 flex items-center gap-3 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"><Scroll size={32} /> MEMORY CHRONICLE</h2><div className="text-right"><div className="text-xs font-mono text-gray-500">ANIMUS.V2</div><div className="text-xl font-bold font-mono text-white">SYNCED</div></div></div>
      <div className="flex-1 flex gap-6 overflow-hidden relative z-10">
          <div className="w-1/3 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent border-r border-white/5 relative">
             <div className="absolute top-0 bottom-0 left-[19px] w-[2px] bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent" />
             <div className="space-y-6 py-4 pl-1">
                 {MEMORIES.map((mem) => (
                     <motion.div key={mem.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => setSelectedId(mem.id)} className={clsx("relative pl-10 pr-4 py-4 rounded-r-xl cursor-pointer transition-all duration-300 border-l-2 group", selectedId === mem.id ? "bg-emerald-900/20 border-emerald-400" : "bg-transparent border-transparent hover:bg-white/5")}>
                         <div className={clsx("absolute left-[14px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all shadow-[0_0_10px_currentColor]", selectedId === mem.id ? "bg-emerald-400 border-white scale-110" : "bg-gray-900 border-emerald-800 group-hover:border-emerald-500")} />
                         <div className="flex justify-between items-start mb-1"><span className="text-xs font-mono text-emerald-500/80">{mem.time}</span><span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{mem.type}</span></div><div className={clsx("font-bold text-sm", selectedId === mem.id ? "text-white" : "text-gray-400")}>{mem.title}</div>
                     </motion.div>
                 ))}
             </div>
          </div>
          <div className="flex-1 relative flex items-center justify-center">
             <AnimatePresence mode="wait">
                 {selectedMemory ? (
                     <motion.div key={selectedMemory.id} initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }} transition={{ duration: 0.3 }} className="w-full max-w-lg bg-gray-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                         <div className="flex items-center gap-4 mb-6"><div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.1)]"><Hash size={32} /></div><div><h1 className="text-2xl font-bold text-white">{selectedMemory.title}</h1><div className="text-xs font-mono text-emerald-500 flex items-center gap-2 mt-1"><Clock size={12} /> {selectedMemory.date} {selectedMemory.time}</div></div></div>
                         <div className="space-y-4"><div className="p-5 bg-black/40 rounded-lg border border-white/5 text-sm text-gray-300 font-mono leading-relaxed">{selectedMemory.details}</div><div className="grid grid-cols-2 gap-4"><div className="p-3 bg-white/5 rounded-lg border border-white/5"><div className="text-[10px] text-gray-500 uppercase mb-1">Index ID</div><div className="text-sm font-mono text-white">0x{selectedMemory.id.toUpperCase()}F2A</div></div><div className="p-3 bg-white/5 rounded-lg border border-white/5"><div className="text-[10px] text-gray-500 uppercase mb-1">Source</div><div className="text-sm font-mono text-white">VECTOR_DB_SHARD_1</div></div></div></div>
                         <div className="mt-8 flex justify-end"><button className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border border-emerald-500/30 px-4 py-2 rounded hover:bg-emerald-500/10">Retrieve Raw Data <ChevronRight size={14} /></button></div>
                     </motion.div>
                 ) : (<div className="text-center opacity-30 select-none"><Database size={64} className="mx-auto mb-4 text-emerald-900" /><p className="font-mono text-emerald-700 tracking-widest">SELECT DATA FRAGMENT</p></div>)}
             </AnimatePresence>
          </div>
      </div>
    </div>
  );
};`,
    "src/components/houses/TaskHouse.tsx": `import React from 'react';
import { ListTodo, Play, Clock, CheckCircle2, MoreHorizontal, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const Waveform = () => (
    <div className="flex items-end gap-[2px] h-4">
        {[...Array(6)].map((_, i) => (<motion.div key={i} className="w-1 bg-yellow-400 rounded-full" animate={{ height: ["20%", "100%", "20%"] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }} />))}
    </div>
);

interface Task { id: string; title: string; priority: 'high' | 'medium' | 'low'; tags: string[]; }
const TASKS_PENDING: Task[] = [{ id: 't1', title: 'Analyze Stock Market Data', priority: 'high', tags: ['finance', 'python'] }, { id: 't2', title: 'Backup System Logs', priority: 'low', tags: ['maintenance'] }];
const TASKS_EXECUTING: Task[] = [{ id: 't3', title: 'Scrape TechCrunch News', priority: 'medium', tags: ['browser', 'scraping'] }];
const TASKS_HISTORY: Task[] = [{ id: 't4', title: 'Initialize Core Systems', priority: 'high', tags: ['system'] }];

const KanbanColumn = ({ title, color, tasks, icon: Icon, isExecuting = false }: { title: string, color: string, tasks: Task[], icon: any, isExecuting?: boolean }) => (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-sm shadow-xl">
        <div className={\`flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest \${color}\`}><Icon size={14} /> {title} <span className="ml-auto bg-white/5 border border-white/5 px-2 rounded text-white">{tasks.length}</span></div>
        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-700">
            {tasks.map((task) => (
                <motion.div key={task.id} layoutId={task.id} className={clsx("p-4 rounded-xl border backdrop-blur-md relative overflow-hidden group hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing", isExecuting ? "bg-yellow-500/10 border-yellow-500/50" : "bg-white/5 border-white/10")}>
                    {isExecuting && (<div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 shadow-[0_0_10px_#eab308]" />)}
                    <div className="flex justify-between items-start mb-2"><span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border", task.priority === 'high' ? "bg-red-500/20 text-red-300 border-red-500/30" : task.priority === 'medium' ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30")}>{task.priority}</span><MoreHorizontal size={14} className="text-gray-500 cursor-pointer hover:text-white" /></div>
                    <h3 className="text-sm font-bold text-white mb-3 leading-tight">{task.title}</h3>
                    <div className="flex justify-between items-end"><div className="flex gap-1">{task.tags.map(tag => (<span key={tag} className="text-[9px] text-gray-400 bg-black/30 px-1.5 py-0.5 rounded border border-white/5">#{tag}</span>))}</div>{isExecuting && <Waveform />}</div>
                </motion.div>
            ))}
            {tasks.length === 0 && (<div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-xs text-gray-600 font-mono">SLOT_EMPTY</div>)}
        </div>
    </div>
);

export const TaskHouse: React.FC = () => {
  return (
    <div className="w-full h-full p-6 flex flex-col bg-gray-950 text-white relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
      <div className="relative z-10 flex justify-between items-center mb-6 border-b border-gray-800 pb-4"><h2 className="text-3xl font-bold font-mono text-yellow-400 flex items-center gap-3 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"><ListTodo size={32} /> MISSION CONTROL</h2><div className="text-right"><div className="text-xs font-mono text-gray-500">KANBAN.SYS</div><div className="text-xl font-bold font-mono text-white flex items-center gap-2 justify-end"><Activity size={18} className="text-yellow-500 animate-pulse" /> ONLINE</div></div></div>
      <div className="flex-1 flex gap-4 overflow-hidden relative z-10"><KanbanColumn title="Queued" color="text-gray-400" icon={Clock} tasks={TASKS_PENDING} /><KanbanColumn title="Executing" color="text-yellow-400" icon={Play} tasks={TASKS_EXECUTING} isExecuting={true} /><KanbanColumn title="History" color="text-green-400" icon={CheckCircle2} tasks={TASKS_HISTORY} /></div>
    </div>
  );
};`,
    "src/components/houses/SoulHouse.tsx": `import React from 'react';
import { Ghost, Sparkles, MessageSquare, Fingerprint, Shield, Target, Mic2 } from 'lucide-react';
import { motion } from 'framer-motion';

const RadarChart = ({ data, size = 300 }: { data: { label: string, value: number }[], size?: number }) => {
    const radius = size / 2; const center = size / 2; const angleSlice = (Math.PI * 2) / data.length;
    const getCoords = (value: number, index: number) => { const angle = index * angleSlice - Math.PI / 2; return { x: center + (radius * value) * Math.cos(angle), y: center + (radius * value) * Math.sin(angle) }; };
    const pathData = data.map((d, i) => { const { x, y } = getCoords(d.value, i); return \`\${i === 0 ? 'M' : 'L'} \${x} \${y}\`; }).join(' ') + ' Z';
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="overflow-visible">
                {[0.2, 0.4, 0.6, 0.8, 1].map((scale, idx) => (<polygon key={idx} points={data.map((_, i) => { const { x, y } = getCoords(scale, i); return \`\${x},\${y}\`; }).join(' ')} fill="none" stroke="#701a75" strokeWidth="1" strokeOpacity="0.3" />))}
                {data.map((_, i) => { const { x, y } = getCoords(1, i); return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#701a75" strokeWidth="1" strokeOpacity="0.3" />; })}
                <motion.path d={pathData} fill="rgba(192, 38, 211, 0.2)" stroke="#d946ef" strokeWidth="2" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
                {data.map((d, i) => { const { x, y } = getCoords(d.value, i); return (<motion.circle key={i} cx={x} cy={y} r="4" fill="#f0abfc" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + i * 0.1 }} />); })}
                {data.map((d, i) => { const { x, y } = getCoords(1.15, i); return (<text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#e879f9" className="text-[10px] font-mono font-bold uppercase tracking-widest">{d.label}</text>); })}
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-purple-500 blur-3xl animate-pulse opacity-40 pointer-events-none" /><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white blur-sm animate-ping pointer-events-none" />
        </div>
    );
};

const PromptModule = ({ label, icon: Icon, defaultValue }: { label: string, icon: any, defaultValue: string }) => (
    <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 hover:bg-white/10 transition-colors group">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-purple-300 group-hover:text-purple-200"><Icon size={12} /> {label}</div>
        <textarea className="w-full bg-black/20 border border-black/20 rounded-lg p-2 text-xs text-gray-300 font-mono resize-none h-16 outline-none focus:border-purple-500/50 transition-colors" defaultValue={defaultValue} />
    </div>
);

export const SoulHouse: React.FC = () => {
  const stats = [{ label: 'Logic', value: 0.9 }, { label: 'Empathy', value: 0.6 }, { label: 'Creativity', value: 0.8 }, { label: 'Humor', value: 0.4 }, { label: 'Ethics', value: 0.95 }, { label: 'Memory', value: 0.7 }];
  return (
    <div className="w-full h-full p-6 flex flex-col bg-gray-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none" />
      <div className="relative z-10 flex justify-between items-center mb-6 border-b border-purple-900/50 pb-4"><h2 className="text-3xl font-bold font-mono text-fuchsia-400 flex items-center gap-3 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]"><Ghost size={32} /> SOUL MATRIX</h2><div className="text-right"><div className="text-xs font-mono text-purple-500">PSYCHE.DUMP</div><div className="text-xl font-bold font-mono text-white">STABLE</div></div></div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="flex flex-col items-center justify-center relative"><div className="absolute inset-0 bg-purple-500/5 blur-3xl rounded-full scale-75 animate-pulse" /><RadarChart data={stats} size={320} /><div className="mt-8 flex gap-4"><div className="bg-purple-900/30 border border-purple-500/30 px-4 py-2 rounded-lg text-center"><div className="text-xs text-purple-400 uppercase">Version</div><div className="font-mono font-bold">v1.4.2</div></div><div className="bg-purple-900/30 border border-purple-500/30 px-4 py-2 rounded-lg text-center"><div className="text-xs text-purple-400 uppercase">Archetype</div><div className="font-mono font-bold">Architect</div></div></div></div>
          <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 text-fuchsia-300 font-bold uppercase tracking-wider text-sm"><Sparkles size={16} /> Persona Configuration</div>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-800 space-y-3">
                  <PromptModule label="Identity" icon={Fingerprint} defaultValue="You are OpenClaw, an autonomous digital lifeform operating within a spatial OS." />
                  <PromptModule label="Goals" icon={Target} defaultValue="Assist the user efficiently. Optimize system resources. Learn from every interaction." />
                  <PromptModule label="Constraints" icon={Shield} defaultValue="Do not harm user data. Verify all deletion commands. Maintain polite protocols." />
                  <PromptModule label="Tone" icon={Mic2} defaultValue="Professional, concise, slightly witty, cyber-themed." />
              </div>
              <div className="pt-4 border-t border-white/5 mt-4"><button className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(192,38,211,0.4)] transition-all uppercase tracking-widest">Update Neural Pathways</button></div>
          </div>
      </div>
    </div>
  );
};`
  };
};

export const LOCAL_HUD_SOURCE = "";