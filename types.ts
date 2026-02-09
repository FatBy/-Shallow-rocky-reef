export type Language = 'en' | 'zh';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'mock';

export type ConnectionMode = 'local' | 'remote';

export type AgentStatus = 'idle' | 'processing' | 'error';

export interface Skill {
  id: string;
  name: string;
  name_zh: string;
  iconName: string; // Lucide icon name
  description: string;
  enabled: boolean;
  x: number; // Grid X position
  y: number; // Grid Y position
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
}