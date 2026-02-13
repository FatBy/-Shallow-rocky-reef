import React from 'react';

export type Language = 'en' | 'zh';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'mock';

export type ConnectionMode = 'local' | 'remote';

export type AgentStatus = 'idle' | 'processing' | 'error';

// The "Regions" of the Digital Brain
export type HouseId = 'world' | 'skills' | 'memory' | 'tasks' | 'soul' | 'console' | 'settings';

// The Protocol: Every House must adhere to this interface
export interface HouseConfig {
  id: HouseId;
  name: string;      // Display Name
  icon: any;         // Lucide Icon Component
  component: React.FC; // The View Component
  description?: string;
  themeColor?: string; // Optional accent color for the Dock/UI
}

export type ThemeColor = 'cyan' | 'amber' | 'emerald' | 'purple' | 'blue';

export interface Skill {
  id: string; // Matches HouseId for navigation
  name: string;
  name_zh: string;
  iconName: string; // Lucide icon name
  description: string;
  enabled: boolean;
  x: number; // Grid X position
  y: number; // Grid Y position
  theme: ThemeColor;
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