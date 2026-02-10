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
    "src/types.ts": `export type Language = 'en' | 'zh';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'mock';
export type ConnectionMode = 'local' | 'remote';
export type AgentStatus = 'idle' | 'processing' | 'error';

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
    "src/constants.ts": `import { Skill } from './types';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const MAP_SIZE = 20;

export const INITIAL_SKILLS: Skill[] = [
  {
    id: 'browser',
    name: 'Browser',
    name_zh: '无头浏览器',
    iconName: 'Globe',
    description: 'Web navigation and scraping capabilities',
    enabled: true,
    x: 4,
    y: 4,
  },
  {
    id: 'fs',
    name: 'FileSystem',
    name_zh: '文件系统',
    iconName: 'HardDrive',
    description: 'Read and write files to the local system',
    enabled: true,
    x: 8,
    y: 3,
  },
  {
    id: 'python',
    name: 'Python',
    name_zh: 'Python解释器',
    iconName: 'Code',
    description: 'Execute Python scripts in a sandboxed environment',
    enabled: false,
    x: 5,
    y: 8,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    name_zh: '终端',
    iconName: 'Terminal',
    description: 'Execute system commands',
    enabled: true,
    x: 10,
    y: 10,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    name_zh: '邮件服务',
    iconName: 'Mail',
    description: 'Send and read emails',
    enabled: true,
    x: 2,
    y: 8,
  }
];

export const WS_URL = 'http://localhost:18789';`,
    "src/store.ts": `import { create } from 'zustand';
import { AgentStatus, ConnectionStatus, Language, LogMessage, Position, Settings, Skill } from './types';
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
  setPlayerPos: (pos: Position) => void;
  setTargetPos: (pos: Position) => void;
  setAgentStatus: (status: AgentStatus) => void;
  addLog: (log: Omit<LogMessage, 'id' | 'timestamp'>) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  toggleSkill: (id: string) => void;
  setZoomLevel: (zoom: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  playerPos: { x: 0, y: 0 },
  targetPos: { x: 0, y: 0 },
  agentStatus: 'idle',
  skills: INITIAL_SKILLS,
  logs: [
    {
      id: 'init',
      timestamp: Date.now(),
      sender: 'system',
      text: 'System initialized. Waiting for OpenClaw Gateway...',
    },
  ],
  connectionStatus: 'disconnected',
  settings: {
    mode: 'local',
    apiToken: '',
    language: 'en',
    wsUrl: WS_URL,
  },
  zoomLevel: 1.0,
  setPlayerPos: (pos) => set({ playerPos: pos }),
  setTargetPos: (pos) => set({ targetPos: pos }),
  setAgentStatus: (status) => set({ agentStatus: status }),
  addLog: (log) => set((state) => ({
    logs: [
      ...state.logs,
      {
        ...log,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
      }
    ].slice(-50)
  })),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  toggleSkill: (id) => set((state) => ({
    skills: state.skills.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    )
  })),
  setZoomLevel: (zoom) => set({ zoomLevel: Math.max(0.5, Math.min(2.0, zoom)) }),
}));`,
    "src/services/OpenClawService.ts": `import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store';

class OpenClawService {
  private socket: Socket | null = null;
  private mockTimeout: number | null = null;

