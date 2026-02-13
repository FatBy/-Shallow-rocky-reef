import { Terminal, Settings, Home, Brain, Scroll, ListTodo, Ghost } from 'lucide-react';
import { HouseConfig } from '../types';

// Components
import { WorldView } from '../components/WorldView';
import { SkillHouse } from '../components/houses/SkillHouse';
import { MemoryHouse } from '../components/houses/MemoryHouse';
import { TaskHouse } from '../components/houses/TaskHouse';
import { SoulHouse } from '../components/houses/SoulHouse';
import { ConsoleView } from '../components/views/ConsoleView';
import { SettingsView } from '../components/views/SettingsView';

export const HOUSES: HouseConfig[] = [
  { 
    id: 'world', 
    name: 'World', 
    icon: Home, 
    component: WorldView 
  },
  { 
    id: 'skills', 
    name: 'Skills', 
    icon: Brain, 
    component: SkillHouse 
  },
  { 
    id: 'memory', 
    name: 'Memory', 
    icon: Scroll, 
    component: MemoryHouse 
  },
  { 
    id: 'tasks', 
    name: 'Tasks', 
    icon: ListTodo, 
    component: TaskHouse 
  },
  { 
    id: 'soul', 
    name: 'Soul', 
    icon: Ghost, 
    component: SoulHouse 
  },
  // Utilities maintained as houses for Dock access
  { 
    id: 'console', 
    name: 'Console', 
    icon: Terminal, 
    component: ConsoleView 
  },
  { 
    id: 'settings', 
    name: 'Settings', 
    icon: Settings, 
    component: SettingsView 
  },
];