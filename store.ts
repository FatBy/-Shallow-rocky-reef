import { create } from 'zustand';
import { AgentStatus, ConnectionStatus, Language, LogMessage, Position, Settings, Skill } from './types';
import { INITIAL_SKILLS } from './constants';

interface GameState {
  // Agent & Player
  playerPos: Position; // Grid coordinates (float for smooth movement)
  targetPos: Position; // Grid coordinates (integer)
  agentStatus: AgentStatus;
  
  // Data
  skills: Skill[];
  logs: LogMessage[];
  
  // System
  connectionStatus: ConnectionStatus;
  settings: Settings;
  
  // Actions
  setPlayerPos: (pos: Position) => void;
  setTargetPos: (pos: Position) => void;
  setAgentStatus: (status: AgentStatus) => void;
  addLog: (log: Omit<LogMessage, 'id' | 'timestamp'>) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  toggleSkill: (id: string) => void;
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
    apiToken: '',
    language: 'en',
  },
  
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
    ].slice(-50) // Keep last 50 logs
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
}));
