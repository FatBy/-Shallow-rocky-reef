import { Skill } from './types';

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

export const WS_URL = 'ws://localhost:18789';