  connect(token: string) {
    const { setConnectionStatus, addLog, settings } = useGameStore.getState();
    
    if (this.socket && this.socket.connected) {
        return;
    }

    if (settings.mode === 'remote' && !token) {
      addLog({ sender: 'system', text: settings.language === 'en' ? 'Token required for Remote Mode.' : '远程模式需要令牌。' });
      return;
    }

    setConnectionStatus('connecting');
    
    // Determine Connection URL
    // Local: Use "/" to trigger Vite Proxy (bypasses CORS)
    // Remote: Use the exact URL from settings (allows connecting to external servers)
    const connectionUrl = settings.mode === 'local' ? "/" : settings.wsUrl;
    
    const isZh = settings.language === 'zh';
    addLog({ sender: 'system', text: isZh ? \`正在连接: \${connectionUrl} (Socket.io)...\` : \`Connecting to: \${connectionUrl} (Socket.io)...\` });

    this.socket = io(connectionUrl, {
      path: "/socket.io",
      transports: ["websocket"], // Force WebSocket transport
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket.io Connected! ID:", this.socket?.id);
      setConnectionStatus('connected');
      addLog({ sender: 'system', text: 'Gateway Connected (Socket.io).' });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket.io Disconnected:", reason);
      
      setConnectionStatus('disconnected');
      let msg = isZh ? \`连接断开: \${reason}\` : \`Disconnected: \${reason}\`;
      if (reason === "io server disconnect") {
          msg += isZh ? " (服务端主动断开，可能是 Token 无效)" : " (Server disconnected you, possibly invalid Token)";
      }
      addLog({ sender: 'system', text: msg });
    });

    this.socket.on("connect_error", (err) => {
      console.error("⚠️ Connection Error:", err.message);
      const msg = isZh ? \`连接错误: \${err.message}\` : \`Connection Error: \${err.message}\`;
      addLog({ sender: 'system', text: msg });
    });

    this.socket.on("message", (data: any) => {
      console.log("Received:", data);
      let text = "";
      if (typeof data === 'string') text = data;
      else if (data.content) text = data.content;
      else if (data.message) text = data.message;
      else text = JSON.stringify(data);

      addLog({ sender: 'agent', text: text });
      useGameStore.getState().setAgentStatus('idle'); 
    });

    this.socket.on("status", (data: any) => {
        if (data && data.status) {
            useGameStore.getState().setAgentStatus(data.status);
        }
    });
  }

  sendCommand(command: string) {
    const { connectionStatus, addLog, setAgentStatus, settings } = useGameStore.getState();
    const isZh = settings.language === 'zh';

    addLog({ sender: 'user', text: command });

    if (this.socket && this.socket.connected) {
      setAgentStatus('processing');
      this.socket.emit("message", { content: command });
    } else if (connectionStatus === 'mock') {
      this.handleMockCommand(command, isZh);
    } else {
      addLog({ sender: 'system', text: isZh ? '未连接。' : 'Not connected.' });
    }
  }

  handleMockCommand(command: string, isZh: boolean) {
      const { setAgentStatus, addLog } = useGameStore.getState();
      setAgentStatus('processing');
      
      const delay = 500 + Math.random() * 1500;
      if (this.mockTimeout) window.clearTimeout(this.mockTimeout);

      this.mockTimeout = window.setTimeout(() => {
        setAgentStatus('idle');
        const responses = isZh 
          ? [
              \`[模拟] 收到指令: "\${command}"\`,
              \`[模拟] 执行中... 完成。\`,
              \`[模拟] 系统一切正常。\`,
            ]
          : [
              \`[Mock] Command received: "\${command}"\`,
              \`[Mock] Executing... Done.\`,
              \`[Mock] Systems nominal.\`,
            ];
            
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addLog({ sender: 'agent', text: randomResponse });
      }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    useGameStore.getState().setConnectionStatus('disconnected');
  }

  startMockMode() {
    const { setConnectionStatus, addLog, settings } = useGameStore.getState();
    this.disconnect();
    setConnectionStatus('mock');
    addLog({ 
      sender: 'system', 
      text: settings.language === 'zh' ? '已切换至模拟模式。' : 'Switched to Simulation Mode.'
    });
  }
}

export const openClawService = new OpenClawService();`,
    "src/components/GameCanvas.tsx": `import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { MAP_SIZE, TILE_HEIGHT, TILE_WIDTH } from '../constants';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { Skill } from '../types';

const isoToScreen = (x: number, y: number, zoom: number) => {
  return {
    x: (x - y) * (TILE_WIDTH * zoom / 2),
    y: (x + y) * (TILE_HEIGHT * zoom / 2),
  };
};

const screenToIso = (screenX: number, screenY: number, zoom: number) => {
  const halfW = (TILE_WIDTH * zoom) / 2;
  const halfH = (TILE_HEIGHT * zoom) / 2;
  const x = (screenY / halfH + screenX / halfW) / 2;
  const y = (screenY / halfH - screenX / halfW) / 2;
  return { x, y };
};

interface SkillOverlayProps {
  skill: Skill;
  screenX: number;
  screenY: number;
  isActive: boolean;
  zoom: number;
}

const SkillOverlay: React.FC<SkillOverlayProps> = ({ skill, screenX, screenY, isActive, zoom }) => {
  const IconComponent = (Icons as any)[skill.iconName] || Icons.Box;
  const scale = zoom;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: Math.max(0.8, scale), y: isActive ? -10 : 0 }}
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY - (60 * zoom),
        transform: 'translate(-50%, -50%)',
        zIndex: 20,
      }}
      className="pointer-events-none flex flex-col items-center justify-center"
    >
      <div className={\`p-2 rounded-lg shadow-lg border-2 \${isActive ? 'bg-blue-600 border-white text-white' : 'bg-gray-800 border-gray-600 text-gray-300'}\`}>
        <IconComponent size={24} />
      </div>
      <span className="mt-1 text-xs font-bold px-2 py-0.5 rounded bg-black/50 text-white backdrop-blur-sm whitespace-nowrap origin-top">
        {skill.name}
      </span>
      {isActive && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 px-3 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full shadow-lg"
        >
          SPACE to Activate
        </motion.div>
      )}
    </motion.div>
  );
};

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    playerPos, targetPos, setPlayerPos, setTargetPos, skills, agentStatus, zoomLevel, setZoomLevel
  } = useGameStore();

  const [centerOffset, setCenterOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        setCenterOffset({
          x: containerRef.current.clientWidth / 2,
          y: containerRef.current.clientHeight / 4 
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      let dx = 0; let dy = 0;
      if (e.key === 'w' || e.key === 'ArrowUp') { dx = -1; dy = -1; }
      if (e.key === 's' || e.key === 'ArrowDown') { dx = 1; dy = 1; }
      if (e.key === 'a' || e.key === 'ArrowLeft') { dx = -1; dy = 1; }
      if (e.key === 'd' || e.key === 'ArrowRight') { dx = 1; dy = -1; }

      if (dx !== 0 || dy !== 0) {
        const nextX = Math.round(targetPos.x + dx);
        const nextY = Math.round(targetPos.y + dy);
        if (nextX >= 0 && nextX < MAP_SIZE && nextY >= 0 && nextY < MAP_SIZE) {
          setTargetPos({ x: nextX, y: nextY });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetPos, setTargetPos]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const adjustedX = x - centerOffset.x;
    const adjustedY = y - centerOffset.y - (TILE_HEIGHT * zoomLevel / 2);
    const gridPos = screenToIso(adjustedX, adjustedY, zoomLevel);
    const targetX = Math.round(gridPos.x);
    const targetY = Math.round(gridPos.y);

    if (targetX >= 0 && targetX < MAP_SIZE && targetY >= 0 && targetY < MAP_SIZE) {
      setTargetPos({ x: targetX, y: targetY });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(zoomLevel + delta);
  };

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const lerpSpeed = 0.15;
      const newX = playerPos.x + (targetPos.x - playerPos.x) * lerpSpeed;
      const newY = playerPos.y + (targetPos.y - playerPos.y) * lerpSpeed;
      
      if (Math.abs(newX - targetPos.x) > 0.01 || Math.abs(newY - targetPos.y) > 0.01) {
        setPlayerPos({ x: newX, y: newY });
      }

      const offsetX = centerOffset.x;
      const offsetY = centerOffset.y;
      const TW = TILE_WIDTH * zoomLevel;
      const TH = TILE_HEIGHT * zoomLevel;

      for (let x = 0; x < MAP_SIZE; x++) {
        for (let y = 0; y < MAP_SIZE; y++) {
          const screen = isoToScreen(x, y, zoomLevel);
          const drawX = screen.x + offsetX;
          const drawY = screen.y + offsetY;

          ctx.beginPath();
          ctx.moveTo(drawX, drawY);
          ctx.lineTo(drawX + TW / 2, drawY + TH / 2);
          ctx.lineTo(drawX, drawY + TH);
          ctx.lineTo(drawX - TW / 2, drawY + TH / 2);
          ctx.closePath();

          ctx.fillStyle = (x + y) % 2 === 0 ? '#1f2937' : '#374151'; 
          ctx.fill();
          
          ctx.strokeStyle = '#4b5563';
          ctx.lineWidth = 0.5 * zoomLevel;
          ctx.stroke();

          if (x === Math.round(targetPos.x) && y === Math.round(targetPos.y)) {
             ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
             ctx.fill();
          }
        }
      }

      const renderList: any[] = [];
      skills.forEach(s => renderList.push({ type: 'skill', x: s.x, y: s.y, data: s }));
      renderList.push({ type: 'player', x: playerPos.x, y: playerPos.y, data: null });
      renderList.sort((a, b) => (a.x + a.y) - (b.x + b.y));

      renderList.forEach(item => {
        const screen = isoToScreen(item.x, item.y, zoomLevel);
        const drawX = screen.x + offsetX;
        const drawY = screen.y + offsetY;

        if (item.type === 'skill') {
          const height = 20 * zoomLevel; 
          ctx.fillStyle = '#4f46e5'; 
          ctx.beginPath();
          ctx.moveTo(drawX, drawY - height);
          ctx.lineTo(drawX + TW / 2, drawY + TH / 2 - height);
          ctx.lineTo(drawX, drawY + TH - height);
          ctx.lineTo(drawX - TW / 2, drawY + TH / 2 - height);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#818cf8';
          ctx.lineWidth = 1 * zoomLevel;
          ctx.stroke();

          ctx.fillStyle = '#3730a3'; 
          ctx.beginPath();
          ctx.moveTo(drawX + TW / 2, drawY + TH / 2 - height);
          ctx.lineTo(drawX + TW / 2, drawY + TH / 2);
          ctx.lineTo(drawX, drawY + TH);
          ctx.lineTo(drawX, drawY + TH - height);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#312e81'; 
          ctx.beginPath();
          ctx.moveTo(drawX - TW / 2, drawY + TH / 2 - height);
          ctx.lineTo(drawX - TW / 2, drawY + TH / 2);
          ctx.lineTo(drawX, drawY + TH);
          ctx.lineTo(drawX, drawY + TH - height);
          ctx.closePath();
          ctx.fill();

        } else if (item.type === 'player') {
          const pY = drawY - (10 * zoomLevel); 
          const radius = 8 * zoomLevel;
          
          ctx.beginPath();
          ctx.ellipse(drawX, drawY + TH/2, 10 * zoomLevel, 5 * zoomLevel, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(drawX, pY, radius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          
          const time = Date.now() / 500;
          const orbitRadius = 20 * zoomLevel;
          const droneRadius = 5 * zoomLevel;
          const droneX = drawX + Math.cos(time) * orbitRadius;
          const droneY = pY - orbitRadius + Math.sin(time) * (5 * zoomLevel);
          
          ctx.beginPath();
          ctx.arc(droneX, droneY, droneRadius, 0, Math.PI * 2);
          if (agentStatus === 'idle') ctx.fillStyle = '#60a5fa'; 
          else if (agentStatus === 'processing') ctx.fillStyle = '#fbbf24'; 
          else if (agentStatus === 'error') ctx.fillStyle = '#ef4444'; 
          ctx.fill();
          
          if (agentStatus === 'processing') {
             ctx.strokeStyle = '#fbbf24';
             ctx.lineWidth = 2 * zoomLevel;
             ctx.beginPath();
             ctx.arc(droneX, droneY, droneRadius + 3 * zoomLevel, time * 2, time * 2 + Math.PI);
             ctx.stroke();
          }
        }
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerPos, targetPos, centerOffset, skills, agentStatus, zoomLevel]);

  const activeSkill = skills.find(s => 
    Math.abs(s.x - Math.round(playerPos.x)) < 0.5 && 
    Math.abs(s.y - Math.round(playerPos.y)) < 0.5
  );

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900 overflow-hidden">
      <canvas ref={canvasRef} onClick={handleCanvasClick} onWheel={handleWheel} className="block cursor-pointer outline-none" />
      <div className="absolute inset-0 pointer-events-none">
        {skills.map(skill => {
            const screen = isoToScreen(skill.x, skill.y, zoomLevel);
            return (
                <SkillOverlay key={skill.id} skill={skill} screenX={screen.x + centerOffset.x} screenY={screen.y + centerOffset.y} isActive={activeSkill?.id === skill.id} zoom={zoomLevel} />
            );
        })}
      </div>
      <div className="absolute bottom-4 left-4 pointer-events-none text-white/30 text-xs font-mono">
        ZOOM: {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
};`,
    "src/App.tsx": `import React, { useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { useGameStore } from './store';

function App() {
  const { connectionStatus } = useGameStore();

  useEffect(() => {
  }, []);

  return (
    <div className="relative w-screen h-screen bg-gray-900 overflow-hidden font-sans select-none">
       <div className="absolute inset-0 z-0">
         <GameCanvas />
       </div>
       <div className="absolute inset-0 z-10 pointer-events-none">
         <HUD />
       </div>
       {connectionStatus === 'disconnected' && (
         <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-blue-600/90 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur">
              Click Settings to Configure Connection
            </div>
         </div>
       )}
    </div>
  );
}

export default App;`
  };
};

// We need to provide a simplified version of HUD code for the installer to write, 
// to avoid recursive dependency issues when it tries to write itself.
// This string contains the full source code of the HUD component used in the Local version.
export const LOCAL_HUD_SOURCE = `import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { openClawService } from '../services/OpenClawService';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Activity, Zap, Terminal, ChevronDown, ChevronUp, HelpCircle, Globe, AlertTriangle, RotateCcw, Laptop, Cloud } from 'lucide-react';
import { clsx } from 'clsx';
import { INITIAL_SKILLS, WS_URL } from '../constants';
import { ConnectionMode } from '../types';

export const HUD: React.FC = () => {
  const { logs, settings, connectionStatus, agentStatus, updateSettings, playerPos } = useGameStore();
  const [inputValue, setInputValue] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    openClawService.sendCommand(inputValue);
    setInputValue('');
  };

  const sanitizeUrl = (url: string) => {
    let cleaned = url.trim();
    if (!cleaned.match(/^(http|https|ws|wss):\\/\\//)) {
         if (cleaned.includes('localhost') || cleaned.includes('127.0.0.1')) cleaned = 'http://' + cleaned;
         else cleaned = 'https://' + cleaned;
    }
    return cleaned;
  };

  const handleConnect = () => {
     if (settings.mode === 'remote') {
         const clean = sanitizeUrl(settings.wsUrl);
         if (clean !== settings.wsUrl) updateSettings({ wsUrl: clean });
     }
     openClawService.connect(settings.apiToken);
  };

  const handleUrlBlur = () => {
      const clean = sanitizeUrl(settings.wsUrl);
      if (clean !== settings.wsUrl) updateSettings({ wsUrl: clean });
  };

  const handleResetUrl = () => updateSettings({ wsUrl: WS_URL });

  const handleModeChange = (mode: ConnectionMode) => {
      if (mode === 'local') {
          updateSettings({ mode, wsUrl: WS_URL });
      } else {
          updateSettings({ mode });
      }
  };

  const handleDemoMode = () => {
    updateSettings({ apiToken: 'demo-token' });
    setTimeout(() => {
        openClawService.disconnect();
        openClawService.connect('demo-token');
    }, 50);
  };
  
  const activeSkill = INITIAL_SKILLS.find(s => 
    Math.round(s.x) === Math.round(playerPos.x) && 
    Math.round(s.y) === Math.round(playerPos.y)
  );

  const isZh = settings.language === 'zh';
  
  const statusLabels = {
      connected: isZh ? '已连接' : 'CONNECTED',
      connecting: isZh ? '连接中...' : 'CONNECTING',
      disconnected: isZh ? '未连接' : 'DISCONNECTED',
      mock: isZh ? '模拟模式' : 'SIMULATION',
      error: isZh ? '错误' : 'ERROR'
  };

  const statusColors = {
      connected: "bg-green-500 shadow-[0_0_10px_#22c55e]",
      connecting: "bg-yellow-500 animate-pulse",
      disconnected: "bg-red-500",
      mock: "bg-purple-500 shadow-[0_0_10px_#a855f7]",
      error: "bg-red-700"
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-2">
           <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-gray-700 text-white shadow-xl flex items-center gap-3">
              <div className={clsx("w-3 h-3 rounded-full", statusColors[connectionStatus] || "bg-gray-500")} />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{isZh ? '系统状态' : 'Status'}</span>
                <span className="text-sm font-semibold">{statusLabels[connectionStatus]}</span>
              </div>
           </div>
           <AnimatePresence>
           {agentStatus !== 'idle' && (
             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="bg-yellow-500/20 backdrop-blur-md p-2 rounded-lg border border-yellow-500/50 text-yellow-200 flex items-center gap-2">
                <Activity size={16} className="animate-spin" />
                <span className="text-xs font-bold">{isZh ? 'Agent 运行中...' : 'AGENT PROCESSING...'}</span>
             </motion.div>
           )}
           </AnimatePresence>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-gray-700 text-white hover:bg-gray-800 transition-colors">
          <Settings size={20} />
        </button>
      </div>

      <div className={clsx("flex gap-4 items-end pointer-events-auto w-full max-w-5xl mx-auto transition-all duration-300", isChatMinimized ? "h-auto" : "h-1/3")}>
        <div className="flex-1 h-full bg-black/60 backdrop-blur-md rounded-lg border border-gray-700 flex flex-col overflow-hidden shadow-2xl transition-all duration-300">
          <div className="bg-gray-900/50 p-2 border-b border-gray-700 flex justify-between items-center cursor-pointer" onClick={() => setIsChatMinimized(!isChatMinimized)}>
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Terminal size={14} /> OpenClaw {isZh ? '控制台' : 'Console'}</span>
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">v1.0.0</span>
                <button className="text-gray-400 hover:text-white">{isChatMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
             </div>
          </div>
          
          {!isChatMinimized && (
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {logs.length === 0 && <div className="text-gray-500 italic text-sm text-center mt-10">{isZh ? '暂无记录' : 'No activity recorded.'}</div>}
                {logs.map((log) => (
                <div key={log.id} className={clsx("text-sm break-words", log.sender === 'user' ? "text-cyan-400" : log.sender === 'agent' ? "text-green-400" : "text-gray-400 italic")}>
                    <span className="opacity-50 text-xs mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="font-bold mr-2">{log.sender === 'user' ? '>' : log.sender === 'agent' ? '●' : '!'}</span>
                    {log.text}
                </div>
                ))}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="p-2 bg-gray-900/80 border-t border-gray-700 flex gap-2 items-center">
             <div className={clsx("hidden md:flex items-center gap-2 px-2 py-1 rounded border text-[10px] font-bold uppercase select-none mr-1 transition-colors", connectionStatus === 'connected' ? "bg-green-900/30 border-green-700 text-green-400" : connectionStatus === 'mock' ? "bg-purple-900/30 border-purple-700 text-purple-400" : "bg-red-900/30 border-red-700 text-red-400")} title={isZh ? '当前连接状态' : 'Current Connection Status'}>
                 <div className={clsx("w-1.5 h-1.5 rounded-full", statusColors[connectionStatus])} />
                 <span>{statusLabels[connectionStatus]}</span>
             </div>
             <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={activeSkill ? \`Execute \${activeSkill.name} command...\` : (isZh ? "输入指令..." : "Enter command...")} className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 font-mono text-sm" autoFocus disabled={connectionStatus === 'connecting'} />
             <button type="submit" className="text-cyan-500 hover:text-cyan-400 disabled:opacity-50" disabled={connectionStatus === 'connecting'}><Zap size={18} /></button>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-96 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-4">
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="text-cyan-500" /> {isZh ? '设置' : 'Settings'}</h2>
                  <div className="flex bg-gray-800 rounded p-1">
                      <button onClick={() => handleModeChange('local')} className={clsx("px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all", settings.mode === 'local' ? "bg-cyan-600 text-white shadow" : "text-gray-400 hover:text-white")}><Laptop size={12} /> Local</button>
                      <button onClick={() => handleModeChange('remote')} className={clsx("px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all", settings.mode === 'remote' ? "bg-purple-600 text-white shadow" : "text-gray-400 hover:text-white")}><Cloud size={12} /> Remote</button>
                  </div>
              </div>
              
              <div className="space-y-4">
                <div>
                   <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Globe size={12} /> {settings.mode === 'local' ? 'Gateway (Proxy)' : 'Gateway URL'}</label>
                        {settings.mode === 'remote' && <button onClick={handleResetUrl} title="Reset to Default" className="text-gray-500 hover:text-white transition-colors"><RotateCcw size={12} /></button>}
                   </div>
                   {settings.mode === 'local' ? (
                       <div className="p-2 bg-gray-800/50 border border-gray-700 rounded text-xs text-gray-400 font-mono">
                         /api (Proxied to http://localhost:18789)
                       </div>
                   ) : (
                       <input type="text" value={settings.wsUrl} onChange={(e) => updateSettings({ wsUrl: e.target.value })} onBlur={handleUrlBlur} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white outline-none text-sm font-mono transition-colors focus:border-cyan-500" placeholder="http://your-server-ip:8080" />
                   )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Authorization Token</label>
                  <input type="password" value={settings.apiToken} onChange={(e) => updateSettings({ apiToken: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-cyan-500 outline-none text-sm" placeholder={settings.mode === 'local' ? "(Optional for local mode)" : "e.g. oc_8x9s..."} />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Language / 语言</label>
                  <div className="flex gap-2">
                    <button onClick={() => updateSettings({ language: 'en' })} className={clsx("flex-1 p-2 rounded border text-sm", settings.language === 'en' ? "bg-cyan-600 border-cyan-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400")}>English</button>
                    <button onClick={() => updateSettings({ language: 'zh' })} className={clsx("flex-1 p-2 rounded border text-sm", settings.language === 'zh' ? "bg-cyan-600 border-cyan-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400")}>中文</button>
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                    <button onClick={handleConnect} className="flex-1 bg-green-600 hover:bg-green-500 font-bold py-2 rounded transition-colors text-white">{settings.mode === 'local' ? (isZh ? "连接本地" : "Connect Local") : (isZh ? "连接远程" : "Connect Remote")}</button>
                    <button type="button" onClick={handleDemoMode} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded transition-colors">{settings.language === 'zh' ? "模拟演示" : "Demo Mode"}</button>
                    <button onClick={() => setIsSettingsOpen(false)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors">{isZh ? "关闭" : "Close"}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};`;