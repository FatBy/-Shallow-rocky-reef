import { Skill } from './types';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const MAP_SIZE = 20;

export const INITIAL_SKILLS: Skill[] = [
  {
    id: 'skills',
    name: 'Neural Link',
    name_zh: '技能枢纽',
    iconName: 'Brain',
    description: 'Logic Core & Capability Tree',
    enabled: true,
    x: 10,
    y: 10,
    theme: 'cyan'
  },
  {
    id: 'memory',
    name: 'Chronicle',
    name_zh: '记忆回廊',
    iconName: 'Scroll',
    description: 'Historical Archives & Logs',
    enabled: true,
    x: 6,
    y: 14,
    theme: 'amber'
  },
  {
    id: 'tasks',
    name: 'Command',
    name_zh: '任务中枢',
    iconName: 'ListTodo',
    description: 'Mission Control & Status',
    enabled: true,
    x: 14,
    y: 6,
    theme: 'emerald'
  },
  {
    id: 'soul',
    name: 'Soul Matrix',
    name_zh: '灵魂核心',
    iconName: 'Ghost',
    description: 'Personality & Directives',
    enabled: true,
    x: 4,
    y: 4,
    theme: 'purple'
  }
];

export const WS_URL = 'ws://localhost:18789/ws';